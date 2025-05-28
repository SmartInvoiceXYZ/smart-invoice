// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/// @title ISafeProxyFactory
/// @notice Interface for a Safe proxy factory that provides functions to create and manage proxy contracts.
interface ISafeProxyFactory {
    /**
     * @notice Creates a chain-specific proxy contract with a given initializer and nonce.
     * @param _singleton The address of the singleton contract to use as the base for the proxy.
     * @param initializer The initialization data for the proxy.
     * @param saltNonce A salt value used to create a unique proxy address.
     * @return proxy The address of the created proxy contract.
     */
    function createChainSpecificProxyWithNonce(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce
    ) external returns (address proxy);

    /**
     * @notice Creates a proxy contract with a given initializer, nonce, and callback.
     * @param _singleton The address of the singleton contract to use as the base for the proxy.
     * @param initializer The initialization data for the proxy.
     * @param saltNonce A salt value used to create a unique proxy address.
     * @param callback The address of a contract to call after proxy creation.
     * @return proxy The address of the created proxy contract.
     */
    function createProxyWithCallback(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce,
        address callback
    ) external returns (address proxy);

    /**
     * @notice Creates a proxy contract with a given initializer and nonce.
     * @param _singleton The address of the singleton contract to use as the base for the proxy.
     * @param initializer The initialization data for the proxy.
     * @param saltNonce A salt value used to create a unique proxy address.
     * @return proxy The address of the created proxy contract.
     */
    function createProxyWithNonce(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce
    ) external returns (address proxy);

    /**
     * @notice Returns the chain ID of the current blockchain.
     * @return The chain ID of the current blockchain.
     */
    function getChainId() external view returns (uint256);

    /**
     * @notice Returns the proxy creation code.
     * @return The creation code for deploying a proxy contract.
     */
    function proxyCreationCode() external pure returns (bytes memory);
}
