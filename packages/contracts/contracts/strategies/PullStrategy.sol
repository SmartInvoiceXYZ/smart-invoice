// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ISplitsWarehouse {
    function deposit(address receiver, address token, uint256 amount) external;
}

abstract contract PullStrategy {
    using SafeERC20 for IERC20;
    error InvalidSplitsWarehouse();

    ISplitsWarehouse internal immutable SPLITS_WAREHOUSE;

    constructor(address _warehouse) {
        if (_warehouse == address(0)) revert InvalidSplitsWarehouse();
        SPLITS_WAREHOUSE = ISplitsWarehouse(_warehouse);
    }

    function _transferTokenPull(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual {
        uint256 allowance = IERC20(_token).allowance(
            address(this),
            address(SPLITS_WAREHOUSE)
        );

        if (allowance < _amount) {
            IERC20(_token).forceApprove(
                address(SPLITS_WAREHOUSE),
                type(uint256).max
            );
        }

        SPLITS_WAREHOUSE.deposit(_recipient, _token, _amount);
    }
}
