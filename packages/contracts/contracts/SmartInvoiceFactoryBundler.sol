// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SmartInvoiceFactoryBundler
/// @notice A contract for creating and managing SmartInvoice escrow with customizable settings.
contract SmartInvoiceFactoryBundler is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Address of the SmartInvoiceFactory
    ISmartInvoiceFactory public escrowFactory;

    /// @notice Address of the wrapped native token (e.g., WETH)
    IWRAPPED public wrappedNativeToken;

    /// @notice Error emitted when escrow creation fails
    error EscrowNotCreated();

    /// @notice Error emitted when the fund amount is invalid
    error InvalidFundAmount();

    /// @notice Event emitted when a new escrow is created
    /// @param escrow Address of the newly created escrow
    /// @param token Address of the token used for payment
    /// @param amount The total fund amount transferred to the escrow
    event EscrowCreated(
        address indexed escrow,
        address indexed token,
        uint256 amount
    );

    /// @notice Constructor to initialize the contract with the factory and wrapped token addresses
    /// @param _escrowFactory Address of the SmartInvoiceFactory
    /// @param _wrappedNativeToken Address of the wrapped native token (e.g., WETH)
    constructor(address _escrowFactory, address _wrappedNativeToken) {
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        wrappedNativeToken = IWRAPPED(_wrappedNativeToken);
    }

    /// @notice Internal function to deploy a new escrow contract with provided details and milestone amounts
    /// @param _milestoneAmounts Array representing the milestone payment amounts
    /// @param _escrowData Encoded escrow data
    /// @param _fundAmount Total amount to be funded into the escrow
    /// @return escrow Address of the newly deployed escrow
    function deployEscrow(
        address _provider,
        uint256[] memory _milestoneAmounts,
        bytes calldata _escrowData,
        bytes32 _escrowType,
        uint256 _fundAmount
    ) public payable nonReentrant returns (address escrow) {
        // Deploy the new escrow contract using the factory
        escrow = escrowFactory.create(
            _provider,
            _milestoneAmounts,
            _escrowData,
            _escrowType
        );

        // Ensure escrow creation was successful
        if (escrow == address(0)) revert EscrowNotCreated();

        address token = ISmartInvoiceEscrow(escrow).token();

        if (token == address(wrappedNativeToken) && msg.value > 0) {
            // Ensure the fund amount is valid
            if (msg.value != _fundAmount) revert InvalidFundAmount();

            // Transfer the native fund amount to the newly created escrow contract
            // Require the client to approve the fund transfer
            wrappedNativeToken.deposit{value: _fundAmount}();

            // Transfer the fund amount to the newly created escrow contract
            // Require the client to approve the fund transfer
            IERC20(token).safeTransfer(escrow, _fundAmount);
        } else {
            // Transfer the fund amount to the newly created escrow contract
            // Require the client to approve the fund transfer
            IERC20(token).safeTransferFrom(msg.sender, escrow, _fundAmount);
        }

        // Emit an event for the escrow creation
        emit EscrowCreated(escrow, token, _fundAmount);
    }
}
