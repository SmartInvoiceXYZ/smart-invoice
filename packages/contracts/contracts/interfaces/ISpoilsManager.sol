// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISpoilsManager
/// @notice Interface for the Spoils Manager contract that manages spoils and ownership functionalities.
interface ISpoilsManager {
    /**
     * @notice Returns the scale used for calculating percentage splits.
     * @return The scale value for percentage splits.
     */
    function SPLIT_PERCENTAGE_SCALE() external view returns (uint32);

    /**
     * @notice Returns the current spoils percentage.
     * @return The spoils percentage.
     */
    function getSpoils() external view returns (uint32);

    /**
     * @notice Initializes the Spoils Manager with the provided spoils percentage, receiver, and new owner.
     * @param _spoils The spoils percentage to set.
     * @param _receiver The address of the receiver.
     * @param _newOwner The address of the new owner.
     */
    function init(
        uint32 _spoils,
        address _receiver,
        address _newOwner
    ) external;

    /**
     * @notice Returns the address of the current owner.
     * @return The address of the owner.
     */
    function owner() external view returns (address);

    /**
     * @notice Returns the address of the current receiver.
     * @return The address of the receiver.
     */
    function receiver() external view returns (address);

    /**
     * @notice Renounces ownership of the Spoils Manager.
     */
    function renounceOwnership() external;

    /**
     * @notice Sets a new receiver address for the spoils.
     * @param _receiver The address of the new receiver.
     */
    function setReceiver(address _receiver) external;

    /**
     * @notice Sets a new spoils percentage.
     * @param _spoils The new spoils percentage to set.
     */
    function setSpoils(uint32 _spoils) external;

    /**
     * @notice Returns the current spoils percentage.
     * @return The spoils percentage.
     */
    function spoils() external view returns (uint32);

    /**
     * @notice Transfers ownership of the Spoils Manager to a new owner.
     * @param newOwner The address of the new owner.
     */
    function transferOwnership(address newOwner) external;
}
