// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ISafeSplitsEscrowZap} from "./interfaces/ISafeSplitsEscrowZap.sol";
import {
    ISafeSplitsEscrowZapFactory
} from "./interfaces/ISafeSplitsEscrowZapFactory.sol";

/// @title SafeSplitsEscrowZapFactory
/// @notice Factory contract for creating SafeSplitsEscrowZap instances using the Clones library.
contract SafeSplitsEscrowZapFactory is ISafeSplitsEscrowZapFactory {
    /// @notice The address of the SafeSplitsEscrowZap implementation used for creating clones.
    address public immutable implementation;

    /// @notice Constructor to initialize the factory with the address of the SafeSplitsEscrowZap implementation.
    /// @param _implementation The address of the SafeSplitsEscrowZap implementation.
    constructor(address _implementation) {
        if (_implementation == address(0)) revert ZeroImplementationAddress();
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
        ISafeSplitsEscrowZap(safeSplitsEscrowZap).init(_data);

        emit SafeSplitsEscrowZapCreated(
            safeSplitsEscrowZap,
            implementation,
            _salt
        );

        return safeSplitsEscrowZap;
    }
}
