// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {SmartInvoiceEscrowArbitrable} from "./SmartInvoiceEscrowArbitrable.sol";
import {PullStrategy} from "contracts/strategies/PullStrategy.sol";

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

    function _postInit() internal virtual override {
        __EIP712_init("SmartInvoiceEscrowArbitrablePull", "1.0.0");
    }

    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual override {
        _transferTokenPull(_token, _recipient, _amount);
    }

    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Name() internal pure override returns (string memory) {
        return "SmartInvoiceEscrowArbitrablePull";
    }

    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Version() internal pure override returns (string memory) {
        return "1.0.0";
    }
}
