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
  function deposit() external payable;
}

// splittable digital deal escrows w/ embedded arbitration tailored for guild work
contract SmartEscrowMono is Context, IArbitrable, ReentrancyGuard {
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
  address public wETH = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
  uint256 public escrowCount;
  uint256 public constant MAX_DURATION = 63113904; // 2-year limit on escrow
  mapping(uint256 => Escrow) public escrows;
  mapping(uint256 => uint256) public disputes;

  enum ADR {LEX_DAO, ARAGON_COURT}
  
  struct Escrow {
    address client;
    address provider;
    ADR resolverType;
    address resolver;
    address token;
    // bool confirmed;
    bool locked;
    uint256[] amounts; // milestones split into amounts
    uint256 milestone; // current milestone - starts from 0 to amounts.length
    uint256 total;
    uint256 balance;
    uint256 released;
    uint256 terminationTime;
    bytes32 details;
  }

  event Register(
    address indexed client,
    address indexed provider,
    uint256 index
  );
  event Deposit(
    uint256 index,
    uint256 amount
  );
  event Release(
    uint256 indexed index,
    uint256 indexed milestone,
    uint256 amount
  );
  event Withdraw(uint256 indexed index, uint256 indexed balance);
  event Lock(
    address indexed sender,
    uint256 indexed index,
    bytes32 indexed details
  );
  event Resolve(
    address indexed resolver,
    uint256 indexed clientAward,
    uint256 indexed providerAward,
    uint256 index,
    uint256 resolutionFee,
    bytes32 details
  );
  event Rule(address indexed resolver, uint256 index, uint256 ruling);

  function register(
    // register escrow for token deposit & client deal confirmation
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

    escrowCount = escrowCount + 1;
    uint256 index = escrowCount;

    escrows[index] = Escrow(
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

    emit Register(client, provider, index);
  }

  function deposit(uint256 index, uint256 amount) external payable nonReentrant {
    // client (or anybody) deposits amount in escrow
    Escrow storage escrow = escrows[index];

    require(!escrow.locked, "locked");
    require(amount > 0, "amount is zero");
    require(amount <= escrow.total - escrow.balance - escrow.released, "amount too large");

    if (escrow.token == wETH && msg.value > 0) {
      require(msg.value == amount, "!ETH");
      IWETH(wETH).deposit{value: msg.value}();
    } else {
      IERC20(escrow.token).safeTransferFrom(msg.sender, address(this), amount);
    }
    escrow.balance = escrow.balance.add(amount);

    emit Deposit(index, amount);
  }

  function release(uint256 index) external nonReentrant {
    // client transfers escrow milestone amount to provider
    Escrow storage escrow = escrows[index];

    // require(escrow.confirmed, "!confirmed");
    require(!escrow.locked, "locked");
    require(escrow.total > escrow.released, "released");
    require(_msgSender() == escrow.client, "!client");

    uint256 currentMilestone = escrow.milestone;
    escrow.milestone = escrow.milestone.add(1);

    uint256 amount = escrow.amounts[currentMilestone];
    require(escrow.balance >= amount, "insufficient balance");

    IERC20(escrow.token).safeTransfer(escrow.provider, amount);
    escrow.released = escrow.released.add(amount);
    escrow.balance = escrow.balance.sub(amount);

    emit Release(index, currentMilestone, amount);
  }

  function withdraw(uint256 index) external nonReentrant {
    // withdraw escrow balance to client if termination time passes & no lock
    Escrow storage escrow = escrows[index];

    // require(escrow.confirmed, "!confirmed");
    require(!escrow.locked, "locked");
    require(escrow.balance > 0, "balance is zero");
    require(block.timestamp > escrow.terminationTime, "!terminated");

    IERC20(escrow.token).safeTransfer(escrow.client, escrow.balance);

    emit Withdraw(index, escrow.balance);
  }

  function lock(uint256 index, bytes32 details) external nonReentrant {
    // client or main (0) provider can lock balance for resolution during escrow period / update request details
    Escrow storage escrow = escrows[index];

    // require(escrow.confirmed, "!confirmed");
    require(!escrow.locked, "locked");
    require(escrow.balance > 0, "balance is zero");
    require(block.timestamp < escrow.terminationTime, "terminated");
    require(
      _msgSender() == escrow.client || _msgSender() == escrow.provider,
      "!party"
    );

    if (escrow.resolverType == ADR.ARAGON_COURT) {
      IArbitrator arbitrator = IArbitrator(escrow.resolver);
      payDisputeFees(escrow.resolver, escrow);
      uint256 disputeId = arbitrator.createDispute(
        DISPUTES_POSSIBLE_OUTCOMES,
        abi.encodePacked(details)
      );
      disputes[disputeId] = index;
    }
    escrow.locked = true;

    emit Lock(_msgSender(), index, details);
  }

  function payDisputeFees(address _adr, Escrow storage escrow) internal {
    IArbitrator arbitrator = IArbitrator(_adr);
    (, IERC20 feeToken, uint256 feeAmount) = arbitrator.getDisputeFees();
    if (address(feeToken) == escrow.token) {
      uint256 balance = escrow.balance;
      // // sender can pay extra dispute fees
      // if (feeAmount > balance) {
      //   feeToken.safeTransferFrom(msg.sender, address(this), feeAmount - balance);
      // }
      require(balance > feeAmount, "feeAmount > balance"); // can't raise dispute if balance <= feeAmount
    } else {
      feeToken.safeTransferFrom(msg.sender, address(this), feeAmount); // sender must pay dispute fees
    }
    require(feeToken.approve(_adr, feeAmount), "fee not approved");
  }

  function resolve(
    uint256 index,
    uint256 clientAward,
    uint256 providerAward,
    bytes32 details
  ) external nonReentrant {
    // called by lex dao
    Escrow storage escrow = escrows[index];
    require(escrow.resolverType == ADR.LEX_DAO, "!lex");
    require(escrow.locked, "!locked");
    require(escrow.balance > 0, "balance is zero");
    require(_msgSender() == escrow.resolver, "!resolver");

    uint256 balance = escrow.balance;
    uint256 resolutionFee = balance.div(20); // calculates dispute resolution fee (5% of balance)

    require(
      clientAward.add(providerAward) == balance.sub(resolutionFee),
      "resolution != balance"
    );
    IERC20(escrow.token).safeTransfer(escrow.provider, providerAward);
    IERC20(escrow.token).safeTransfer(escrow.client, clientAward);
    IERC20(escrow.token).safeTransfer(escrow.resolver, resolutionFee);

    escrow.released = escrow.released.add(balance);
    escrow.locked = false;

    emit Resolve(
      _msgSender(),
      clientAward,
      providerAward,
      index,
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
    Escrow storage escrow = escrows[index];
    require(escrow.resolverType == ADR.ARAGON_COURT, "!aragon");
    require(escrow.locked, "!locked");
    require(escrow.balance > 0, "balance is zero");
    require(_msgSender() == escrow.resolver, "!resolver");

    uint256 balance = escrow.balance;
    uint8[] storage ruling = rulings[_ruling];
    uint8 clientShare = ruling[0];
    uint8 providerShare = ruling[1];
    uint8 denom = clientShare + providerShare;
    uint256 providerAward = balance.mul(providerShare).div(denom);
    uint256 clientAward = balance.sub(providerAward);

    if (providerAward > 0) {
      IERC20(escrow.token).safeTransfer(escrow.provider, providerAward);
    }
    if (clientAward > 0) {
      IERC20(escrow.token).safeTransfer(escrow.client, clientAward);
    }

    escrow.released = escrow.released.add(balance);
    escrow.locked = false;

    emit Rule(_msgSender(), index, _ruling);
  }
}
