// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISmartInvoiceFactoryBundler
/// @notice Interface for the SmartInvoiceFactoryBundler contract
interface ISmartInvoiceFactoryBundler {
    /// @notice Error emitted when escrow creation fails
    error EscrowNotCreated();

    /// @notice Error emitted when the fund amount is invalid
    error InvalidFundAmount();

    /// @notice Event emitted when a new escrow is created
    /// @param escrow Address of the newly created escrow
    /// @param token Address of the token used for payment
    /// @param amount The total fund amount transferred to the escrow
    event EscrowCreated(
        address indexed escrow,
        address indexed token,
        uint256 amount
    );

    /// @notice Deploy an escrow contract and fund it with wrapped native token
    /// @param _client The address of the client
    /// @param _amounts Array of milestone amounts
    /// @param _data Additional data for the escrow
    /// @param _salt Salt for deterministic address generation
    /// @param _fundAmount The amount to fund the escrow
    /// @return The address of the created escrow contract
    function deployEscrow(
        address _client,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _salt,
        uint256 _fundAmount
    ) external payable returns (address);
}
