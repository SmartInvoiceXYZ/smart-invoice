// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {SmartInvoiceEscrowMinimal} from "./SmartInvoiceEscrowMinimal.sol";
import {PullStrategy} from "contracts/strategies/PullStrategy.sol";

/// @title SmartInvoiceEscrowMinimalPull
/// @notice Minimal escrow with milestone-based payments and pull-based token distribution via Splits Warehouse.
contract SmartInvoiceEscrowMinimalPull is
    SmartInvoiceEscrowMinimal,
    PullStrategy
{
    constructor(
        address _wrappedETH,
        address _factory,
        address _splitsWarehouse
    )
        SmartInvoiceEscrowCore(_wrappedETH, _factory)
        PullStrategy(_splitsWarehouse)
    {}

    /// @inheritdoc SmartInvoiceEscrowCore
    function _postInit() internal virtual override {
        __EIP712_init("SmartInvoiceEscrowMinimalPull", "1");
    }

    /// @inheritdoc SmartInvoiceEscrowCore
    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual override {
        _transferTokenPull(_token, _recipient, _amount);
    }

    ///  @dev The name parameter for the EIP712 domain.
    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Name() internal pure override returns (string memory) {
        return "SmartInvoiceEscrowMinimalPull";
    }

    ///  @dev The version parameter for the EIP712 domain.
    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Version() internal pure override returns (string memory) {
        return "1";
    }
}
