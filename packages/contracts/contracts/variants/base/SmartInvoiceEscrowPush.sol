// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {SmartInvoiceEscrow} from "./SmartInvoiceEscrow.sol";
import {PushStrategy} from "contracts/strategies/PushStrategy.sol";

/// @title SmartInvoiceEscrowPush
/// @notice Escrow with milestone-based payments and direct (push) token transfers to recipients.
contract SmartInvoiceEscrowPush is SmartInvoiceEscrow, PushStrategy {
    constructor(
        address _wrappedETH,
        address _factory
    ) SmartInvoiceEscrowCore(_wrappedETH, _factory) {}

    /// @inheritdoc SmartInvoiceEscrowCore
    function _postInit() internal virtual override {
        __EIP712_init("SmartInvoiceEscrowPush", "1");
    }

    /// @inheritdoc SmartInvoiceEscrowCore
    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual override {
        _transferTokenPush(_token, _recipient, _amount);
    }

    ///  @dev The name parameter for the EIP712 domain.
    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Name() internal pure override returns (string memory) {
        return "SmartInvoiceEscrowPush";
    }

    ///  @dev The version parameter for the EIP712 domain.
    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Version() internal pure override returns (string memory) {
        return "1";
    }
}
