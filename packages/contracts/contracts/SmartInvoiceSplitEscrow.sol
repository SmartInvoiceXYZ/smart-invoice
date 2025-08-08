// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {SmartInvoiceEscrow} from "./SmartInvoiceEscrow.sol";

/// @title SmartInvoiceSplitEscrow
/// @notice An extension of the SmartInvoiceEscrow contract that adds DAO fee handling.
contract SmartInvoiceSplitEscrow is SmartInvoiceEscrow {
    using SafeERC20 for IERC20;

    address public dao;
    uint256 public daoFee;

    /// @dev Error definitions for more efficient gas usage.
    error InvalidDAO();

    /**
     * @notice Handles the provided data, decodes it, and initializes necessary contract state variables.
     * @param _data The data to be handled and decoded
     */
    function _handleData(bytes calldata _data) internal override {
        // Decode the first part of data
        (
            address _client,
            uint8 _resolverType,
            address _resolver,
            address _token,
            uint256 _terminationTime,
            bytes32 _details,
            address _wrappedNativeToken,
            bool _requireVerification,
            address _factory
        ) = abi.decode(
                _data[0:288], // 9 * 32 bytes
                (
                    address,
                    uint8,
                    address,
                    address,
                    uint256,
                    bytes32,
                    address,
                    bool,
                    address
                )
            );

        // Decode the second part of data
        (
            address _providerReceiver,
            address _clientReceiver,
            address _dao,
            uint256 _daoFee
        ) = abi.decode(
                _data[288:], // Remaining bytes
                (address, address, address, uint256)
            );

        _validateAndSetData(
            _client,
            _resolverType,
            _resolver,
            _token,
            _terminationTime,
            _details,
            _wrappedNativeToken,
            _requireVerification,
            _factory,
            _providerReceiver,
            _clientReceiver,
            _dao,
            _daoFee
        );
    }

    /**
     * @dev Internal function to validate and set contract data to avoid stack too deep
     */
    function _validateAndSetData(
        address _client,
        uint8 _resolverType,
        address _resolver,
        address _token,
        uint256 _terminationTime,
        bytes32 _details,
        address _wrappedNativeToken,
        bool _requireVerification,
        address _factory,
        address _providerReceiver,
        address _clientReceiver,
        address _dao,
        uint256 _daoFee
    ) internal {
        uint256 _resolutionRate = ISmartInvoiceFactory(_factory)
            .resolutionRateOf(_resolver);
        if (_resolutionRate == 0) {
            _resolutionRate = 20;
        }

        if (_daoFee > 0 && _dao == address(0)) revert InvalidDAO();
        if (_client == address(0)) revert InvalidClient();
        if (_resolverType > uint8(ADR.ARBITRATOR)) revert InvalidResolverType();
        if (_resolver == address(0)) revert InvalidResolver();
        if (_token == address(0)) revert InvalidToken();
        if (_terminationTime <= block.timestamp) revert DurationEnded();
        if (_terminationTime > block.timestamp + MAX_TERMINATION_TIME)
            revert DurationTooLong();
        if (_resolutionRate == 0) revert InvalidResolutionRate();
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();

        client = _client;
        resolverType = ADR(_resolverType);
        resolver = _resolver;
        token = _token;
        terminationTime = _terminationTime;
        resolutionRate = _resolutionRate;
        details = _details;
        wrappedNativeToken = _wrappedNativeToken;
        providerReceiver = _providerReceiver;
        clientReceiver = _clientReceiver;
        dao = _dao;
        daoFee = _daoFee;

        if (!_requireVerification) emit Verified(client, address(this));
    }

    /**
     * @dev Internal function to transfer payment to the provider and DAO.
     * @param _token The address of the token to transfer.
     * @param _amount The amount of tokens to transfer.
     */
    function _transferPayment(
        address _token,
        uint256 _amount
    ) internal virtual override {
        uint256 daoAmount = (_amount * daoFee) / 10000;
        uint256 providerAmount = _amount - daoAmount;

        if (daoAmount > 0) {
            IERC20(_token).safeTransfer(dao, daoAmount);
        }
        if (providerAmount > 0) {
            // Use the same receiver logic as base contract - respect providerReceiver if set
            address recipient = providerReceiver != address(0)
                ? providerReceiver
                : provider;
            IERC20(_token).safeTransfer(recipient, providerAmount);
        }
    }
}
