// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ISpoilsManager} from "./interfaces/ISpoilsManager.sol";

/// @title Spoils Manager Contract
/// @notice Manages the distribution of spoils, allowing an owner to set a receiver and adjust the spoils percentage distributed to that receiver.
contract SpoilsManager is OwnableUpgradeable, ISpoilsManager {
    /// @dev The scale used to calculate the spoils percentage
    uint32 public SPLIT_PERCENTAGE_SCALE; // 100 * SPLIT_PERCENTAGE_SCALE = 100%

    /// @notice The percentage of spoils to be sent to the owner's receiver
    uint32 public spoils;

    /// @notice The address of the owner's receiver
    address public receiver;

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the SpoilsManager contract
     * @param _spoils The percentage of spoils to be sent to the owner's receiver
     * @param _percentageScale The scale used to calculate the spoils percentage
     * @param _receiver The address of the owner's receiver
     * @param _newOwner Address of the initial owner of the SpoilsManager contract
     */
    function init(
        uint32 _spoils,
        uint32 _percentageScale,
        address _receiver,
        address _newOwner
    ) external virtual initializer {
        if (_receiver == address(0)) revert ZeroReceiverAddress();
        spoils = _spoils;
        receiver = _receiver;
        __Ownable_init(_newOwner);
        SPLIT_PERCENTAGE_SCALE = _percentageScale;
    }

    /**
     * @notice Set the spoils amount to be sent to the owner's receiver
     * @param _spoils The percentage of spoils to be sent to the owner's receiver
     */
    function setSpoils(uint32 _spoils) external onlyOwner {
        spoils = _spoils;
        emit SpoilsUpdated(_spoils);
    }

    /**
     * @notice Set the owner's receiver address
     * @param _receiver The address of the owner's receiver
     */
    function setReceiver(address _receiver) external onlyOwner {
        if (_receiver == address(0)) revert ZeroReceiverAddress();
        receiver = _receiver;
    }

    /**
     * @notice Get the spoils amount to be sent to the owner's receiver
     * @return The percentage of spoils to be sent to the owner's receiver
     */
    function getSpoils() external view returns (uint32) {
        return spoils * SPLIT_PERCENTAGE_SCALE;
    }
}
