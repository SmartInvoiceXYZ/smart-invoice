// File: @openzeppelin/contracts/GSN/Context.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with GSN meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
  function _msgSender() internal virtual view returns (address payable) {
    return msg.sender;
  }

  function _msgData() internal virtual view returns (bytes memory) {
    this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
    return msg.data;
  }
}

// File: @openzeppelin/contracts/math/SafeMath.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
  /**
   * @dev Returns the addition of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `+` operator.
   *
   * Requirements:
   *
   * - Addition cannot overflow.
   */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a, 'SafeMath: addition overflow');

    return c;
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting on
   * overflow (when the result is negative).
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   *
   * - Subtraction cannot overflow.
   */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    return sub(a, b, 'SafeMath: subtraction overflow');
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
   * overflow (when the result is negative).
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   *
   * - Subtraction cannot overflow.
   */
  function sub(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    require(b <= a, errorMessage);
    uint256 c = a - b;

    return c;
  }

  /**
   * @dev Returns the multiplication of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `*` operator.
   *
   * Requirements:
   *
   * - Multiplication cannot overflow.
   */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b, 'SafeMath: multiplication overflow');

    return c;
  }

  /**
   * @dev Returns the integer division of two unsigned integers. Reverts on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `/` operator. Note: this function uses a
   * `revert` opcode (which leaves remaining gas untouched) while Solidity
   * uses an invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    return div(a, b, 'SafeMath: division by zero');
  }

  /**
   * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `/` operator. Note: this function uses a
   * `revert` opcode (which leaves remaining gas untouched) while Solidity
   * uses an invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function div(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    require(b > 0, errorMessage);
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * Reverts when dividing by zero.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    return mod(a, b, 'SafeMath: modulo by zero');
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * Reverts with custom message when dividing by zero.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function mod(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    require(b != 0, errorMessage);
    return a % b;
  }
}

// File: @openzeppelin/contracts/token/ERC20/IERC20.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
  /**
   * @dev Returns the amount of tokens in existence.
   */
  function totalSupply() external view returns (uint256);

  /**
   * @dev Returns the amount of tokens owned by `account`.
   */
  function balanceOf(address account) external view returns (uint256);

  /**
   * @dev Moves `amount` tokens from the caller's account to `recipient`.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * Emits a {Transfer} event.
   */
  function transfer(address recipient, uint256 amount) external returns (bool);

  /**
   * @dev Returns the remaining number of tokens that `spender` will be
   * allowed to spend on behalf of `owner` through {transferFrom}. This is
   * zero by default.
   *
   * This value changes when {approve} or {transferFrom} are called.
   */
  function allowance(address owner, address spender)
    external
    view
    returns (uint256);

  /**
   * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * IMPORTANT: Beware that changing an allowance with this method brings the risk
   * that someone may use both the old and the new allowance by unfortunate
   * transaction ordering. One possible solution to mitigate this race
   * condition is to first reduce the spender's allowance to 0 and set the
   * desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   *
   * Emits an {Approval} event.
   */
  function approve(address spender, uint256 amount) external returns (bool);

  /**
   * @dev Moves `amount` tokens from `sender` to `recipient` using the
   * allowance mechanism. `amount` is then deducted from the caller's
   * allowance.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * Emits a {Transfer} event.
   */
  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) external returns (bool);

  /**
   * @dev Emitted when `value` tokens are moved from one account (`from`) to
   * another (`to`).
   *
   * Note that `value` may be zero.
   */
  event Transfer(address indexed from, address indexed to, uint256 value);

  /**
   * @dev Emitted when the allowance of a `spender` for an `owner` is set by
   * a call to {approve}. `value` is the new allowance.
   */
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: @openzeppelin/contracts/utils/Address.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
  /**
   * @dev Returns true if `account` is a contract.
   *
   * [IMPORTANT]
   * ====
   * It is unsafe to assume that an address for which this function returns
   * false is an externally-owned account (EOA) and not a contract.
   *
   * Among others, `isContract` will return false for the following
   * types of addresses:
   *
   *  - an externally-owned account
   *  - a contract in construction
   *  - an address where a contract will be created
   *  - an address where a contract lived, but was destroyed
   * ====
   */
  function isContract(address account) internal view returns (bool) {
    // According to EIP-1052, 0x0 is the value returned for not-yet created accounts
    // and 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 is returned
    // for accounts without code, i.e. `keccak256('')`
    bytes32 codehash;


      bytes32 accountHash
     = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      codehash := extcodehash(account)
    }
    return (codehash != accountHash && codehash != 0x0);
  }

  /**
   * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
   * `recipient`, forwarding all available gas and reverting on errors.
   *
   * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
   * of certain opcodes, possibly making contracts go over the 2300 gas limit
   * imposed by `transfer`, making them unable to receive funds via
   * `transfer`. {sendValue} removes this limitation.
   *
   * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
   *
   * IMPORTANT: because control is transferred to `recipient`, care must be
   * taken to not create reentrancy vulnerabilities. Consider using
   * {ReentrancyGuard} or the
   * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
   */
  function sendValue(address payable recipient, uint256 amount) internal {
    require(address(this).balance >= amount, 'Address: insufficient balance');

    // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
    (bool success, ) = recipient.call{value: amount}('');
    require(
      success,
      'Address: unable to send value, recipient may have reverted'
    );
  }

  /**
   * @dev Performs a Solidity function call using a low level `call`. A
   * plain`call` is an unsafe replacement for a function call: use this
   * function instead.
   *
   * If `target` reverts with a revert reason, it is bubbled up by this
   * function (like regular Solidity function calls).
   *
   * Returns the raw returned data. To convert to the expected return value,
   * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
   *
   * Requirements:
   *
   * - `target` must be a contract.
   * - calling `target` with `data` must not revert.
   *
   * _Available since v3.1._
   */
  function functionCall(address target, bytes memory data)
    internal
    returns (bytes memory)
  {
    return functionCall(target, data, 'Address: low-level call failed');
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
   * `errorMessage` as a fallback revert reason when `target` reverts.
   *
   * _Available since v3.1._
   */
  function functionCall(
    address target,
    bytes memory data,
    string memory errorMessage
  ) internal returns (bytes memory) {
    return _functionCallWithValue(target, data, 0, errorMessage);
  }

  /**
   * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
   * but also transferring `value` wei to `target`.
   *
   * Requirements:
   *
   * - the calling contract must have an ETH balance of at least `value`.
   * - the called Solidity function must be `payable`.
   *
   * _Available since v3.1._
   */
  function functionCallWithValue(
    address target,
    bytes memory data,
    uint256 value
  ) internal returns (bytes memory) {
    return
      functionCallWithValue(
        target,
        data,
        value,
        'Address: low-level call with value failed'
      );
  }

  /**
   * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
   * with `errorMessage` as a fallback revert reason when `target` reverts.
   *
   * _Available since v3.1._
   */
  function functionCallWithValue(
    address target,
    bytes memory data,
    uint256 value,
    string memory errorMessage
  ) internal returns (bytes memory) {
    require(
      address(this).balance >= value,
      'Address: insufficient balance for call'
    );
    return _functionCallWithValue(target, data, value, errorMessage);
  }

  function _functionCallWithValue(
    address target,
    bytes memory data,
    uint256 weiValue,
    string memory errorMessage
  ) private returns (bytes memory) {
    require(isContract(target), 'Address: call to non-contract');

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.call{value: weiValue}(
      data
    );
    if (success) {
      return returndata;
    } else {
      // Look for revert reason and bubble it up if present
      if (returndata.length > 0) {
        // The easiest way to bubble the revert reason is using memory via assembly

        // solhint-disable-next-line no-inline-assembly
        assembly {
          let returndata_size := mload(returndata)
          revert(add(32, returndata), returndata_size)
        }
      } else {
        revert(errorMessage);
      }
    }
  }
}

