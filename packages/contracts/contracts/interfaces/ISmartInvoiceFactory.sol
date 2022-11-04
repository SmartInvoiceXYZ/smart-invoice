// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISmartInvoiceFactory {
    function create(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _invoiceData,
        bytes32 _implementationType
    ) external returns (address);

    function createDeterministic(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        bytes32 _implementationType,
        bytes32 _salt
    ) external returns (address);

    function predictDeterministicAddress(
        bytes32 _implementationType,
        bytes32 _salt
    ) external returns (address);
}
