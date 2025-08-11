// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/// @title ISafeSplitsEscrowZapFactory
/// @notice Interface for the SafeSplitsEscrowZapFactory contract
interface ISafeSplitsEscrowZapFactory {
    /// @notice Error when implementation address is zero
    error ZeroImplementationAddress();

    /// @notice Emitted when a new SafeSplitsEscrowZap is created
    /// @param safeSplitsEscrowZap The address of the newly created SafeSplitsEscrowZap instance
    /// @param implementation The address of the implementation contract used for creating the clone
    /// @param salt The salt used for deterministic address generation
    event SafeSplitsEscrowZapCreated(
        address indexed safeSplitsEscrowZap,
        address indexed implementation,
        bytes32 indexed salt
    );

    /// @notice Returns the implementation address used for creating clones
    /// @return The address of the SafeSplitsEscrowZap implementation
    function implementation() external view returns (address);

    /// @notice Creates a new SafeSplitsEscrowZap instance using a deterministic address
    /// @param _data Initialization data to be passed to the new SafeSplitsEscrowZap instance
    /// @param _salt A salt value for deterministic address generation
    /// @return The address of the newly created SafeSplitsEscrowZap instance
    function createSafeSplitsEscrowZap(
        bytes calldata _data,
        bytes32 _salt
    ) external returns (address);
}
