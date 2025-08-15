// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/// @title ISafeSplitsEscrowZap
/// @notice Interface for creating and managing safe split escrow contracts with customizable settings.
interface ISafeSplitsEscrowZap {
    /// @dev Struct for storing zap data.
    struct ZapData {
        address providerSafe;
        address providerSplit;
        address escrow;
    }

    /// @dev Struct for storing escrow data.
    struct EscrowData {
        address client;
        address clientReceiver;
        bool requireVerification;
        uint8 resolverType;
        address resolver;
        address token;
        uint256 terminationTime;
        bytes32 saltNonce;
        uint256 feeBPS;
        address treasury;
        string details;
    }

    /**
     * @notice Creates a new safe split escrow contract.
     * @param _owners The array of addresses that will be the owners of the safe.
     * @param _allocations The array of allocations for each owner.
     * @param _milestoneAmounts The array of milestone amounts associated with the escrow.
     * @param _safeData The data for setting up the safe contract.
     * @param _safeAddress The address of the safe contract.
     * @param _splitData The data for setting up the split contract.
     * @param _escrowData The data for setting up the escrow contract.
     */
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint256[] memory _allocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        address _safeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) external;

    /**
     * @notice Updates the addresses used by the contract.
     * @param _data The data containing the new addresses to be updated.
     */
    function updateAddresses(bytes memory _data) external;

    /**
     * @notice Updates the distributor fee for the contract.
     * @param _distributionIncentive The new distributor fee as a percentage (scaled by 1e6).
     */
    function updateDistributionIncentive(
        uint16 _distributionIncentive
    ) external;

    /// @dev Custom errors for more efficient gas usage.
    error InvalidAllocationsOwnersData();
    error SafeNotCreated();
    error ProjectTeamSplitNotCreated();
    error EscrowNotCreated();
    error NotAuthorized();
    error ZeroAddress();
    error NotAContract(address);
    error InvalidSafeThreshold(uint256 threshold, uint256 owners);
    error EmptyOwners();
    error InvalidOwner();

    /// @notice Emitted when a new Safe splits escrow is created.
    /// @param providerSafe The address of the created Safe.
    /// @param providerSplit The address of the created project team split.
    /// @param escrow The address of the created escrow.
    event SafeSplitsEscrowCreated(
        address providerSafe,
        address providerSplit,
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

    /// @notice Emitted when the distribution incentive is updated.
    /// @param distributionIncentive The updated distribution incentive.
    event UpdatedDistributionIncentive(uint16 distributionIncentive);
}
