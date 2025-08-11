// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockToken
/// @notice A mock ERC20 token contract for testing purposes, with minting and balance adjustment capabilities.
contract MockToken is ERC20 {
    /// @dev Initializes the ERC20 token with a name "MockToken" and symbol "MOCK".
    constructor() ERC20("MockToken", "MOCK") {}

    /**
     * @notice Mints new tokens to a specified account.
     * @param account The address of the account to receive the minted tokens.
     * @param amount The amount of tokens to be minted.
     */
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    /**
     * @notice Sets the balance of a specified account to a given amount.
     * @dev Mints tokens if the new balance is higher, burns tokens if it's lower.
     * @param _account The address of the account whose balance is to be set.
     * @param _amount The new balance to set for the account.
     */
    function setBalanceOf(address _account, uint256 _amount) external {
        uint256 currentBalance = balanceOf(_account);
        if (_amount > currentBalance) {
            _mint(_account, _amount - currentBalance);
        } else {
            _burn(_account, currentBalance - _amount);
        }
    }
}
