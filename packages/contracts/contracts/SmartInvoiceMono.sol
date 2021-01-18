// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IArbitrable.sol";
import "./IArbitrator.sol";

interface IWETH {
  // brief interface for canonical ether token wrapper contract
  function deposit() external payable;
}

// splittable digital deal invoices w/ embedded arbitration tailored for guild work
contract SmartInvoiceMono is Context, IArbitrable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  uint256 internal constant DISPUTES_POSSIBLE_OUTCOMES = 5; // excludes options 0, 1 and 2
  // Note that Aragon Court treats the possible outcomes as arbitrary numbers, leaving the Arbitrable (us) to define how to understand them.
  // Some outcomes [0, 1, and 2] are reserved by Aragon Court: "missing", "leaked", and "refused", respectively.
  // Note that Aragon Court emits the LOWEST outcome in the event of a tie.

  uint8[][] public rulings = [
    [1, 1], // 0 = missing
    [1, 1], // 1 = leaked
    [1, 1], // 2 = refused
    [1, 0], // 3 = 100% to client
    [3, 1], // 4 = 75% to client
    [1, 1], // 5 = 50% to client
    [1, 3], // 6 = 25% to client
    [0, 1] // 7 = 0% to client
  ];

  /** kovan wETH **/
  // address public wETH = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
  /** rinkeby wETH **/
  address public wETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
  uint256 public invoiceCount;
  uint256 public constant MAX_DURATION = 63113904; // 2-year limit on invoice
  mapping(uint256 => Invoice) public invoices;
  mapping(uint256 => uint256) public disputes;

  enum ADR {LEX_DAO, ARAGON_COURT}

  struct Invoice {
    address client;
    address provider;
    ADR resolverType;
    address resolver;
    address token;
    bool locked;
    uint256[] amounts; // milestones split into amounts
    uint256 milestone; // current milestone - starts from 0 to amounts.length-1
    uint256 total;
    uint256 balance;
    uint256 released;
    uint256 terminationTime;
    bytes32 details;
  }

  event Register(
    uint256 indexed index,
    address indexed client,
    address indexed provider,
    uint256[] amounts
  );
  event Deposit(uint256 indexed index, address indexed sender, uint256 amount);
  event Release(
    uint256 indexed index,
    uint256 indexed milestone,
    uint256 amount
  );
  event Withdraw(uint256 indexed index, uint256 balance);
  event Lock(uint256 indexed index, address indexed sender, bytes32 details);
  event Resolve(
    address indexed resolver,
    uint256 indexed index,
    uint256 clientAward,
    uint256 providerAward,
    uint256 resolutionFee,
    bytes32 details
  );
  event DisputeFee(
    uint256 indexed index,
    uint256 indexed disputeId,
    address indexed disputeToken,
    uint256 disputeFee
  );
  event Rule(
    address indexed resolver,
    uint256 indexed index,
    uint256 clientAward,
    uint256 providerAward,
    uint256 ruling
  );

  function register(
    // register invoice for token deposit & client deal confirmation
    address client,
    address provider,
    uint8 resolverType,
    address resolver,
    address token,
    uint256[] calldata amounts,
    uint256 terminationTime, // exact termination date in seconds since epoch
    bytes32 details
  ) external {
    require(resolverType <= uint8(ADR.ARAGON_COURT), "invalid resolverType");
    require(terminationTime > block.timestamp, "ends before now");
    require(
      terminationTime <= block.timestamp.add(MAX_DURATION),
      "duration maxed"
    );

    uint256 total;
    for (uint256 i = 0; i < amounts.length; i++) {
      total = total.add(amounts[i]);
    }

    uint256 index = invoiceCount;
    invoiceCount = invoiceCount.add(1);

    invoices[index] = Invoice(
      client,
      provider,
      ADR(resolverType),
      resolver,
      token,
      // false,
      false,
      amounts,
      0,
      total,
      0,
      0,
      terminationTime,
      details
    );

    emit Register(index, client, provider, amounts);
  }

  function deposit(uint256 index, uint256 amount)
    external
    payable
    nonReentrant
  {
    // client (or anybody) deposits amount in invoice
    Invoice storage invoice = invoices[index];

    require(!invoice.locked, "locked");
    require(amount > 0, "amount is zero");
    require(
      amount <= invoice.total.sub(invoice.balance).sub(invoice.released),
      "amount too large"
    );

    if (invoice.token == wETH && msg.value > 0) {
      require(msg.value == amount, "!ETH");
      IWETH(wETH).deposit{value: msg.value}();
    } else {
      IERC20(invoice.token).safeTransferFrom(
        _msgSender(),
        address(this),
        amount
      );
    }
    invoice.balance = invoice.balance.add(amount);

    emit Deposit(index, _msgSender(), amount);
  }

  function release(uint256 index) external nonReentrant {
    // client transfers invoice milestone amount to provider
    Invoice storage invoice = invoices[index];

    require(!invoice.locked, "locked");
    require(invoice.total > invoice.released, "released");
    require(_msgSender() == invoice.client, "!client");

    uint256 currentMilestone = invoice.milestone;
    invoice.milestone = invoice.milestone.add(1);

    uint256 amount = invoice.amounts[currentMilestone];
    require(invoice.balance >= amount, "insufficient balance");

    IERC20(invoice.token).safeTransfer(invoice.provider, amount);
    invoice.released = invoice.released.add(amount);
    invoice.balance = invoice.balance.sub(amount);

    emit Release(index, currentMilestone, amount);
  }

  function withdraw(uint256 index) external nonReentrant {
    // withdraw invoice balance to client if termination time passes & no lock
    Invoice storage invoice = invoices[index];

    require(!invoice.locked, "locked");
    require(invoice.balance > 0, "balance is zero");
    require(block.timestamp > invoice.terminationTime, "!terminated");

    IERC20(invoice.token).safeTransfer(invoice.client, invoice.balance);

    emit Withdraw(index, invoice.balance);
  }

  function lock(uint256 index, bytes32 details) external nonReentrant {
    // client or main (0) provider can lock balance for resolution during invoice period / update request details
    Invoice storage invoice = invoices[index];

    require(!invoice.locked, "locked");
    require(invoice.balance > 0, "balance is zero");
    require(block.timestamp < invoice.terminationTime, "terminated");
    require(
      _msgSender() == invoice.client || _msgSender() == invoice.provider,
      "!party"
    );

    if (invoice.resolverType == ADR.ARAGON_COURT) {
      IArbitrator arbitrator = IArbitrator(invoice.resolver);
      (address disputeToken, uint256 disputeFee) =
        _payDisputeFees(invoice.resolver, index);
      uint256 disputeId =
        arbitrator.createDispute(
          DISPUTES_POSSIBLE_OUTCOMES,
          abi.encodePacked(details)
        );
      disputes[disputeId] = index;
      emit DisputeFee(index, disputeId, disputeToken, disputeFee);
    }
    invoice.locked = true;

    emit Lock(index, _msgSender(), details);
  }

  function _payDisputeFees(address _adr, uint256 index)
    internal
    returns (address, uint256)
  {
    Invoice storage invoice = invoices[index];
    IArbitrator arbitrator = IArbitrator(_adr);
    (, IERC20 feeToken, uint256 feeAmount) = arbitrator.getDisputeFees();
    if (address(feeToken) == invoice.token) {
      uint256 balance = invoice.balance;
      // // sender can pay extra dispute fees
      // if (feeAmount > balance) {
      //   feeToken.safeTransferFrom(_msgSender(), address(this), feeAmount.sub(balance));
      // }
      require(balance > feeAmount, "feeAmount > balance"); // can't raise dispute if balance <= feeAmount
    } else {
      feeToken.safeTransferFrom(_msgSender(), address(this), feeAmount); // sender must pay dispute fees
    }
    require(feeToken.approve(_adr, feeAmount), "fee not approved");
    return (address(feeToken), feeAmount);
  }

  function resolve(
    uint256 index,
    uint256 clientAward,
    uint256 providerAward,
    bytes32 details
  ) external nonReentrant {
    // called by lex dao
    Invoice storage invoice = invoices[index];
    require(invoice.resolverType == ADR.LEX_DAO, "!lex");
    require(invoice.locked, "!locked");
    require(invoice.balance > 0, "balance is zero");
    require(_msgSender() == invoice.resolver, "!resolver");

    uint256 balance = invoice.balance;
    uint256 resolutionFee = balance.div(20); // calculates dispute resolution fee (5% of balance)

    require(
      clientAward.add(providerAward) == balance.sub(resolutionFee),
      "resolution != balance"
    );
    IERC20(invoice.token).safeTransfer(invoice.provider, providerAward);
    IERC20(invoice.token).safeTransfer(invoice.client, clientAward);
    IERC20(invoice.token).safeTransfer(invoice.resolver, resolutionFee);

    invoice.released = invoice.released.add(balance);
    invoice.locked = false;

    emit Resolve(
      _msgSender(),
      index,
      clientAward,
      providerAward,
      resolutionFee,
      details
    );
  }

  function rule(uint256 _disputeId, uint256 _ruling)
    external
    override
    nonReentrant
  {
    // called by aragon court
    require(_ruling <= rulings.length, "invalid ruling");
    uint256 index = disputes[_disputeId];
    Invoice storage invoice = invoices[index];
    require(invoice.resolverType == ADR.ARAGON_COURT, "!aragon");
    require(invoice.locked, "!locked");
    require(invoice.balance > 0, "balance is zero");
    require(_msgSender() == invoice.resolver, "!resolver");

    uint256 balance = invoice.balance;
    uint8[] storage ruling = rulings[_ruling];
    uint8 clientShare = ruling[0];
    uint8 providerShare = ruling[1];
    uint8 denom = clientShare + providerShare;
    uint256 providerAward = balance.mul(providerShare).div(denom);
    uint256 clientAward = balance.sub(providerAward);

    if (providerAward > 0) {
      IERC20(invoice.token).safeTransfer(invoice.provider, providerAward);
    }
    if (clientAward > 0) {
      IERC20(invoice.token).safeTransfer(invoice.client, clientAward);
    }

    invoice.released = invoice.released.add(balance);
    invoice.locked = false;

    emit Rule(_msgSender(), index, clientAward, providerAward, _ruling);
  }
}
