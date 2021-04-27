// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISmartInvoiceFactory {
    function create(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        address _token,
        uint256[] calldata _amounts,
        uint256 _terminationTime,
        bytes32 _details
    ) external returns (address);

    function createDeterministic(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        address _token,
        uint256[] calldata _amounts,
        uint256 _terminationTime,
        bytes32 _details,
        bytes32 _salt
    ) external returns (address);

    function predictDeterministicAddress(bytes32 _salt)
        external
        returns (address);
}
