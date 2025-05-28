// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {SmartInvoiceEscrow} from "./SmartInvoiceEscrow.sol";

/// @title SmartInvoiceUpdatable
/// @notice An updatable smart invoice escrow contract with embedded arbitration tailored for guild work.
contract SmartInvoiceUpdatable is SmartInvoiceEscrow {
    using SafeERC20 for IERC20;

    /// @notice The receiving address for the provider.
    address public providerReceiver;

    /// @dev Custom errors for more efficient gas usage.
    error InvalidProviderReceiver();

    /// @notice Emitted when the client address is updated.
    /// @param client The updated client address.
    event UpdatedClient(address indexed client);

    /// @notice Emitted when the provider address is updated.
    /// @param provider The updated provider address.
    event UpdatedProvider(address indexed provider);

    /// @notice Emitted when the provider's receiver address is updated.
    /// @param providerReceiver The updated provider receiver address.
    event UpdatedProviderReceiver(address indexed providerReceiver);

    /// @dev Modifier for functions that can only be called by the provider.
    modifier onlyProvider() {
        if (msg.sender != provider) revert NotProvider();
        _;
    }

    /// @dev Modifier for functions that can only be called by the client.
    modifier onlyClient() {
        if (msg.sender != client) revert NotClient();
        _;
    }

    /**
     * @notice Internal function for updating the client address.
     * @param _client The updated client address.
     */
    function _updateClient(address _client) internal {
        client = _client;
        emit UpdatedClient(_client);
    }

    /**
     * @notice Updates the client address.
     * @param _client The updated client address.
     */
    function updateClient(address _client) external onlyClient {
        if (_client == address(0)) revert InvalidClient();
        _updateClient(_client);
    }

    /**
     * @notice Internal function for updating the provider's receiver address.
     * @param _providerReceiver The updated provider receiver address.
     */
    function _updateProviderReceiver(address _providerReceiver) internal {
        providerReceiver = _providerReceiver;
        emit UpdatedProviderReceiver(_providerReceiver);
    }

    /**
     * @notice Updates the provider's receiver address.
     * @param _providerReceiver The updated provider receiver address.
     */
    function updateProviderReceiver(
        address _providerReceiver
    ) external onlyProvider {
        if (_providerReceiver == address(0)) revert InvalidProviderReceiver();
        _updateProviderReceiver(_providerReceiver);
    }

    /**
     * @notice Internal function for updating the provider address.
     * @param _provider The updated provider address.
     */
    function _updateProvider(address _provider) internal {
        provider = _provider;
        emit UpdatedProvider(_provider);
    }

    /**
     * @notice Updates the provider address.
     * @param _provider The updated provider address.
     */
    function updateProvider(address _provider) external onlyProvider {
        if (_provider == address(0)) revert InvalidProvider();
        _updateProvider(_provider);
    }

    /**
     * @notice Handles the provided data, decodes it, and initializes necessary contract state variables.
     * @param _data The data to be handled and decoded.
     */
    function _handleData(bytes calldata _data) internal virtual override {
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
            address _providerReceiver
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
                    address
                )
            );

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

        if (!_requireVerification) emit Verified(client, address(this));
    }

    /**
     * @dev Internal function to transfer payment to the provider's receiver.
     * @param _token The address of the token to transfer.
     * @param _amount The amount of tokens to transfer.
     */
    function _transferPayment(
        address _token,
        uint256 _amount
    ) internal virtual override {
        IERC20(_token).safeTransfer(providerReceiver, _amount);
    }
}
