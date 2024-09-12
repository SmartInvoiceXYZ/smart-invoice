// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {SafeSplitsEscrowZap} from "./SafeSplitsEscrowZap.sol";

/// @title SafeSplitsEscrowZapFactory
/// @notice Factory contract for creating SafeSplitsEscrowZap instances using the Clones library.
contract SafeSplitsEscrowZapFactory {
    /// @notice The address of the SafeSplitsEscrowZap implementation used for creating clones.
    address public implementation;

    /// @notice Emitted when a new SafeSplitsEscrowZap is created.
    /// @param safeSplitsEscrowZap The address of the newly created SafeSplitsEscrowZap instance.
    /// @param implementation The address of the implementation contract used for creating the clone.
    /// @param salt The salt used to create the deterministic address of the clone.
    event SafeSplitsEscrowZapCreated(
        address indexed safeSplitsEscrowZap,
        address indexed implementation,
        bytes32 indexed salt
    );

    /// @notice Constructor to initialize the factory with the address of the SafeSplitsEscrowZap implementation.
    /// @param _implementation The address of the SafeSplitsEscrowZap implementation.
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * @notice Creates a new SafeSplitsEscrowZap instance using a deterministic address.
     * @param _data Initialization data to be passed to the new SafeSplitsEscrowZap instance.
     * @param _salt Salt used to create the deterministic address of the clone.
     * @return safeSplitsEscrowZap The address of the newly created SafeSplitsEscrowZap instance.
     */
    function createSafeSplitsEscrowZap(
        bytes calldata _data,
        bytes32 _salt
    ) external returns (address safeSplitsEscrowZap) {
        safeSplitsEscrowZap = Clones.cloneDeterministic(implementation, _salt);
        SafeSplitsEscrowZap(safeSplitsEscrowZap).init(_data);

        emit SafeSplitsEscrowZapCreated(
            safeSplitsEscrowZap,
            implementation,
            _salt
        );

        return safeSplitsEscrowZap;
    }
}
