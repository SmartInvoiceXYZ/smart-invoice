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
contract SmartInvoice is Context, IArbitrable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  uint256 public constant NUM_RULING_OPTIONS = 5; // excludes options 0, 1 and 2
  // Note that Aragon Court treats the possible outcomes as arbitrary numbers, leaving the Arbitrable (us) to define how to understand them.
  // Some outcomes [0, 1, and 2] are reserved by Aragon Court: "missing", "leaked", and "refused", respectively.
  // Note that Aragon Court emits the LOWEST outcome in the event of a tie.

  uint8[2][6] public RULINGS = [
    [1, 1], // 0 = refused to arbitrate
    [1, 0], // 1 = 100% to client
    [3, 1], // 2 = 75% to client
    [1, 1], // 3 = 50% to client
    [1, 3], // 4 = 25% to client
    [0, 1] // 5 = 0% to client
  ];

  /** kovan WETH_TOKEN **/
  // address public WETH_TOKEN = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
  /** rinkeby WETH_TOKEN **/
  address public constant WETH_TOKEN =
    0xc778417E063141139Fce010982780140Aa0cD5Ab;
  uint256 public constant MAX_DURATION = 63113904; // 2-year limit on locker

  enum ADR {INDIVIDUAL, ARBITRATOR}

  address public client;
  address public provider;
  ADR public resolverType;
  address public resolver;
  address public token;
  bool public locked;
  uint256[] public amounts; // milestones split into amounts
  uint256 public milestone = 0; // current milestone - starts from 0 to amounts.length
  uint256 public total = 0;
  uint256 public released = 0;
  uint256 public terminationTime;
  bytes32 public details;
  uint256 public disputeId;

  event Register(
    address indexed client,
    address indexed provider,
    uint256[] amounts
  );
  event Deposit(address indexed sender, uint256 amount);
  event Release(uint256 milestone, uint256 amount);
  event Withdraw(uint256 balance);
  event Lock(address indexed sender, bytes32 details);
  event Resolve(
    address indexed resolver,
    uint256 clientAward,
    uint256 providerAward,
    uint256 resolutionFee,
    bytes32 details
  );
  event Rule(
    address indexed resolver,
    uint256 clientAward,
    uint256 providerAward,
    uint256 ruling
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
    require(_resolverType <= uint8(ADR.ARBITRATOR), "invalid resolverType");
    require(_terminationTime > block.timestamp, "invoice ends before now");
    require(
      _terminationTime <= block.timestamp.add(MAX_DURATION),
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

    emit Register(client, provider, amounts);
  }

  function release() public nonReentrant {
    // client transfers locker milestone funds to provider

    require(!locked, "locked");
    require(_msgSender() == client, "!client");

    uint256 currentMilestone = milestone;
    uint256 balance = IERC20(token).balanceOf(address(this));

    if (currentMilestone < amounts.length) {
      milestone = milestone.add(1);
      uint256 amount = amounts[currentMilestone];
      if (milestone == amounts.length && amount < balance) {
        amount = balance;
      }
      require(balance >= amount, "insufficient balance");

      IERC20(token).safeTransfer(provider, amount);
      released = released.add(amount);
      emit Release(currentMilestone, amount);
    } else if (balance > 0) {
      IERC20(token).safeTransfer(provider, balance);
      released = released.add(balance);
      emit Release(currentMilestone, balance);
    }
  }

  function release(uint256 _milestone) public nonReentrant {
    // client transfers locker funds upto certain milestone to provider
    require(!locked, "locked");
    require(_msgSender() == client, "!client");
    require(_milestone >= milestone, "milestone passed");
    require(_milestone < amounts.length, "invalid milestone");
    uint256 amount = 0;
    for (uint256 j = milestone; j <= _milestone; j++) {
      amount = amount.add(amounts[j]);
      emit Release(j, amounts[j]);
    }
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance >= amount, "insufficient balance");

    IERC20(token).safeTransfer(provider, amount);
    released = released.add(amount);
    milestone = _milestone.add(1);
  }

  // release non-invoice tokens
  function releaseTokens(address _token) external nonReentrant {
    if (_token == token) {
      release();
    } else {
      require(_msgSender() == client, "!client");
      uint256 balance = IERC20(_token).balanceOf(address(this));
      IERC20(_token).safeTransfer(provider, balance);
    }
  }

  // withdraw locker remainder to client if termination time passes & no lock
  function withdraw() public nonReentrant {
    require(!locked, "locked");
    require(block.timestamp > terminationTime, "!terminated");
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance > 0, "balance is 0");

    IERC20(token).safeTransfer(client, balance);
    milestone = amounts.length;

    emit Withdraw(balance);
  }

  // withdraw non-invoice tokens
  function withdrawTokens(address _token) external nonReentrant {
    if (_token == token) {
      withdraw();
    } else {
      require(block.timestamp > terminationTime, "!terminated");
      uint256 balance = IERC20(_token).balanceOf(address(this));
      require(balance > 0, "balance is 0");

      IERC20(token).safeTransfer(client, balance);
    }
  }

  // client or main (0) provider can lock remainder for resolution during locker period / update request details
  function lock(bytes32 _details) external payable nonReentrant {
    require(!locked, "locked");
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance > 0, "balance is 0");
    require(block.timestamp < terminationTime, "terminated");
    require(_msgSender() == client || _msgSender() == provider, "!party");

    if (resolverType == ADR.ARBITRATOR) {
      disputeId = IArbitrator(resolver).createDispute{value: msg.value}(
        NUM_RULING_OPTIONS,
        ""
      );
    }
    locked = true;

    emit Lock(_msgSender(), _details);
  }

  function resolve(
    uint256 _clientAward,
    uint256 _providerAward,
    bytes32 _details
  ) external nonReentrant {
    // called by individual
    require(resolverType == ADR.INDIVIDUAL, "!lex");
    require(locked, "!locked");
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance > 0, "balance is 0");
    require(_msgSender() == resolver, "!resolver");

    uint256 resolutionFee = balance.div(20); // calculates dispute resolution fee (5% of remainder)

    require(
      _clientAward.add(_providerAward) == balance.sub(resolutionFee),
      "resolution != remainder"
    );
    IERC20(token).safeTransfer(provider, _providerAward);
    IERC20(token).safeTransfer(client, _clientAward);
    IERC20(token).safeTransfer(resolver, resolutionFee);

    released = released.add(balance);
    milestone = amounts.length;
    locked = false;

    emit Resolve(
      _msgSender(),
      _clientAward,
      _providerAward,
      resolutionFee,
      _details
    );
  }

  function rule(uint256 _disputeId, uint256 _ruling)
    external
    override
    nonReentrant
  {
    // called by arbitrator
    require(_disputeId == disputeId, "incorrect disputeId");
    require(_ruling <= NUM_RULING_OPTIONS, "invalid ruling");
    require(resolverType == ADR.ARBITRATOR, "!arbitrator");
    require(locked, "!locked");
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance > 0, "balance is 0");
    require(_msgSender() == resolver, "!resolver");

    uint8[2] storage ruling = RULINGS[_ruling];
    uint8 clientShare = ruling[0];
    uint8 providerShare = ruling[1];
    uint8 denom = clientShare + providerShare;
    uint256 providerAward = balance.mul(providerShare).div(denom);
    uint256 clientAward = balance.sub(providerAward);

    if (providerAward > 0) {
      IERC20(token).safeTransfer(provider, providerAward);
    }
    if (clientAward > 0) {
      IERC20(token).safeTransfer(client, clientAward);
    }

    milestone = amounts.length;
    locked = false;

    emit Rule(_msgSender(), clientAward, providerAward, _ruling);
    emit Ruling(resolver, _disputeId, _ruling);
  }

  // receive eth transfers
  receive() external payable {
    require(!locked, "locked");
    require(token == WETH_TOKEN, "!wETH");
    IWETH(WETH_TOKEN).deposit{value: msg.value}();
    emit Deposit(_msgSender(), msg.value);
  }
}
