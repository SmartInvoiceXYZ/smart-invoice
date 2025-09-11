// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title PushStrategy
/// @notice Abstract contract implementing push-based token distribution strategy
/// @dev This strategy transfers tokens directly to recipients' addresses
abstract contract PushStrategy {
    using SafeERC20 for IERC20;

    /// @dev Direct ERC20 transfer to recipient (no intermediate custody).
    function _transferTokenPush(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual {
        if (_amount == 0) return;
        IERC20(_token).safeTransfer(_recipient, _amount);
    }
}
