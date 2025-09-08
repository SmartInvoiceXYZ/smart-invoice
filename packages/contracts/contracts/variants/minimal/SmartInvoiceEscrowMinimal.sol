// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";

/// @title SmartInvoiceEscrowMinimal
/// @notice Milestone escrow with *no* on-chain dispute mechanism.
abstract contract SmartInvoiceEscrowMinimal is SmartInvoiceEscrowCore {
    error LockDisabled();

    /// @dev For this no-dispute flavor, both resolver and resolverData must be empty.
    function _handleResolverData(
        bytes memory _resolverData
    ) internal pure override {
        if (_resolverData.length != 0) {
            revert LockDisabled();
        }
    }

    /// @dev Disables the locking mechanism.
    function lock(string calldata) external payable override {
        revert LockDisabled();
    }
}
