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
        (
            address _client,
            uint8 _resolverType,
            address _resolver,
            address _token,
            uint256 _terminationTime, // exact termination date in seconds since epoch
            bytes32 _details,
            address _wrappedNativeToken,
            bool _requireVerification,
            address _factory,
            address _dao,
            uint256 _daoFee
        ) = abi.decode(
                _data,
                (
                    address,
                    uint8,
                    address,
                    address,
                    uint256,
                    bytes32,
                    address,
                    bool,
                    address,
                    address,
                    uint256
                )
            );

        if (_daoFee > 0 && _dao == address(0)) revert InvalidDAO();
        if (_client == address(0)) revert InvalidClient();
        if (_resolverType > uint8(ADR.ARBITRATOR)) revert InvalidResolverType();
        if (_resolver == address(0)) revert InvalidResolver();
        if (_token == address(0)) revert InvalidToken();
        if (_terminationTime <= block.timestamp) revert DurationEnded();
        if (_terminationTime > block.timestamp + MAX_TERMINATION_TIME)
            revert DurationTooLong();
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();

        uint256 _resolutionRate = ISmartInvoiceFactory(_factory)
            .resolutionRateOf(_resolver);
        if (_resolutionRate == 0) {
            _resolutionRate = 20; // Default resolution rate if not specified
        }

        client = _client;
        resolverType = ADR(_resolverType);
        resolver = _resolver;
        token = _token;
        terminationTime = _terminationTime;
        resolutionRate = _resolutionRate;
        details = _details;
        wrappedNativeToken = _wrappedNativeToken;
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

        IERC20(_token).safeTransfer(dao, daoAmount);
        IERC20(_token).safeTransfer(provider, providerAmount);
    }
}
