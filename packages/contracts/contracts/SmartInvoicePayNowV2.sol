//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// error ValueMustNoBeZero();

contract SmartInvoicePayNowV2 is Pausable, Ownable {
    using SafeERC20 for IERC20;

    event PayNow(
        address indexed from,
        address indexed to,
        uint256 amount,
        address indexed tokenAddress,
        string description,
        string tag,
        string ipfsHash,
        uint256 blocktime
    );

    function pause() public whenNotPaused onlyOwner {
        _pause();
    }

    function unpause() public whenPaused onlyOwner {
        _unpause();
    }

    function instantPayment(
        address to,
        uint256 amount,
        address tokenAddress,
        string memory description,
        string memory tag,
        string memory ipfsHash
    ) public payable whenNotPaused {
        if (amount == 0) {
            revert("Value must not be zero");
        }

        if (tokenAddress == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "Failed to transfer native tokens");
        } else {
            IERC20(tokenAddress).safeTransferFrom(msg.sender, to, amount);
        }

        emit PayNow(
            msg.sender,
            to,
            amount,
            tokenAddress,
            description,
            tag,
            ipfsHash,
            block.timestamp
        );
    }
}
