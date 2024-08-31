// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/// @title IWRAPPED
/// @notice Interface for a canonical native token wrapper contract, typically used to wrap native blockchain tokens into ERC20 tokens.
interface IWRAPPED {
    /**
     * @notice Deposits native tokens into the contract and wraps them.
     * @dev This function is payable and should be called with a specific amount of native tokens to wrap.
     * The native tokens sent with the call will be wrapped and the corresponding wrapped token amount will be credited to the sender's address.
     */
    function deposit() external payable;
}
