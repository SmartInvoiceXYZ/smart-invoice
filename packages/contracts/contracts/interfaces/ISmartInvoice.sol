// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/// @title ISmartInvoice
/// @notice Interface for the Smart Invoice contract, allowing initialization with recipient details, amounts, and data.
interface ISmartInvoice {
    /**
     * @notice Initializes the Smart Invoice with the provided recipient, amounts, and data.
     * @param _recipient The address of the recipient to receive payments.
     * @param _amounts An array of amounts representing payments or milestones.
     * @param _data Additional data needed for initialization, encoded as bytes.
     */
    function init(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external;
}
