// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SmartInvoiceEscrowBase} from "./SmartInvoiceEscrowBase.sol";

/// @title SmartInvoiceEscrowMinimal
/// @notice Milestone escrow with *no* on-chain dispute mechanism.
contract SmartInvoiceEscrowMinimal is SmartInvoiceEscrowBase {
    error LockDisabled();

    constructor(
        address _wrappedETH,
        address _factory
    ) SmartInvoiceEscrowBase(_wrappedETH, _factory) {}

    /// @dev For this no-dispute flavor, both resolver and resolverData must be empty.
    function _handleResolverData(
        bytes memory _resolverData
    ) internal pure override {
        if (_resolverData.length != 0) {
            revert LockDisabled();
        }
        // Leave `resolver` as zero address; nothing else to store.
    }

    /// @dev Disables the locking mechanism.
    function lock(string calldata) external payable override {
        revert LockDisabled();
    }
}
