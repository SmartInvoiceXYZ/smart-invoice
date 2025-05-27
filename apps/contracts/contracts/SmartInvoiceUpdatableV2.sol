// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {SmartInvoiceUpdatable} from "./SmartInvoiceUpdatable.sol";

/// @title SmartInvoiceUpdatableV2
/// @notice An updatable smart invoice escrow contract with embedded arbitration tailored for guild work.
contract SmartInvoiceUpdatableV2 is SmartInvoiceUpdatable {
    using SafeERC20 for IERC20;

    /// @notice The receiving address for the provider.
    address public clientReceiver;

    /// @dev Custom errors for more efficient gas usage.
    error InvalidClientReceiver();

    /// @notice Emitted when the client's receiver address is updated.
    /// @param clientReceiver The updated client receiver address.
    event UpdatedClientReceiver(address indexed clientReceiver);

    /**
     * @notice Internal function for updating the client's receiver address.
     * @param _clientReceiver The updated client receiver address.
     */
    function _updateClientReceiver(address _clientReceiver) internal {
        clientReceiver = _clientReceiver;
        emit UpdatedClientReceiver(_clientReceiver);
    }

    /**
     * @notice Updates the client's receiver address.
     * @param _clientReceiver The updated client receiver address.
     */
    function updateClientReceiver(address _clientReceiver) external onlyClient {
        if (_clientReceiver == address(0)) revert InvalidClientReceiver();
        _updateClientReceiver(_clientReceiver);
    }

    /**
     * @notice Handles the provided data, decodes it, and initializes necessary contract state variables.
     * @param _data The data to be handled and decoded.
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
            address _providerReceiver,
            address _clientReceiver
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
                    address
                )
            );

        if (_clientReceiver == address(0)) revert InvalidClientReceiver();
        if (_providerReceiver == address(0)) revert InvalidProviderReceiver();
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
            _resolutionRate = 20;
        }

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

        if (!_requireVerification) emit Verified(client, address(this));
    }

    /**
     * @dev Internal function to withdraw payment to the client's receiver.
     * @param _token The address of the token to transfer.
     * @param _amount The amount of tokens to transfer.
     */
    function _withdrawDeposit(
        address _token,
        uint256 _amount
    ) internal virtual override {
        IERC20(_token).safeTransfer(clientReceiver, _amount);
    }
}
