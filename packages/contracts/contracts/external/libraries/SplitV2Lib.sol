// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.30;

/// @title SplitV2Lib
/// @notice Library for Split V2 functionality, providing data structures and utilities for split operations
/// @dev Used by SplitFactoryV2 for creating and managing splits
library SplitV2Lib {
    /* -------------------------------------------------------------------------- */
    /*                                   STRUCTS                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Split struct
     * @dev This struct is used to store the split information.
     * @dev There are no hard caps on the number of recipients/totalAllocation/allocation unit. Thus the chain and its
     * gas limits will dictate these hard caps. Please double check if the split you are creating can be distributed on
     * the chain.
     * @param recipients The recipients of the split.
     * @param allocations The allocations of the split.
     * @param totalAllocation The total allocation of the split.
     * @param distributionIncentive The incentive for distribution. Limits max incentive to 6.5%.
     */
    struct Split {
        address[] recipients;
        uint256[] allocations;
        uint256 totalAllocation;
        uint16 distributionIncentive;
    }

    /* -------------------------------------------------------------------------- */
    /*                                  CONSTANTS                                 */
    /* -------------------------------------------------------------------------- */

    uint256 internal constant _PERCENTAGE_SCALE = 1e6;

    /* -------------------------------------------------------------------------- */
    /*                                   ERRORS                                   */
    /* -------------------------------------------------------------------------- */

    error InvalidSplit_TotalAllocationMismatch();
    error InvalidSplit_LengthMismatch();

    /* -------------------------------------------------------------------------- */
    /*                                  FUNCTIONS                                 */
    /* -------------------------------------------------------------------------- */

    /// @notice Generates a hash for a calldata Split struct
    /// @param _split The split data to hash
    /// @return The keccak256 hash of the split data
    function getHash(Split calldata _split) internal pure returns (bytes32) {
        return keccak256(abi.encode(_split));
    }

    /// @notice Generates a hash for a memory Split struct
    /// @param _split The split data to hash
    /// @return The keccak256 hash of the split data
    function getHashMem(Split memory _split) internal pure returns (bytes32) {
        return keccak256(abi.encode(_split));
    }

    /// @notice Validates a Split struct for correctness
    /// @param _split The split data to validate
    /// @dev Checks that allocations array length matches recipients length and total allocation is correct
    function validate(Split calldata _split) internal pure {
        uint256 numOfRecipients = _split.recipients.length;
        if (_split.allocations.length != numOfRecipients) {
            revert InvalidSplit_LengthMismatch();
        }

        uint256 totalAllocation;
        for (uint256 i; i < numOfRecipients; ++i) {
            totalAllocation += _split.allocations[i];
        }

        if (totalAllocation != _split.totalAllocation)
            revert InvalidSplit_TotalAllocationMismatch();
    }

    /// @notice Calculates distribution amounts for recipients and distributor reward
    /// @param _split The split configuration
    /// @param _amount The total amount to distribute
    /// @return amounts Array of amounts for each recipient
    /// @return distributorReward Amount reserved for the distributor as incentive
    function getDistributions(
        Split calldata _split,
        uint256 _amount
    )
        internal
        pure
        returns (uint256[] memory amounts, uint256 distributorReward)
    {
        uint256 numOfRecipients = _split.recipients.length;
        amounts = new uint256[](numOfRecipients);

        distributorReward = calculateDistributorReward(_split, _amount);
        _amount -= distributorReward;

        for (uint256 i; i < numOfRecipients; ++i) {
            amounts[i] = calculateAllocatedAmount(_split, _amount, i);
        }
    }

    /// @notice Calculates the allocated amount for a specific recipient
    /// @param _split The split configuration
    /// @param _amount The total amount to distribute (after distributor reward)
    /// @param _index The index of the recipient in the recipients array
    /// @return allocatedAmount The amount allocated to the specified recipient
    function calculateAllocatedAmount(
        Split calldata _split,
        uint256 _amount,
        uint256 _index
    ) internal pure returns (uint256 allocatedAmount) {
        allocatedAmount =
            (_amount * _split.allocations[_index]) /
            _split.totalAllocation;
    }

    /// @notice Calculates the distributor reward based on distribution incentive
    /// @param _split The split configuration containing distribution incentive
    /// @param _amount The total amount before distributor reward is deducted
    /// @return distributorReward The amount reserved as distributor incentive
    function calculateDistributorReward(
        Split calldata _split,
        uint256 _amount
    ) internal pure returns (uint256 distributorReward) {
        distributorReward =
            (_amount * _split.distributionIncentive) /
            _PERCENTAGE_SCALE;
    }

    /// @notice Calculates distribution amounts using memory Split struct (used in tests)
    /// @param _split The split configuration in memory
    /// @param _amount The total amount to distribute
    /// @return amounts Array of amounts for each recipient
    /// @return distributorReward Amount reserved for the distributor as incentive
    /// @dev This function is optimized for testing and uses memory instead of calldata
    function getDistributionsMem(
        Split memory _split,
        uint256 _amount
    )
        internal
        pure
        returns (uint256[] memory amounts, uint256 distributorReward)
    {
        uint256 numOfRecipients = _split.recipients.length;
        amounts = new uint256[](numOfRecipients);

        distributorReward =
            (_amount * _split.distributionIncentive) /
            _PERCENTAGE_SCALE;
        _amount -= distributorReward;

        for (uint256 i; i < numOfRecipients; ++i) {
            amounts[i] =
                (_amount * _split.allocations[i]) /
                _split.totalAllocation;
        }
    }
}
