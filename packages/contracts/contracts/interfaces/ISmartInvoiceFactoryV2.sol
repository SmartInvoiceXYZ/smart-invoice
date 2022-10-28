// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISmartInvoiceFactoryV2 {
    function create(
        address _client,
        address _provider,
        address _resolver,
        uint256[] calldata _amounts,
        bytes memory _implementationData,
        uint256 _implementationType,
        uint256 _implementationSelector
    ) external returns (address);

    function createDeterministic(
        address _client,
        address _provider,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        uint256 _implementationType,
        uint256 _implementationSelector,
        bytes32 _salt
    ) external returns (address);

    function predictDeterministicAddress(
        uint256 _implementationType,
        uint256 _implemenationSelector,
        bytes32 _salt
    ) external returns (address);
}