// File: @openzeppelin/contracts/token/ERC20/SafeERC20.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
  using SafeMath for uint256;
  using Address for address;

  function safeTransfer(
    IERC20 token,
    address to,
    uint256 value
  ) internal {
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(token.transfer.selector, to, value)
    );
  }

  function safeTransferFrom(
    IERC20 token,
    address from,
    address to,
    uint256 value
  ) internal {
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(token.transferFrom.selector, from, to, value)
    );
  }

  /**
   * @dev Deprecated. This function has issues similar to the ones found in
   * {IERC20-approve}, and its usage is discouraged.
   *
   * Whenever possible, use {safeIncreaseAllowance} and
   * {safeDecreaseAllowance} instead.
   */
  function safeApprove(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    // safeApprove should only be called when setting an initial allowance,
    // or when resetting it to zero. To increase and decrease it, use
    // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
    // solhint-disable-next-line max-line-length
    require(
      (value == 0) || (token.allowance(address(this), spender) == 0),
      'SafeERC20: approve from non-zero to non-zero allowance'
    );
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(token.approve.selector, spender, value)
    );
  }

  function safeIncreaseAllowance(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    uint256 newAllowance = token.allowance(address(this), spender).add(value);
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(token.approve.selector, spender, newAllowance)
    );
  }

  function safeDecreaseAllowance(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    uint256 newAllowance = token.allowance(address(this), spender).sub(
      value,
      'SafeERC20: decreased allowance below zero'
    );
    _callOptionalReturn(
      token,
      abi.encodeWithSelector(token.approve.selector, spender, newAllowance)
    );
  }

  /**
   * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
   * on the return value: the return value is optional (but if data is returned, it must not be false).
   * @param token The token targeted by the call.
   * @param data The call data (encoded using abi.encode or one of its variants).
   */
  function _callOptionalReturn(IERC20 token, bytes memory data) private {
    // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
    // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
    // the target address contains contract code and also asserts for success in the low-level call.

    bytes memory returndata = address(token).functionCall(
      data,
      'SafeERC20: low-level call failed'
    );
    if (returndata.length > 0) {
      // Return data is optional
      // solhint-disable-next-line max-line-length
      require(
        abi.decode(returndata, (bool)),
        'SafeERC20: ERC20 operation did not succeed'
      );
    }
  }
}

