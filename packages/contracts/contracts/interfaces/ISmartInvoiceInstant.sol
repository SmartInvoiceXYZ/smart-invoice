// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ISmartInvoice} from "./ISmartInvoice.sol";

/// @title ISmartInvoiceInstant
/// @notice Interface for the Smart Invoice Instant contract that allows for immediate payments, tips, and withdrawal functionality.
interface ISmartInvoiceInstant is ISmartInvoice {
    /**
     * @notice Returns the deadline by which the invoice must be fulfilled.
     * @return The deadline timestamp in seconds.
     */
    function deadline() external view returns (uint256);

    /**
     * @notice Deposits tokens into the invoice contract.
     * @param _token The address of the token to deposit.
     * @param _amount The amount of tokens to deposit.
     */
    function depositTokens(address _token, uint256 _amount) external;

    /**
     * @notice Returns whether the invoice has been fulfilled.
     * @return A boolean indicating if the invoice is fulfilled.
     */
    function fulfilled() external view returns (bool);

    /**
     * @notice Calculates the total amount due, including any late fees if applicable.
     * @return The total amount due for the invoice.
     */
    function getTotalDue() external view returns (uint256);

    /**
     * @notice Returns the late fee amount set for the invoice.
     * @return The late fee amount.
     */
    function lateFee() external view returns (uint256);

    /**
     * @notice Returns the time interval for which the late fee is applicable.
     * @return The late fee time interval in seconds.
     */
    function lateFeeTimeInterval() external view returns (uint256);

    /**
     * @notice Allows tipping in tokens to the invoice.
     * @param _token The address of the token used for the tip.
     * @param _amount The amount of the tip.
     */
    function tip(address _token, uint256 _amount) external;

    /**
     * @notice Returns the total amount that has been fulfilled towards the invoice.
     * @return The total amount fulfilled.
     */
    function totalFulfilled() external view returns (uint256);

    /**
     * @notice Withdraws funds from the invoice to the recipient.
     */
    function withdraw() external;

    /**
     * @notice Withdraws tokens of a specified type from the invoice to the recipient.
     * @param _token The address of the token to be withdrawn.
     */
    function withdrawTokens(address _token) external;

    /// @dev Custom errors for more efficient gas usage.

    /// @notice Reverts when the provider address is invalid.
    error InvalidProvider();

    /// @notice Reverts when the client address is invalid.
    error InvalidClient();

    /// @notice Reverts when the token address is invalid.
    error InvalidToken();

    /// @notice Reverts when the duration has already ended.
    error DurationEnded();

    /// @notice Reverts when the duration is too long.
    error DurationTooLong();

    /// @notice Reverts when the wrapped native token address is invalid.
    error InvalidWrappedNativeToken();

    /// @notice Reverts when there is a token mismatch.
    error TokenMismatch();

    /// @notice Reverts when the invoice has already been fulfilled.
    error AlreadyFulfilled();

    /// @notice Reverts when the balance of tokens is zero.
    error BalanceIsZero();

    /// @notice Reverts when the token is not the wrapped native token.
    error TokenNotWrappedNativeToken();

    /// @notice Emitted when a deposit is made into the invoice.
    /// @param sender The address of the depositor.
    /// @param amount The amount deposited.
    event Deposit(address indexed sender, uint256 amount);

    /// @notice Emitted when the invoice is fulfilled.
    /// @param sender The address that fulfilled the invoice.
    event Fulfilled(address indexed sender);

    /// @notice Emitted when a tip is made to the invoice.
    /// @param sender The address of the sender providing the tip.
    /// @param amount The amount of the tip.
    event Tip(address indexed sender, uint256 amount);

    /// @notice Emitted when funds are withdrawn from the invoice.
    /// @param balance The balance that was withdrawn.
    event Withdraw(uint256 balance);
}
