// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISmartInvoiceFactoryV2 {
    function create(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes memory _implementationData,
        uint8 _implementationType,
        uint8 _implementationVersion
    ) external returns (address);

    function createDeterministic(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        uint8 _implementationType,
        uint8 _implementationVersion,
        bytes32 _salt
    ) external returns (address);

    function predictDeterministicAddress(
        uint8 _implementationType,
        uint8 _implemenationVersion,
        bytes32 _salt
    ) external returns (address);
}
