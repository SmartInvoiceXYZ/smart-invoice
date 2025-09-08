// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {SmartInvoiceEscrow} from "./SmartInvoiceEscrow.sol";
import {PushStrategy} from "contracts/strategies/PushStrategy.sol";

contract SmartInvoiceEscrowPush is SmartInvoiceEscrow, PushStrategy {
    constructor(
        address _wrappedETH,
        address _factory
    ) SmartInvoiceEscrowCore(_wrappedETH, _factory) {}

    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual override {
        _transferTokenPush(_token, _recipient, _amount);
    }
}
