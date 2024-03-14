// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISmartInvoiceFactory {
    event LogNewInvoice(
        uint256 indexed index,
        address indexed invoice,
        uint256[] amounts,
        bytes32 invoiceType,
        uint256 version
    );
    event UpdateResolutionRate(
        address indexed resolver,
        uint256 indexed resolutionRate,
        bytes32 details
    );
    event AddImplementation(
        bytes32 indexed name,
        uint256 indexed version,
        address implementation
    );

    function create(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type
    ) external returns (address);

    function createDeterministic(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type,
        bytes32 _salt
    ) external returns (address);

    function predictDeterministicAddress(
        bytes32 _type,
        bytes32 _salt
    ) external returns (address);

    function resolutionRateOf(
        address _resolver
    ) external view returns (uint256);
}
