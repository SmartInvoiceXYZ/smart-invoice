// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISpoilsManagerFactory
/// @notice Interface for the SpoilsManagerFactory contract
interface ISpoilsManagerFactory {
    /// @notice Error when spoils amount is invalid
    error InvalidSpoilsAmount();

    /// @notice Error when receiver address is invalid
    error InvalidReceiverAddress();

    /// @notice Error when implementation address is zero
    error ZeroImplementationAddress();

    /// @notice Emitted when a new SpoilsManager is created
    /// @param spoilsManager The address of the newly created SpoilsManager instance
    /// @param implementation The address of the implementation contract used for creating the clone
    /// @param salt The salt used for deterministic address generation
    event SpoilsManagerCreated(
        address indexed spoilsManager,
        address indexed implementation,
        bytes32 indexed salt
    );

    /// @notice Returns the implementation address used for creating clones
    /// @return The address of the SpoilsManager implementation
    function implementation() external view returns (address);

    /// @notice Creates a new SpoilsManager contract
    /// @param _spoils Percentage of each payment to be sent to the owner's receiver
    /// @param _percentageScale The scale used to calculate the spoils percentage
    /// @param _receiver The address of the owner's receiver
    /// @param _newOwner Address of the initial owner of the SpoilsManager contract
    /// @param _salt Salt for deterministic address generation
    /// @return The address of the newly created SpoilsManager instance
    function createSpoilsManager(
        uint32 _spoils,
        uint32 _percentageScale,
        address _receiver,
        address _newOwner,
        bytes32 _salt
    ) external returns (address);
}
