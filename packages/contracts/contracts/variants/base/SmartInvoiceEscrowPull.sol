// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
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
    {}

    function _postInit() internal virtual override {
        __EIP712_init("SmartInvoiceEscrowPull", "1.0.0");
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
        return "SmartInvoiceEscrowPull";
    }

    // solhint-disable-next-line func-name-mixedcase
    function _EIP712Version() internal pure override returns (string memory) {
        return "1.0.0";
    }
}
