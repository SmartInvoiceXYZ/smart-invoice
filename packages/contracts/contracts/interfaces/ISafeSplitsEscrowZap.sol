// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISafeSplitsEscrowZap {
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes memory _safeData,
        bytes memory _escrowData
    ) external;

    function getAddresses()
        external
        view
        returns (address, address, address, address, address, address);

    function getDistributorFee() external view returns (uint32);

    function init(bytes memory _data) external;

    function initLock() external;

    function updateAddresses(bytes memory _data) external;

    function updateDistributorFee(uint32 _distributorFee) external;
}
