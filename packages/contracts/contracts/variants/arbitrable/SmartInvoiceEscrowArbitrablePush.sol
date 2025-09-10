// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
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
    ) SmartInvoiceEscrowCore(_wrappedETH, _factory) {}

    function _postInit() internal virtual override {
        __EIP712_init("SmartInvoiceEscrowArbitrablePush", "1.0.0");
    }

    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual override {
        _transferTokenPush(_token, _recipient, _amount);
    }

    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Name() internal pure override returns (string memory) {
        return "SmartInvoiceEscrowArbitrablePush";
    }

    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Version() internal pure override returns (string memory) {
        return "1.0.0";
    }
}