// File: contracts/IArbitrable.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

abstract contract IArbitrable {
  bytes4 internal constant ARBITRABLE_INTERFACE_ID = bytes4(0x88f3ee69);

  /**
   * @dev Give a ruling for a certain dispute, the account calling it must have rights to rule on the contract
   * @param _disputeId Identification number of the dispute to be ruled
   * @param _ruling Ruling given by the arbitrator, where 0 is reserved for "refused to make a decision"
   */
  function rule(uint256 _disputeId, uint256 _ruling) external virtual;

  /**
   * @dev ERC165 - Query if a contract implements a certain interface
   * @param _interfaceId The interface identifier being queried, as specified in ERC-165
   * @return True if this contract supports the given interface, false otherwise
   */
  function supportsInterface(bytes4 _interfaceId) external pure returns (bool) {
    return _interfaceId == ARBITRABLE_INTERFACE_ID;
  }
}

// File: contracts/IArbitrator.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IArbitrator {
  /**
   * @dev Create a dispute over the Arbitrable sender with a number of possible rulings
   * @param _possibleRulings Number of possible rulings allowed for the dispute
   * @param _metadata Optional metadata that can be used to provide additional information on the dispute to be created
   * @return Dispute identification number
   */
  function createDispute(uint256 _possibleRulings, bytes calldata _metadata)
    external
    returns (uint256);

  /**
   * @dev Close the evidence period of a dispute
   * @param _disputeId Identification number of the dispute to close its evidence submitting period
   */
  function closeEvidencePeriod(uint256 _disputeId) external;

  /**
   * @dev Execute the Arbitrable associated to a dispute based on its final ruling
   * @param _disputeId Identification number of the dispute to be executed
   */
  function executeRuling(uint256 _disputeId) external;

  /**
   * @dev Tell the dispute fees information to create a dispute
   * @return recipient Address where the corresponding dispute fees must be transferred to
   * @return feeToken ERC20 token used for the fees
   * @return feeAmount Total amount of fees that must be allowed to the recipient
   */
  function getDisputeFees()
    external
    view
    returns (
      address recipient,
      IERC20 feeToken,
      uint256 feeAmount
    );

  /**
   * @dev Tell the subscription fees information for a subscriber to be up-to-date
   * @param _subscriber Address of the account paying the subscription fees for
   * @return recipient Address where the corresponding subscriptions fees must be transferred to
   * @return feeToken ERC20 token used for the subscription fees
   * @return feeAmount Total amount of fees that must be allowed to the recipient
   */
  function getSubscriptionFees(address _subscriber)
    external
    view
    returns (
      address recipient,
      IERC20 feeToken,
      uint256 feeAmount
    );
}

