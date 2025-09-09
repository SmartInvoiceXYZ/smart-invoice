// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore,
    EIP712
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {SmartInvoiceEscrow} from "./SmartInvoiceEscrow.sol";
import {PullStrategy} from "contracts/strategies/PullStrategy.sol";

contract SmartInvoiceEscrowPull is SmartInvoiceEscrow, PullStrategy {
    constructor(
        address _wrappedETH,
        address _factory,
        address _splitsWarehouse
    )
        SmartInvoiceEscrowCore(_wrappedETH, _factory)
        PullStrategy(_splitsWarehouse)
        EIP712("SmartInvoiceEscrowPull", "1.0.0")
    {}

    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual override {
        _transferTokenPull(_token, _recipient, _amount);
    }
}
