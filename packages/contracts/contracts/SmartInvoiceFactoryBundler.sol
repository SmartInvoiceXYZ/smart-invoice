// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
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

    /// @notice Struct representing the details of an escrow
    struct EscrowData {
        address client;
        address resolver;
        uint8 resolverType;
        address token;
        uint256 terminationTime;
        bytes32 details;
        address provider;
        address providerReceiver;
        bool requireVerification;
        bytes32 escrowType;
    }

    /// @notice Constructor to initialize the contract with the factory and wrapped token addresses
    /// @param _escrowFactory Address of the SmartInvoiceFactory
    /// @param _wrappedNativeToken Address of the wrapped native token (e.g., WETH)
    constructor(address _escrowFactory, address _wrappedNativeToken) {
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        wrappedNativeToken = IWRAPPED(_wrappedNativeToken);
    }

    /// @notice Internal function to decode and process escrow data
    /// @param _escrowData Encoded data required for escrow setup
    /// @return Returns the decoded EscrowData struct
    function _decodeEscrowData(
        bytes calldata _escrowData
    ) internal pure returns (EscrowData memory) {
        (
            address client,
            address resolver,
            uint8 resolverType,
            address token,
            uint256 terminationTime,
            bytes32 details,
            address provider,
            address providerReceiver,
            bool requireVerification,
            bytes32 escrowType
        ) = abi.decode(
                _escrowData,
                (
                    address,
                    address,
                    uint8,
                    address,
                    uint256,
                    bytes32,
                    address,
                    address,
                    bool,
                    bytes32
                )
            );

        return
            EscrowData({
                client: client,
                resolver: resolver,
                resolverType: resolverType,
                token: token,
                terminationTime: terminationTime,
                details: details,
                provider: provider,
                providerReceiver: providerReceiver,
                requireVerification: requireVerification,
                escrowType: escrowType
            });
    }

    /// @notice Internal function to deploy a new escrow contract with provided details and milestone amounts
    /// @param _milestoneAmounts Array representing the milestone payment amounts
    /// @param _escrowData Encoded escrow data
    /// @param _fundAmount Total amount to be funded into the escrow
    /// @return escrow Address of the newly deployed escrow
    function deployEscrow(
        uint256[] memory _milestoneAmounts,
        bytes calldata _escrowData,
        uint256 _fundAmount
    ) public payable nonReentrant returns (address escrow) {
        // Decode the provided escrow data
        EscrowData memory escrowData = _decodeEscrowData(_escrowData);

        // Prepare the details for the escrow creation
        bytes memory escrowDetails = abi.encode(
            escrowData.client,
            escrowData.resolverType,
            escrowData.resolver,
            escrowData.token,
            escrowData.terminationTime,
            escrowData.details,
            wrappedNativeToken,
            escrowData.requireVerification,
            address(escrowFactory),
            escrowData.providerReceiver
        );

        // Deploy the new escrow contract using the factory
        escrow = escrowFactory.create(
            escrowData.provider,
            _milestoneAmounts,
            escrowDetails,
            escrowData.escrowType
        );

        // Ensure escrow creation was successful
        if (escrow == address(0)) revert EscrowNotCreated();

        if (escrowData.token == address(wrappedNativeToken) && msg.value > 0) {
            // Ensure the fund amount is valid
            if (msg.value != _fundAmount) revert InvalidFundAmount();

            // Transfer the native fund amount to the newly created escrow contract
            // Require the client to approve the fund transfer
            wrappedNativeToken.deposit{value: _fundAmount}();

            // Transfer the fund amount to the newly created escrow contract
            // Require the client to approve the fund transfer
            IERC20(escrowData.token).safeTransfer(escrow, _fundAmount);
        } else {
            // Transfer the fund amount to the newly created escrow contract
            // Require the client to approve the fund transfer
            IERC20(escrowData.token).safeTransferFrom(
                msg.sender,
                escrow,
                _fundAmount
            );
        }

        // Emit an event for the escrow creation
        emit EscrowCreated(escrow, escrowData.token, _fundAmount);
    }
}
