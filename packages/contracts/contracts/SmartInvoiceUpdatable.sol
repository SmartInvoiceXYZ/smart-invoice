// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SmartInvoiceEscrow.sol";

// updatable digital deal lockers w/ embedded arbitration tailored for guild work
contract SmartInvoiceUpdatable is SmartInvoiceEscrow {
    using SafeERC20 for IERC20;

    /// @notice The receiving address for the provider
    address public providerReceiver;

    /**
     * Modifier for functions that can only be called by the provider
     */
    modifier onlyProvider() {
        require(msg.sender == provider, "not provider");
        _;
    }

    /**
     * Modifier for functions that can only be called by the client
     */
    modifier onlyClient() {
        require(msg.sender == client, "not client");
        _;
    }

    /**
     * Internal function for updating the client address
     * @param _client Updated client address
     */
    function _updateClient(address _client) internal {
        client = _client;
    }

    /**
     * Updates the client address
     * @param _client Updated client address
     */
    function updateClient(address _client) external onlyClient {
        require(_client != address(0), "invalid client");
        _updateClient(_client);
    }

    /**
     * Internal function for updating the provider's receiver address
     * @param _providerReceiver Updated provider receiver address
     */
    function _updateProviderReceiver(address _providerReceiver) internal {
        providerReceiver = _providerReceiver;
    }

    /**
     * Updates the provider's receiver address
     * @param _providerReceiver Updated provider receiver address
     */
    function updateProviderReceiver(
        address _providerReceiver
    ) external onlyProvider {
        require(_providerReceiver != address(0), "invalid provider receiver");
        _updateProviderReceiver(_providerReceiver);
    }

    /**
     * Internal function for updating the provider address
     * @param _provider Updated provider address
     */
    function _updateProvider(address _provider) internal {
        provider = _provider;
    }

    /**
     * @dev Updates the provider address
     * @param _provider The data to be handled and decoded
     */
    function updateProvider(address _provider) external onlyProvider {
        require(_provider != address(0), "invalid provider receiver");
        _updateProvider(_provider);
    }

    /**
     * @dev Handles the provided data, decodes it, and initializes necessary contract state variables.
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

        require(_providerReceiver != address(0), "invalid provider receiver");
        require(_client != address(0), "invalid client");
        require(_resolverType <= uint8(ADR.ARBITRATOR), "invalid resolverType");
        require(_resolver != address(0), "invalid resolver");
        require(_token != address(0), "invalid token");
        require(_terminationTime > block.timestamp, "duration ended");
        require(
            _terminationTime <= block.timestamp + MAX_TERMINATION_TIME,
            "duration too long"
        );
        require(
            _wrappedNativeToken != address(0),
            "invalid wrappedNativeToken"
        );
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

    function _transferPayment(
        address _token,
        uint256 _amount
    ) internal virtual override {
        IERC20(_token).safeTransfer(providerReceiver, _amount);
    }
}
