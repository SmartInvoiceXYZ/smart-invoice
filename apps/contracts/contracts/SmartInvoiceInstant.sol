// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ISmartInvoiceInstant} from "./interfaces/ISmartInvoiceInstant.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SmartInvoiceInstant
/// @notice A contract for handling instant invoices with late fee calculations and token transfers.
contract SmartInvoiceInstant is
    ISmartInvoiceInstant,
    Initializable,
    Context,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public wrappedNativeToken;

    address public client;
    address public provider;
    address public token;
    bytes32 public details;
    uint256 public override deadline;

    uint256[] public amounts;
    uint256 public total = 0;
    uint256 public override totalFulfilled = 0;
    bool public override fulfilled;
    uint256 public fulfillTime = 0;
    uint256 public constant MAX_DEADLINE = 63113904; // 2-year limit on locker

    uint256 public override lateFee = 0;
    uint256 public override lateFeeTimeInterval = 0;

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with the provided provider, amounts, and data.
     * @param _provider The address of the provider
     * @param _amounts The array of amounts associated with the provider
     * @param _data The additional data needed for initialization
     */
    function init(
        address _provider,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external override initializer {
        if (_provider == address(0)) revert InvalidProvider();

        _handleData(_data);

        provider = _provider;

        uint256 _total = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            _total += _amounts[i];
        }
        total = _total;
    }

    /**
     * @notice Calculates the total amount due, including late fees if applicable.
     * @return The total amount due
     */
    function getTotalDue() public view override returns (uint256) {
        uint256 totalLateFee = 0;
        if (block.timestamp > deadline && deadline > 0) {
            uint256 timeAfterDeadline = 0;
            if (fulfilled && fulfillTime > 0) {
                if (fulfillTime >= deadline) {
                    timeAfterDeadline = fulfillTime - deadline;
                }
            } else {
                timeAfterDeadline = block.timestamp - deadline;
            }
            if (
                timeAfterDeadline >= lateFeeTimeInterval &&
                lateFeeTimeInterval != 0
            ) {
                totalLateFee =
                    lateFee *
                    (timeAfterDeadline / lateFeeTimeInterval);
            } else {
                totalLateFee = 0;
            }
        }
        return total + totalLateFee;
    }

    /**
     * @notice Deposits tokens into the contract.
     * @param _token The address of the token to deposit
     * @param _amount The amount of tokens to deposit
     */
    function depositTokens(
        address _token,
        uint256 _amount
    ) external override nonReentrant {
        if (_token != token) revert TokenMismatch();
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        _deposit(_amount);
    }

    /**
     * @notice Withdraws the balance of the invoice token to the provider.
     */
    function withdraw() external override nonReentrant {
        return _withdraw();
    }

    /**
     * @notice Withdraws tokens that are not the invoice token.
     * @param _token The address of the token to withdraw
     */
    function withdrawTokens(address _token) external override nonReentrant {
        if (_token == token) {
            _withdraw();
        } else {
            uint256 balance = IERC20(_token).balanceOf(address(this));
            if (balance == 0) revert BalanceIsZero();
            IERC20(_token).safeTransfer(provider, balance);
        }
    }

    /**
     * @notice Tips the provider with additional tokens.
     * @param _token The address of the token to tip
     * @param _amount The amount of tokens to tip
     */
    function tip(
        address _token,
        uint256 _amount
    ) external override nonReentrant {
        if (!fulfilled) revert AlreadyFulfilled();
        if (_token != token) revert TokenMismatch();
        totalFulfilled += _amount;
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        emit Tip(_msgSender(), _amount);
    }

    /**
     * @dev Internal function to handle deposits.
     * @param _amount The amount to deposit
     */
    function _deposit(uint256 _amount) internal {
        uint256 totalDue = getTotalDue();
        totalFulfilled += _amount;
        if (totalFulfilled >= totalDue) {
            fulfilled = true;
            fulfillTime = block.timestamp;
            emit Fulfilled(_msgSender());
            if (totalFulfilled > totalDue) {
                emit Tip(_msgSender(), totalFulfilled - totalDue);
            }
        }
        emit Deposit(_msgSender(), _amount);
    }

    /**
     * @dev Internal function to handle withdrawals.
     */
    function _withdraw() internal {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        IERC20(token).safeTransfer(provider, balance);
        emit Withdraw(balance);
    }

    /**
     * @dev Internal function to handle initialization data.
     * @param _data The data to be handled and decoded
     */
    function _handleData(bytes calldata _data) internal {
        (
            address _client,
            address _token,
            uint256 _deadline,
            bytes32 _details,
            address _wrappedNativeToken,
            uint256 _lateFee,
            uint256 _lateFeeTimeInterval
        ) = abi.decode(
                _data,
                (address, address, uint256, bytes32, address, uint256, uint256)
            );

        if (_client == address(0)) revert InvalidClient();
        if (_token == address(0)) revert InvalidToken();
        if (_deadline <= block.timestamp && _deadline != 0)
            revert DurationEnded();
        if (_deadline > block.timestamp + MAX_DEADLINE)
            revert DurationTooLong();
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();

        client = _client;
        token = _token;
        deadline = _deadline;
        details = _details;
        wrappedNativeToken = _wrappedNativeToken;
        lateFee = _lateFee;
        lateFeeTimeInterval = _lateFeeTimeInterval;
    }

    /**
     * @notice Fallback function to receive native token transfers.
     */
    receive() external payable {
        if (token != wrappedNativeToken) revert TokenNotWrappedNativeToken();
        IWRAPPED(wrappedNativeToken).deposit{value: msg.value}();
        _deposit(msg.value);
    }
}
