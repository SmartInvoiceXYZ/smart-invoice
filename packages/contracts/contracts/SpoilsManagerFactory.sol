// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {SpoilsManager} from "./SpoilsManager.sol";
import {ISpoilsManagerFactory} from "./interfaces/ISpoilsManagerFactory.sol";

/// @title Spoils Manager Factory Contract
/// @notice Factory contract for deploying new instances of the SpoilsManager contract, allowing configuration of spoils percentage and receiver
///         Uses CREATE2 for deterministic address generation
contract SpoilsManagerFactory is ISpoilsManagerFactory {
    /// @notice The address of the SpoilsManager implementation used for creating clones
    address public immutable implementation;

    /// @notice Constructor to initialize the factory with the SpoilsManager implementation address
    /// @param _implementation The address of the SpoilsManager implementation (cannot be zero)
    constructor(address _implementation) {
        if (_implementation == address(0)) revert ZeroImplementationAddress();
        implementation = _implementation;
    }

    /**
     * @notice Create a new SpoilsManager contract using CREATE2 for deterministic address
     * @param _spoils Percentage of each payment to be sent to the owner's receiver (in scaled units, cannot be zero)
     * @param _percentageScale The scale used to calculate the spoils percentage
     * @param _receiver Address of the owner's receiver (cannot be zero address)
     * @param _newOwner Address of the initial owner of the SpoilsManager contract (uses msg.sender if zero)
     * @param _salt Salt used to create the deterministic contract address
     * @return The address of the newly created SpoilsManager contract
     */
    function createSpoilsManager(
        uint32 _spoils,
        uint32 _percentageScale,
        address _receiver,
        address _newOwner,
        bytes32 _salt
    ) external returns (address) {
        if (_spoils == uint32(0)) {
            revert InvalidSpoilsAmount();
        }
        if (_receiver == address(0)) {
            revert InvalidReceiverAddress();
        }

        address spoilsManager = Clones.cloneDeterministic(
            implementation,
            _salt
        );
        // Use msg.sender as owner if _newOwner is zero address
        address newOwner = _newOwner;
        if (newOwner == address(0)) {
            newOwner = msg.sender;
        }
        SpoilsManager(spoilsManager).init(
            _spoils,
            _percentageScale,
            _receiver,
            newOwner
        );
        emit SpoilsManagerCreated(spoilsManager, implementation, _salt);
        return spoilsManager;
    }
}
