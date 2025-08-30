// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.30;

library SplitV2Lib {
    /* -------------------------------------------------------------------------- */
    /*                                   ERRORS                                   */
    /* -------------------------------------------------------------------------- */

    error InvalidSplit_TotalAllocationMismatch();
    error InvalidSplit_LengthMismatch();

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

    uint256 internal constant PERCENTAGE_SCALE = 1e6;

    /* -------------------------------------------------------------------------- */
    /*                                  FUNCTIONS                                 */
    /* -------------------------------------------------------------------------- */

    function getHash(Split calldata _split) internal pure returns (bytes32) {
        return keccak256(abi.encode(_split));
    }

    function getHashMem(Split memory _split) internal pure returns (bytes32) {
        return keccak256(abi.encode(_split));
    }

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

    function calculateAllocatedAmount(
        Split calldata _split,
        uint256 _amount,
        uint256 _index
    ) internal pure returns (uint256 allocatedAmount) {
        allocatedAmount =
            (_amount * _split.allocations[_index]) /
            _split.totalAllocation;
    }

    function calculateDistributorReward(
        Split calldata _split,
        uint256 _amount
    ) internal pure returns (uint256 distributorReward) {
        distributorReward =
            (_amount * _split.distributionIncentive) /
            PERCENTAGE_SCALE;
    }

    // only used in tests
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
            PERCENTAGE_SCALE;
        _amount -= distributorReward;

        for (uint256 i; i < numOfRecipients; ++i) {
            amounts[i] =
                (_amount * _split.allocations[i]) /
                _split.totalAllocation;
        }
    }
}
