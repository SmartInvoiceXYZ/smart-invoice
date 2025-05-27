// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/// @title ISafeSplitsEscrowZap
/// @notice Interface for creating and managing safe split escrow contracts with customizable settings.
interface ISafeSplitsEscrowZap {
    /**
     * @notice Creates a new safe split escrow contract.
     * @param _owners The array of addresses that will be the owners of the safe.
     * @param _percentAllocations The array of percentage allocations for each owner.
     * @param _milestoneAmounts The array of milestone amounts associated with the escrow.
     * @param _safeData The data for setting up the safe contract.
     * @param _safeAddress The address of the safe contract.
     * @param _splitData The data for setting up the split contract.
     * @param _escrowData The data for setting up the escrow contract.
     */
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        address _safeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) external;

    /**
     * @notice Initializes the contract with the provided data.
     * @param _data The data to initialize the contract with.
     */
    function init(bytes memory _data) external;

    /**
     * @notice Updates the addresses used by the contract.
     * @param _data The data containing the new addresses to be updated.
     */
    function updateAddresses(bytes memory _data) external;

    /**
     * @notice Updates the distributor fee for the contract.
     * @param _distributorFee The new distributor fee as a percentage (scaled by 1e6).
     */
    function updateDistributorFee(uint32 _distributorFee) external;

    /// @dev Custom errors for more efficient gas usage.
    error InvalidAllocationsOwnersData();
    error SafeNotCreated();
    error ProjectTeamSplitNotCreated();
    error EscrowNotCreated();
    error NotAuthorized();

    /// @notice Emitted when a new Safe splits escrow is created.
    /// @param safe The address of the created Safe.
    /// @param projectTeamSplit The address of the created project team split.
    /// @param escrow The address of the created escrow.
    event SafeSplitsEscrowCreated(
        address safe,
        address projectTeamSplit,
        address escrow
    );

    /// @notice Emitted when addresses are updated.
    /// @param safeSingleton The updated Safe singleton address.
    /// @param safeFactory The updated Safe proxy factory address.
    /// @param splitMain The updated SplitMain address.
    /// @param escrowFactory The updated SmartInvoiceFactory address.
    event UpdatedAddresses(
        address safeSingleton,
        address safeFactory,
        address splitMain,
        address escrowFactory
    );

    /// @notice Emitted when the distributor fee is updated.
    /// @param distributorFee The updated distributor fee.
    event UpdatedDistributorFee(uint32 distributorFee);
}
