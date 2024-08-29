// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {SpoilsManager} from "./SpoilsManager.sol";

contract SpoilsManagerFactory {
    address public implementation;

    error InvalidSpoilsAmount();
    error InvalidReceiverAddress();

    event SpoilsManagerCreated(
        address indexed spoilsManager,
        address indexed implementation,
        bytes32 indexed salt
    );

    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * @dev Create a new SpoilsManager contract
     * @param _spoils Percentage of each payment to be sent to the owner's receiver
     * @param _receiver Address of the owner's receiver
     * @param _newOwner Address of the initial owner of the SpoilsManager contract
     * @param _salt Salt used to create the contract address
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
