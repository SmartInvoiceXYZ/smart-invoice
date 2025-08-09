// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IArbitrable} from "@kleros/erc-792/contracts/IArbitrable.sol";

/// @title Mock Arbitrator Contract
/// @notice This contract simulates the behavior of an arbitrator for testing purposes. It allows the creation and resolution of disputes.
contract MockArbitrator {
    // solhint-disable-next-line immutable-vars-naming, style-guide-casing
    uint256 private immutable cost; // The fixed arbitration cost

    /// @notice Mapping of arbitrable addresses to their dispute IDs
    mapping(address => uint256) public disputes;

    /// @notice Mapping of dispute IDs to the number of choices available in each dispute
    mapping(uint256 => uint256) public choices;

    /// @notice The ID of the most recently created dispute
    uint256 public currentDisputeId;

    /// @dev Error thrown when the provided payment is insufficient
    error InsufficientPayment();

    /// @notice Emitted when a dispute is created
    /// @param disputeID The ID of the created dispute
    /// @param arbitrable The address of the arbitrable contract
    event DisputeCreation(
        uint256 indexed disputeID,
        address indexed arbitrable
    );

    /**
     * @dev Constructor that sets the fixed arbitration cost.
     * @param _cost The cost required to create a dispute
     */
    constructor(uint256 _cost) {
        cost = _cost;
    }

    /**
     * @notice Executes a ruling on a given arbitrable contract.
     * @param _arbitrable The address of the arbitrable contract
     * @param _ruling The ruling to be executed
     */
    function executeRuling(address _arbitrable, uint256 _ruling) external {
        uint256 disputeId = disputes[_arbitrable];
        IArbitrable(_arbitrable).rule(disputeId, _ruling);
    }

    /**
     * @notice Executes a ruling on a given arbitrable contract with a specified dispute ID.
     * @param _arbitrable The address of the arbitrable contract
     * @param _ruling The ruling to be executed
     * @param _disputeId The ID of the dispute
     */
    function executeRulingWithDisputeId(
        address _arbitrable,
        uint256 _ruling,
        uint256 _disputeId
    ) external {
        IArbitrable(_arbitrable).rule(_disputeId, _ruling);
    }

    /**
     * @notice Creates a new dispute with a specified number of choices.
     * @param _choices The number of choices for the dispute
     * @return disputeID The ID of the newly created dispute
     */
    function createDispute(
        uint256 _choices,
        bytes calldata
    ) external payable returns (uint256 disputeID) {
        if (msg.value != cost) {
            revert InsufficientPayment();
        }
        currentDisputeId++;
        disputes[msg.sender] = currentDisputeId;
        choices[currentDisputeId] = _choices;
        emit DisputeCreation(currentDisputeId, msg.sender);
        return currentDisputeId;
    }

    /**
     * @notice Returns the cost required to create a dispute.
     * @return The cost required to create a dispute
     */
    function arbitrationCost(bytes calldata) external view returns (uint256) {
        return cost;
    }
}
