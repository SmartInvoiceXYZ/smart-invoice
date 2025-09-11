// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";

/// @title SmartInvoiceEscrowMinimal
/// @notice Minimal escrow with milestone-based payments and no dispute resolution mechanism.
abstract contract SmartInvoiceEscrowMinimal is SmartInvoiceEscrowCore {
    error LockDisabled();

    /// @dev Disables the locking mechanism.
    function lock(string calldata) external payable override {
        revert LockDisabled();
    }

    /// @dev Disables the locking mechanism.
    function unlock(
        UnlockData calldata,
        bytes calldata
    ) external pure override {
        revert LockDisabled();
    }

    /**
     * @notice Internal helper to handle resolver data.
     * @dev For the no-dispute variant, both `resolver` and `resolverData` must be empty.
     * @param _resolverData Resolver data to decode. MUST be empty (`length == 0`).
     */
    function _handleResolverData(
        bytes memory _resolverData
    ) internal pure override {
        if (_resolverData.length != 0) {
            revert InvalidResolverData();
        }
    }
}
