// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore,
    EIP712
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {SmartInvoiceEscrowArbitrable} from "./SmartInvoiceEscrowArbitrable.sol";
import {PushStrategy} from "contracts/strategies/PushStrategy.sol";

contract SmartInvoiceEscrowArbitrablePush is
    SmartInvoiceEscrowArbitrable,
    PushStrategy
{
    constructor(
        address _wrappedETH,
        address _factory
    )
        SmartInvoiceEscrowCore(_wrappedETH, _factory)
        EIP712("SmartInvoiceEscrowArbitrablePush", "1.0.0")
    {}

    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual override {
        _transferTokenPush(_token, _recipient, _amount);
    }
}
