// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISmartInvoiceV2 {
    function init(
        address _client,
        address _provider,
        address _resolver,
        uint256[] calldata _amounts,
        uint256 _resolutionRate,
        address _wrappedNativeToken,
        bytes calldata _implementationData,
        uint8 _implementationType,
        uint8 _implementationSelector
    ) external;

    function release() external;

    function release(uint256 _milestone) external;

    function releaseTokens(address _token) external;

    function withdraw() external;

    function withdrawTokens(address _token) external;

    function lock(bytes32 _details) external payable;

    function resolve(
        uint256 _clientAward,
        uint256 _providerAward,
        bytes32 _details
    ) external;
}
