// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ISplitsWarehouse
/// @notice Interface for the Splits Warehouse contract for depositing tokens
interface ISplitsWarehouse {
    /// @notice Deposits tokens to a recipient's balance in the warehouse
    /// @param receiver The address that will receive the deposited tokens
    /// @param token The token contract address to deposit
    /// @param amount The amount of tokens to deposit
    function deposit(address receiver, address token, uint256 amount) external;
}

/// @title PullStrategy
/// @notice Abstract contract implementing pull-based token distribution strategy via Splits Warehouse
/// @dev This strategy deposits tokens to recipients' balances in the Splits Warehouse rather than direct transfers
abstract contract PullStrategy {
    using SafeERC20 for IERC20;

    /// @notice The Splits Warehouse contract used for token deposits
    ISplitsWarehouse public immutable SPLITS_WAREHOUSE;

    /// @notice Thrown when an invalid warehouse address is provided
    error InvalidSplitsWarehouse();

    /// @notice Initializes the strategy with a Splits Warehouse address
    /// @param _warehouse The address of the Splits Warehouse contract
    constructor(address _warehouse) {
        if (_warehouse == address(0)) revert InvalidSplitsWarehouse();
        SPLITS_WAREHOUSE = ISplitsWarehouse(_warehouse);
    }

    /// @dev Approves and deposits tokens into the Splits Warehouse; holds unlimited allowance by default.
    function _transferTokenPull(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual {
        if (_amount == 0) return;
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
