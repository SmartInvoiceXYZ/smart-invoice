// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {SmartInvoiceEscrowArbitrable} from "./SmartInvoiceEscrowArbitrable.sol";
import {PullStrategy} from "contracts/strategies/PullStrategy.sol";

/// @title SmartInvoiceEscrowArbitrablePull
/// @notice Escrow with milestone-based payments, Kleros-style dispute resolution, and pull-based payouts via Splits Warehouse.
contract SmartInvoiceEscrowArbitrablePull is
    SmartInvoiceEscrowArbitrable,
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
        __EIP712_init("SmartInvoiceEscrowArbitrablePull", "1");
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
        return "SmartInvoiceEscrowArbitrablePull";
    }

    ///  @dev The version parameter for the EIP712 domain.
    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Version() internal pure override returns (string memory) {
        return "1";
    }
}