// File: contracts/RaidEscrowMono.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IWETH {
  // brief interface for canonical ether token wrapper contract
  function deposit() external payable;

  function transfer(address dst, uint256 wad) external returns (bool);
}

contract RaidEscrowMono is
  Context,
  IArbitrable // splittable digital deal lockers w/ embedded arbitration tailored for guild work
{
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  uint256 internal constant DISPUTES_POSSIBLE_OUTCOMES = 3;
  // Note that Aragon Court treats the possible outcomes as arbitrary numbers, leaving the Arbitrable (us) to define how to understand them.
  // Some outcomes [0, 1, and 2] are reserved by Aragon Court: "missing", "leaked", and "refused", respectively.
  // This Arbitrable introduces the concept of the challenger/submitter (a binary outcome) as 3/4.
  // Note that Aragon Court emits the lowest outcome in the event of a tie, and so for us, we prefer the client.
  uint256 internal constant DISPUTES_RULING_CLIENT = 3;
  uint256 internal constant DISPUTES_RULING_PROVIDERS = 4;
  uint256 internal constant DISPUTES_RULING_NEUTRAL = 5;

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
    uint256[] amounts;
    uint256 milestone;
    uint256 total;
    uint256 released;
    uint256 termination;
    bytes32 details;
  }

  event RegisterLocker(
    address indexed client,
    address indexed provider,
    uint256 index
  );
  event ConfirmLocker(uint256 indexed index, uint256 indexed sum);
  event Release(uint256 indexed index, uint256 indexed milestone);
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
    uint256 total,
    uint256 termination, // exact termination date in seconds since epoch
    bytes32 details
  ) external {
    require(resolverType <= uint8(ADR.ARAGON_COURT), 'invalid resolverType');

    uint256 sum;
    for (uint256 i = 0; i < amounts.length; i++) {
      sum = sum.add(amounts[i]);
    }

    require(sum == total, 'deposit != milestone amounts');
    require(termination <= block.timestamp.add(MAX_DURATION), 'duration maxed');

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
      termination,
      details
    );

    emit RegisterLocker(client, provider, index);
  }

  function confirmLocker(uint256 index) external payable {
    // client confirms deposit of total & locks in deal
    Locker storage locker = lockers[index];

    require(!locker.confirmed, 'confirmed');
    require(_msgSender() == locker.client, '!client');

    uint256 sum = locker.total;

    if (locker.token == wETH && msg.value > 0) {
      require(msg.value == sum, '!ETH');
      IWETH(wETH).deposit();
      (bool success, ) = wETH.call{value: msg.value}('');
      require(success, '!transfer');
      IWETH(wETH).transfer(address(this), msg.value);
    } else {
      IERC20(locker.token).safeTransferFrom(msg.sender, address(this), sum);
    }

    locker.confirmed = true;

    emit ConfirmLocker(index, sum);
  }

  function release(uint256 index) external {
    // client transfers locker milestone amounts to provider(s)
    Locker storage locker = lockers[index];

    require(!locker.locked, 'locked');
    require(locker.confirmed, '!confirmed');
    require(locker.total > locker.released, 'released');
    require(_msgSender() == locker.client, '!client');

    uint256 milestone = locker.milestone;
    uint256 amount = locker.amounts[milestone];

    IERC20(locker.token).safeTransfer(locker.provider, amount);
    locker.released = locker.released.add(amount);
    locker.milestone = locker.milestone.add(1);

    emit Release(index, milestone);
  }

  function withdraw(uint256 index) external {
    // withdraw locker remainder to client if termination time passes & no lock
    Locker storage locker = lockers[index];

    require(!locker.locked, 'locked');
    require(locker.confirmed, '!confirmed');
    require(locker.total > locker.released, 'released');
    require(block.timestamp > locker.termination, '!terminated');

    uint256 remainder = locker.total.sub(locker.released);

    IERC20(locker.token).safeTransfer(locker.client, remainder);

    locker.released = locker.released.add(remainder);

    emit Withdraw(index, remainder);
  }

  /************
    ADR FUNCTIONS
    ************/
  function lock(uint256 index, bytes32 details) external {
    // client or main (0) provider can lock remainder for resolution during locker period / update request details
    Locker storage locker = lockers[index];

    require(!locker.locked, 'locked');
    require(locker.confirmed, '!confirmed');
    require(locker.total > locker.released, 'released');
    require(block.timestamp < locker.termination, 'terminated');
    require(
      _msgSender() == locker.client || _msgSender() == locker.provider,
      '!party'
    );

    if (locker.resolverType == ADR.ARAGON_COURT) {
      IArbitrator arbitrator = IArbitrator(locker.resolver);
      payDisputeFees(locker.resolver);
      uint256 disputeId = arbitrator.createDispute(
        DISPUTES_POSSIBLE_OUTCOMES,
        '0x'
      );
      disputes[disputeId] = index;
    }
    locker.locked = true;

    emit Lock(_msgSender(), index, details);
  }

  function payDisputeFees(address _adr) internal {
    IArbitrator arbitrator = IArbitrator(_adr);
    (, IERC20 feeToken, uint256 feeAmount) = arbitrator.getDisputeFees();
    feeToken.safeTransferFrom(msg.sender, address(this), feeAmount);
    require(feeToken.approve(_adr, feeAmount));
  }

  function resolve(
    uint256 index,
    uint256 clientAward,
    uint256 providerAward,
    bytes32 details
  ) external {
    // resolver splits locked deposit remainder between client & provider(s)
    Locker storage locker = lockers[index];
    require(locker.resolverType == ADR.LEX_DAO);

    uint256 remainder = locker.total.sub(locker.released);
    uint256 resolutionFee = remainder.div(20); // calculates dispute resolution fee (5% of remainder)

    require(locker.locked, '!locked');
    require(locker.total > locker.released, 'released');
    require(_msgSender() == locker.resolver, '!resolver');
    require(_msgSender() != locker.client, 'resolver == client');
    require(msg.sender != locker.provider, 'resolver == provider');
    require(
      clientAward.add(providerAward) == remainder.sub(resolutionFee),
      'resolution != remainder'
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

  function rule(uint256 _disputeId, uint256 _ruling) external override {
    require(_ruling <= DISPUTES_POSSIBLE_OUTCOMES);
    uint256 index = disputes[_disputeId];
    Locker storage locker = lockers[index];
    require(locker.resolverType == ADR.ARAGON_COURT);
    require(locker.locked, '!locked');
    require(locker.total > locker.released, 'released');
    require(_msgSender() == locker.resolver, '!resolver');
    require(_msgSender() != locker.client, 'resolver == client');

    uint256 remainder = locker.total.sub(locker.released);

    if (_ruling == DISPUTES_RULING_CLIENT) {
      IERC20(locker.token).safeTransfer(locker.client, remainder);
    } else if (_ruling == DISPUTES_RULING_PROVIDERS) {
      IERC20(locker.token).safeTransfer(locker.provider, remainder);
    } else {
      IERC20(locker.token).safeTransfer(locker.client, remainder / 2);
      remainder = remainder - remainder / 2;
      IERC20(locker.token).safeTransfer(locker.provider, remainder);
    }

    locker.released = locker.total;
    locker.locked = false;

    emit Rule(_msgSender(), index, _ruling);
  }
}
