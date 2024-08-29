// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("MockToken", "MOCK") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function setBalanceOf(address _account, uint256 _amount) external {
        uint256 currentBalance = balanceOf(_account);
        if (_amount > currentBalance) {
            _mint(_account, _amount - currentBalance);
        } else {
            _burn(_account, currentBalance - _amount);
        }
    }
}
