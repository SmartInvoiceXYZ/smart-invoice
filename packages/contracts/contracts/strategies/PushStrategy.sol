// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract PushStrategy {
    using SafeERC20 for IERC20;

    function _transferTokenPush(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual {
        IERC20(_token).safeTransfer(_recipient, _amount);
    }
}
