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
contract SmartEscrowMono is Context, IArbitrable, ReentrancyGuard {
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
  uint256 public lockerCount;
  uint256 public constant MAX_DURATION = 63113904; // 2-year limit on locker
  mapping(uint256 => Locker) public lockers;
  mapping(uint256 => uint256) public disputes;

  enum ADR {LEX_DAO, ARAGON_COURT}
  struct Locker {
    address client;
    address provider;
    ADR resolverType;
    address resolver;
    address token;
    bool confirmed;
    bool locked;
    uint256[] amounts; // milestones split into amounts
    uint256 milestone; // current milestone - starts from 0 to amounts.length
    uint256 total;
    uint256 released;
    uint256 terminationTime;
    bytes32 details;
  }

  event RegisterLocker(
    address indexed client,
    address indexed provider,
    uint256 index
  );
  event ConfirmLocker(uint256 indexed index);
  event Release(
    uint256 indexed index,
    uint256 indexed milestone,
    uint256 amount
  );
  event Withdraw(uint256 indexed index, uint256 indexed remainder);
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

  /***************
    LOCKER FUNCTIONS
    ***************/
  function registerLocker(
    // register locker for token deposit & client deal confirmation
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

    lockerCount = lockerCount + 1;
    uint256 index = lockerCount;

    lockers[index] = Locker(
      client,
      provider,
      ADR(resolverType),
      resolver,
      token,
      false,
      false,
      amounts,
      0,
      total,
      0,
      terminationTime,
      details
    );

    emit RegisterLocker(client, provider, index);
  }

  function confirmLocker(uint256 index) external payable nonReentrant {
    // client confirms deposit of total & locks in deal
    Locker storage locker = lockers[index];

    require(!locker.confirmed, "confirmed");
    require(_msgSender() == locker.client, "!client");

    uint256 total = locker.total;

    if (locker.token == wETH && msg.value > 0) {
      require(msg.value == total, "!ETH");
      IWETH(wETH).deposit{value: msg.value}();
    } else {
      IERC20(locker.token).safeTransferFrom(msg.sender, address(this), total);
    }

    locker.confirmed = true;

    emit ConfirmLocker(index);
  }

  function release(uint256 index) external nonReentrant {
    // client transfers locker milestone amounts to provider(s)
    Locker storage locker = lockers[index];

    require(locker.confirmed, "!confirmed");
    require(!locker.locked, "locked");
    require(locker.total > locker.released, "released");
    require(_msgSender() == locker.client, "!client");

    uint256 currentMilestone = locker.milestone;
    locker.milestone = locker.milestone.add(1);

    uint256 amount = locker.amounts[currentMilestone];

    IERC20(locker.token).safeTransfer(locker.provider, amount);
    locker.released = locker.released.add(amount);

    emit Release(index, currentMilestone, amount);
  }

  function withdraw(uint256 index) external nonReentrant {
    // withdraw locker remainder to client if termination time passes & no lock
    Locker storage locker = lockers[index];

    require(locker.confirmed, "!confirmed");
    require(!locker.locked, "locked");
    require(locker.total > locker.released, "released");
    require(block.timestamp > locker.terminationTime, "!terminated");

    uint256 remainder = locker.total.sub(locker.released);
    IERC20(locker.token).safeTransfer(locker.client, remainder);

    emit Withdraw(index, remainder);
  }

  /************
    ADR FUNCTIONS
    ************/
  function lock(uint256 index, bytes32 details) external nonReentrant {
    // client or main (0) provider can lock remainder for resolution during locker period / update request details
    Locker storage locker = lockers[index];

    require(locker.confirmed, "!confirmed");
    require(!locker.locked, "locked");
    require(locker.total > locker.released, "released");
    require(block.timestamp < locker.terminationTime, "terminated");
    require(
      _msgSender() == locker.client || _msgSender() == locker.provider,
      "!party"
    );

    if (locker.resolverType == ADR.ARAGON_COURT) {
      IArbitrator arbitrator = IArbitrator(locker.resolver);
      payDisputeFees(locker.resolver);
      uint256 disputeId = arbitrator.createDispute(
        DISPUTES_POSSIBLE_OUTCOMES,
        "0x"
      );
      disputes[disputeId] = index;
    }
    locker.locked = true;

    emit Lock(_msgSender(), index, details);
  }

  function payDisputeFees(address _adr) internal {
    IArbitrator arbitrator = IArbitrator(_adr);
    (, IERC20 feeToken, uint256 feeAmount) = arbitrator.getDisputeFees();
    feeToken.safeTransferFrom(msg.sender, address(this), feeAmount); // sender must pay dispute fees when locking
    require(feeToken.approve(_adr, feeAmount), "fee not approved");
  }

  function resolve(
    uint256 index,
    uint256 clientAward,
    uint256 providerAward,
    bytes32 details
  ) external nonReentrant {
    // called by lex dao
    Locker storage locker = lockers[index];
    require(locker.resolverType == ADR.LEX_DAO, "!lex");
    require(locker.locked, "!locked");
    require(locker.total > locker.released, "released");
    require(_msgSender() == locker.resolver, "!resolver");

    uint256 remainder = locker.total.sub(locker.released);
    uint256 resolutionFee = remainder.div(20); // calculates dispute resolution fee (5% of remainder)

    require(
      clientAward.add(providerAward) == remainder.sub(resolutionFee),
      "resolution != remainder"
    );
    IERC20(locker.token).safeTransfer(locker.provider, providerAward);
    IERC20(locker.token).safeTransfer(locker.client, clientAward);
    IERC20(locker.token).safeTransfer(locker.resolver, resolutionFee);

    locker.released = locker.total;
    locker.locked = false;

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
    require(_ruling <= DISPUTES_POSSIBLE_OUTCOMES, "invalid ruling");
    uint256 index = disputes[_disputeId];
    Locker storage locker = lockers[index];
    require(locker.resolverType == ADR.ARAGON_COURT, "!aragon");
    require(locker.locked, "!locked");
    require(locker.total > locker.released, "released");
    require(_msgSender() == locker.resolver, "!resolver");

    uint256 remainder = locker.total.sub(locker.released);

    if (_ruling == DISPUTES_RULING_100_0) {
      IERC20(locker.token).safeTransfer(locker.client, remainder);
    } else if (_ruling == DISPUTES_RULING_0_100) {
      IERC20(locker.token).safeTransfer(locker.provider, remainder);
    } else if (_ruling == DISPUTES_RULING_75_25) {
      uint256 clientAward = remainder.mul(3).div(4);
      uint256 providerAward = remainder.sub(clientAward);
      IERC20(locker.token).safeTransfer(locker.client, clientAward);
      IERC20(locker.token).safeTransfer(locker.provider, providerAward);
    } else if (_ruling == DISPUTES_RULING_25_75) {
      uint256 clientAward = remainder.mul(1).div(4);
      uint256 providerAward = remainder.sub(clientAward);
      IERC20(locker.token).safeTransfer(locker.client, clientAward);
      IERC20(locker.token).safeTransfer(locker.provider, providerAward);
    } else {
      uint256 clientAward = remainder.div(2);
      uint256 providerAward = remainder.sub(clientAward);
      IERC20(locker.token).safeTransfer(locker.client, clientAward);
      IERC20(locker.token).safeTransfer(locker.provider, providerAward);
    }

    locker.released = locker.total;
    locker.locked = false;

    emit Rule(_msgSender(), index, _ruling);
  }
}
