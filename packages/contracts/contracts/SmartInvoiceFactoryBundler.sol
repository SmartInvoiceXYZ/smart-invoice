// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SmartInvoiceFactoryBundler
/// @notice Contract for creating and managing Safe splits escrow with customizable settings.
contract SmartInvoiceFactoryBundler {
    using SafeERC20 for IERC20;

    /// @notice The SmartInvoiceFactory address
    ISmartInvoiceFactory public escrowFactory;

    /// @notice The wrapped native token (WETH) address
    IWRAPPED public wrappedNativeToken;

    error EscrowNotCreated();

    event EscrowCreated(address escrow, address token, uint256 amount);

    struct EscrowData {
        address client;
        address resolver;
        address token;
        uint256 terminationTime;
        bytes32 details;
        address provider;
        address providerReceiver;
    }

    constructor(address _escrowFactory, address _wrappedNativeToken) {
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        wrappedNativeToken = IWRAPPED(_wrappedNativeToken);
    }

    /**
     * @dev Internal function to handle escrow data.
     * @param _escrowData The encoded data for escrow setup.
     */
    function _handleEscrowData(
        bytes calldata _escrowData
    ) internal pure returns (EscrowData memory) {
        (
            address client,
            address resolver,
            address token,
            uint256 terminationTime,
            bytes32 details,
            address provider,
            address providerReceiver
        ) = abi.decode(
                _escrowData,
                (address, address, address, uint256, bytes32, address, address)
            );

        return
            EscrowData({
                client: client,
                resolver: resolver,
                token: token,
                terminationTime: terminationTime,
                details: details,
                provider: provider,
                providerReceiver: providerReceiver
            });
    }

    /**
     * @dev Internal function to deploy a new Escrow with the provided details.
     * @param _milestoneAmounts The milestone amounts for the escrow.
     * @param _escrowData The encoded data for escrow setup.
     */
    function _deployEscrow(
        uint256[] memory _milestoneAmounts,
        bytes calldata _escrowData,
        uint256 _fundAmount
    ) internal returns (address escrow) {
        EscrowData memory escrowData = _handleEscrowData(_escrowData);

        // Encode data for escrow setup
        bytes memory escrowDetails = abi.encode(
            escrowData.client,
            0,
            escrowData.resolver,
            escrowData.token,
            escrowData.terminationTime,
            escrowData.details,
            wrappedNativeToken,
            false, // requireVerification
            address(escrowFactory), // factory address
            escrowData.providerReceiver // providerReceiver
        );

        // Deploy the escrow
        escrow = escrowFactory.create(
            escrowData.provider, // provider
            _milestoneAmounts, // milestoneAmounts
            escrowDetails,
            bytes32("updatable")
        );
        if (escrow == address(0)) revert EscrowNotCreated();

        IERC20(escrowData.token).safeTransferFrom(
            msg.sender,
            escrow,
            _fundAmount
        );

        emit EscrowCreated(escrow, escrowData.token, _fundAmount);
    }
}
