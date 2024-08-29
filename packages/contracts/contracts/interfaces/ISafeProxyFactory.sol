// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISafeProxyFactory {
    function createChainSpecificProxyWithNonce(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce
    ) external returns (address proxy);

    function createProxyWithCallback(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce,
        address callback
    ) external returns (address proxy);

    function createProxyWithNonce(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce
    ) external returns (address proxy);

    function getChainId() external view returns (uint256);

    function proxyCreationCode() external pure returns (bytes memory);
}
