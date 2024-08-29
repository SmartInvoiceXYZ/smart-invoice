// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {SafeSplitsEscrowZap} from "./SafeSplitsEscrowZap.sol";

contract SafeSplitsEscrowZapFactory {
    address public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    event SafeSplitsEscrowZapCreated(
        address indexed safeSplitsEscrowZap,
        address indexed implementation,
        bytes32 indexed salt
    );

    /**
     * @dev Create a new SpoilsManager contract
     * @param _data addresses of the contracts used in the zap
     * @param _salt Salt used to create the contract address
     */
    function createSafeSplitsEscrowZap(
        bytes calldata _data,
        bytes32 _salt
    ) external returns (address) {
        address safeSplitEscrowZap = Clones.cloneDeterministic(
            implementation,
            _salt
        );
        SafeSplitsEscrowZap(safeSplitEscrowZap).init(_data);
        emit SafeSplitsEscrowZapCreated(
            safeSplitEscrowZap,
            implementation,
            _salt
        );
        return safeSplitEscrowZap;
    }
}
