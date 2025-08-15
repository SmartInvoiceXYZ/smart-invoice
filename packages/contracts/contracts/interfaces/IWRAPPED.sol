// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/// @title IWRAPPED
/// @notice Interface for a canonical ETH wrapper contract, typically used to wrap ETH into ERC20 tokens.
interface IWRAPPED {
    /**
     * @notice Deposits ETH into the contract and wraps them.
     * @dev This function is payable and should be called with a specific amount of ETH to wrap.
     * The ETH sent with the call will be wrapped and the corresponding wrapped token amount will be credited to the sender's address.
     */
    function deposit() external payable;
}
