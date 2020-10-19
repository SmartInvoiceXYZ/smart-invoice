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

// splittable digital deal lockers w/ embedded arbitration tailored for guild work
contract SmartEscrow is Context, IArbitrable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  uint256 internal constant DISPUTES_POSSIBLE_OUTCOMES = 5; // excludes options 0, 1 and 2
  // Note that Aragon Court treats the possible outcomes as arbitrary numbers, leaving the Arbitrable (us) to define how to understand them.
  // Some outcomes [0, 1, and 2] are reserved by Aragon Court: "missing", "leaked", and "refused", respectively.
  // Note that Aragon Court emits the lowest outcome in the event of a tie
  uint256 internal constant DISPUTES_RULING_50_50 = 3;
  uint256 internal constant DISPUTES_RULING_75_25 = 4;
  uint256 internal constant DISPUTES_RULING_25_75 = 5;
  uint256 internal constant DISPUTES_RULING_100_0 = 6;
  uint256 internal constant DISPUTES_RULING_0_100 = 7;

  /** kovan wETH **/
  address public wETH = 0xd0A1E359811322d97991E03f863a0C30C2cF029C; // canonical ether token wrapper contract reference (kovan)
  uint256 public constant MAX_DURATION = 63113904; // 2-year limit on locker

  enum ADR {LEX_DAO, ARAGON_COURT}

  address public client;
  address public provider;
  ADR public resolverType;
  address public resolver;
  address public token;
  bool public confirmed;
  bool public locked;
  uint256[] public amounts; // milestones split into amounts
  uint256 public milestone = 0; // current milestone - starts from 0 to amounts.length
  uint256 public total = 0;
  uint256 public released = 0;
  uint256 public terminationTime;
  bytes32 public details;
  uint256 public disputeId;

  event Register();
  event Confirm();
  event Release(uint256 milestone, uint256 amount);
  event Withdraw(uint256 remainder);
  event Lock(address indexed sender, bytes32 details);
  event Resolve(
    address indexed resolver,
    uint256 resolutionFee,
    uint256 clientAward,
    uint256 providerAward,
    bytes32 details
  );
  event Rule(
    address indexed resolver,
    uint256 indexed _disputeId,
    uint256 indexed ruling
  );

  constructor(
    address _client,
    address _provider,
    uint8 _resolverType,
    address _resolver,
    address _token,
    uint256[] memory _amounts,
    uint256 _terminationTime, // exact termination date in seconds since epoch
    bytes32 _details
  ) {
    require(_resolverType <= uint8(ADR.ARAGON_COURT), "invalid resolverType");
    require(terminationTime > block.timestamp, "ends before now");
    require(
      terminationTime <= block.timestamp.add(MAX_DURATION),
      "duration maxed"
    );

    client = _client;
    provider = _provider;
    resolverType = ADR(_resolverType);
    resolver = _resolver;
    token = _token;
    amounts = _amounts;
    for (uint256 i = 0; i < amounts.length; i++) {
      total = total.add(amounts[i]);
    }
    terminationTime = _terminationTime;
    details = _details;

    emit Register();
  }

  function confirmLocker() external nonReentrant {
    // client confirms deposit of total & locks in deal
    // client must have already deposited tokens to the contract

    require(!confirmed, "confirmed");
    require(_msgSender() == client, "!client");

    if (token == wETH) {
      uint256 balance = address(this).balance;
      if (balance > 0) {
        IWETH(wETH).deposit{value: balance}();
      }
    }

    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance >= total, "not enough token balance");

    confirmed = true;

    emit Confirm();
  }

  function release() external nonReentrant {
    // client transfers locker milestone batch to provider(s)

    require(confirmed, "!confirmed");
    require(!locked, "locked");
    require(total > released, "released");
    require(_msgSender() == client, "!client");

    uint256 currentMilestone = milestone;
    milestone = milestone.add(1);

    uint256 amount = amounts[milestone];
    uint256 balance = IERC20(token).balanceOf(address(this));
    if (currentMilestone == amounts.length && amount < balance) {
      amount = balance;
    }

    IERC20(token).safeTransfer(provider, amount);
    released = released.add(amount);

    emit Release(currentMilestone, amount);
  }

  function withdraw() external nonReentrant {
    // withdraw locker remainder to client if termination time passes & no lock

    require(confirmed, "!confirmed");
    require(!locked, "locked");
    require(total > released, "released");
    require(block.timestamp > terminationTime, "!terminated");

    uint256 remainder = total.sub(released);
    IERC20(token).safeTransfer(client, remainder);
    released = released.add(remainder);

    emit Withdraw(remainder);
  }

  /************
    ADR FUNCTIONS
    ************/
  function lock(bytes32 _details) external nonReentrant {
    // client or main (0) provider can lock remainder for resolution during locker period / update request details
    require(confirmed, "!confirmed");
    require(total > released, "released");
    require(block.timestamp < terminationTime, "terminated");
    require(_msgSender() == client || _msgSender() == provider, "!party");

    if (resolverType == ADR.ARAGON_COURT) {
      payDisputeFees(resolver);
      disputeId = IArbitrator(resolver).createDispute(
        DISPUTES_POSSIBLE_OUTCOMES,
        "0x"
      );
    }
    locked = true;

    emit Lock(_msgSender(), _details);
  }

  function payDisputeFees(address _adr) internal {
    IArbitrator arbitrator = IArbitrator(_adr);
    (, IERC20 feeToken, uint256 feeAmount) = arbitrator.getDisputeFees();
    feeToken.safeTransferFrom(msg.sender, address(this), feeAmount);
    require(feeToken.approve(_adr, feeAmount), "fee not approved");
  }

  function resolve(
    uint256 _clientAward,
    uint256 _providerAward,
    bytes32 _details
  ) external nonReentrant {
    // called by lex dao
    require(resolverType == ADR.LEX_DAO, "!lex");
    require(locked, "!locked");
    require(total > released, "released");
    require(_msgSender() == resolver, "!resolver");

    uint256 remainder = total.sub(released);
    uint256 resolutionFee = remainder.div(20); // calculates dispute resolution fee (5% of remainder)

    require(
      _clientAward.add(_providerAward) == remainder.sub(resolutionFee),
      "resolution != remainder"
    );
    IERC20(token).safeTransfer(provider, _providerAward);
    IERC20(token).safeTransfer(client, _clientAward);
    IERC20(token).safeTransfer(resolver, resolutionFee);

    released = total;
    locked = false;

    emit Resolve(
      _msgSender(),
      resolutionFee,
      _clientAward,
      _providerAward,
      _details
    );
  }

  function rule(uint256 _disputeId, uint256 _ruling)
    external
    override
    nonReentrant
  {
    // called by aragon court
    require(_disputeId == disputeId, "incorrect disputeId");
    require(_ruling <= DISPUTES_POSSIBLE_OUTCOMES, "invalid ruling");
    require(resolverType == ADR.ARAGON_COURT, "!aragon");
    require(locked, "!locked");
    require(total > released, "released");
    require(_msgSender() == resolver, "!resolver");

    uint256 remainder = total.sub(released);

    if (_ruling == DISPUTES_RULING_100_0) {
      IERC20(token).safeTransfer(client, remainder);
    } else if (_ruling == DISPUTES_RULING_0_100) {
      IERC20(token).safeTransfer(provider, remainder);
    } else if (_ruling == DISPUTES_RULING_75_25) {
      uint256 clientAward = remainder.mul(3).div(4);
      uint256 providerAward = remainder.sub(clientAward);
      IERC20(token).safeTransfer(client, clientAward);
      IERC20(token).safeTransfer(provider, providerAward);
    } else if (_ruling == DISPUTES_RULING_25_75) {
      uint256 clientAward = remainder.mul(1).div(4);
      uint256 providerAward = remainder.sub(clientAward);
      IERC20(token).safeTransfer(client, clientAward);
      IERC20(token).safeTransfer(provider, providerAward);
    } else {
      uint256 clientAward = remainder.div(2);
      uint256 providerAward = remainder.sub(clientAward);
      IERC20(token).safeTransfer(client, clientAward);
      IERC20(token).safeTransfer(provider, providerAward);
    }

    released = total;
    locked = false;

    emit Rule(_msgSender(), _disputeId, _ruling);
  }

  // receive eth transfers
  receive() external payable {
    require(!confirmed, "confirmed");
    require(token == wETH, "!wETH");
  }
}
