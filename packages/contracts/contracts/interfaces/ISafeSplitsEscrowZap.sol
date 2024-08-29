// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISafeSplitsEscrowZap {
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        address _safeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) external;

    function init(bytes memory _data) external;

    function updateAddresses(bytes memory _data) external;

    function updateDistributorFee(uint32 _distributorFee) external;
}
