// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {IArbitrator} from "@kleros/erc-792/contracts/IArbitrator.sol";
import {IArbitrable} from "@kleros/erc-792/contracts/IArbitrable.sol";

/// @title Mock Arbitrator Contract
/// @notice This contract simulates the behavior of an arbitrator for testing purposes. It allows the creation and resolution of disputes.
contract MockArbitrator is IArbitrator {
    // solhint-disable-next-line immutable-vars-naming, style-guide-casing
    uint256 private immutable cost; // The fixed arbitration cost
    uint256 private immutable appealCostMultiplier; // Multiplier for appeal cost

    /// @notice Mapping of arbitrable addresses to their dispute IDs
    mapping(address => uint256) public disputes;

    /// @notice Mapping of dispute IDs to the number of choices available in each dispute
    mapping(uint256 => uint256) public choices;

    /// @notice Mapping of dispute IDs to their current ruling
    mapping(uint256 => uint256) public disputeRulings;

    /// @notice Mapping of dispute IDs to their status
    mapping(uint256 => DisputeStatus) public disputeStatuses;

    /// @notice Mapping of dispute IDs to the arbitrable contract that created them
    mapping(uint256 => IArbitrable) public disputeArbitrables;

    /// @notice The ID of the most recently created dispute
    uint256 public currentDisputeId;

    /// @dev Error thrown when the provided payment is insufficient
    error InsufficientPayment();

    /// @dev Error thrown when trying to access a non-existent dispute
    error DisputeNotFound();

    /// @dev Error thrown when trying to appeal a non-appealable dispute
    error NotAppealable();

    /**
     * @dev Constructor that sets the fixed arbitration cost.
     * @param _cost The cost required to create a dispute
     */
    constructor(uint256 _cost) {
        cost = _cost;
        appealCostMultiplier = 2; // Appeal costs 2x the arbitration cost
    }

    /**
     * @notice Executes a ruling on a given arbitrable contract.
     * @param _arbitrable The address of the arbitrable contract
     * @param _ruling The ruling to be executed
     */
    function executeRuling(address _arbitrable, uint256 _ruling) external {
        uint256 disputeId = disputes[_arbitrable];
        if (disputeId == 0) {
            revert DisputeNotFound();
        }

        // Update dispute state
        disputeRulings[disputeId] = _ruling;
        disputeStatuses[disputeId] = DisputeStatus.Solved;

        // Execute the ruling
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
        if (_disputeId == 0 || _disputeId > currentDisputeId) {
            revert DisputeNotFound();
        }

        // Update dispute state
        disputeRulings[_disputeId] = _ruling;
        disputeStatuses[_disputeId] = DisputeStatus.Solved;

        // Execute the ruling
        IArbitrable(_arbitrable).rule(_disputeId, _ruling);
    }

    /**
     * @notice Executes a ruling with the wrong dispute ID for testing purposes.
     * @param _arbitrable The address of the arbitrable contract
     * @param _wrongDisputeId Wrong dispute ID to test error handling
     * @param _ruling The ruling to be executed
     */
    function executeWrongRuling(
        address _arbitrable,
        uint256 _wrongDisputeId,
        uint256 _ruling
    ) external {
        // This will cause the arbitrable contract to revert with IncorrectDisputeId
        IArbitrable(_arbitrable).rule(_wrongDisputeId, _ruling);
    }

    /**
     * @notice Sets a dispute as appealable for testing purposes.
     * @param _disputeID The dispute ID to make appealable
     * @param _ruling The ruling that can be appealed
     */
    function setAppealable(uint256 _disputeID, uint256 _ruling) external {
        if (_disputeID == 0 || _disputeID > currentDisputeId) {
            revert DisputeNotFound();
        }

        disputeStatuses[_disputeID] = DisputeStatus.Appealable;
        disputeRulings[_disputeID] = _ruling;

        emit AppealPossible(_disputeID, disputeArbitrables[_disputeID]);
    }

    /**
     * @notice Creates a mock dispute for testing purposes without requiring payment.
     * @param _arbitrable The arbitrable contract address
     * @param _choices The number of choices for the dispute
     * @return disputeID The ID of the newly created dispute
     */
    function createMockDispute(
        address _arbitrable,
        uint256 _choices
    ) external returns (uint256 disputeID) {
        currentDisputeId++;
        disputes[_arbitrable] = currentDisputeId;
        choices[currentDisputeId] = _choices;
        disputeStatuses[currentDisputeId] = DisputeStatus.Waiting;
        disputeArbitrables[currentDisputeId] = IArbitrable(_arbitrable);
        disputeRulings[currentDisputeId] = 0;

        emit DisputeCreation(currentDisputeId, IArbitrable(_arbitrable));
        return currentDisputeId;
    }

    /**
     * @notice Creates a new dispute with a specified number of choices.
     * @param _choices The number of choices for the dispute
     * @param _extraData Additional data for the dispute
     * @return disputeID The ID of the newly created dispute
     */
    function createDispute(
        uint256 _choices,
        bytes calldata _extraData
    ) external payable override returns (uint256 disputeID) {
        if (msg.value < this.arbitrationCost(_extraData)) {
            revert InsufficientPayment();
        }
        currentDisputeId++;
        disputes[msg.sender] = currentDisputeId;
        choices[currentDisputeId] = _choices;
        disputeStatuses[currentDisputeId] = DisputeStatus.Waiting;
        disputeArbitrables[currentDisputeId] = IArbitrable(msg.sender);
        disputeRulings[currentDisputeId] = 0;

        emit DisputeCreation(currentDisputeId, IArbitrable(msg.sender));
        return currentDisputeId;
    }

    /**
     * @notice Returns the cost required to create a dispute.
     * @return cost The cost required to create a dispute
     */
    function arbitrationCost(
        bytes calldata /* _extraData */
    ) external view override returns (uint256) {
        // For simplicity, ignore _extraData in mock
        return cost;
    }

    /**
     * @notice Appeal a ruling.
     * @param _disputeID ID of the dispute to be appealed
     * @param _extraData Additional data for the appeal
     */
    function appeal(
        uint256 _disputeID,
        bytes calldata _extraData
    ) external payable override {
        if (_disputeID == 0 || _disputeID > currentDisputeId) {
            revert DisputeNotFound();
        }
        if (disputeStatuses[_disputeID] != DisputeStatus.Appealable) {
            revert NotAppealable();
        }
        if (msg.value < this.appealCost(_disputeID, _extraData)) {
            revert InsufficientPayment();
        }

        // Reset status back to waiting after appeal
        disputeStatuses[_disputeID] = DisputeStatus.Waiting;

        emit AppealDecision(_disputeID, disputeArbitrables[_disputeID]);
    }

    /**
     * @notice Compute the cost of appeal.
     * @return cost The cost of appeal
     */
    function appealCost(
        uint256 /* _disputeID */,
        bytes calldata /* _extraData */
    ) external view override returns (uint256) {
        // For simplicity, ignore parameters in mock
        return cost * appealCostMultiplier;
    }

    /**
     * @notice Compute the appeal period.
     * @param _disputeID ID of the dispute
     * @return start The start of the appeal period
     * @return end The end of the appeal period
     */
    function appealPeriod(
        uint256 _disputeID
    ) external view override returns (uint256 start, uint256 end) {
        if (_disputeID == 0 || _disputeID > currentDisputeId) {
            return (0, 0);
        }
        if (disputeStatuses[_disputeID] == DisputeStatus.Appealable) {
            // In mock, appeal period is 1 hour from now
            return (block.timestamp, block.timestamp + 3600);
        }
        return (0, 0);
    }

    /**
     * @notice Return the status of a dispute.
     * @param _disputeID ID of the dispute
     * @return status The status of the dispute
     */
    function disputeStatus(
        uint256 _disputeID
    ) external view override returns (DisputeStatus status) {
        if (_disputeID == 0 || _disputeID > currentDisputeId) {
            revert DisputeNotFound();
        }
        return disputeStatuses[_disputeID];
    }

    /**
     * @notice Return the current ruling of a dispute.
     * @param _disputeID ID of the dispute
     * @return ruling The current ruling
     */
    function currentRuling(
        uint256 _disputeID
    ) external view override returns (uint256 ruling) {
        if (_disputeID == 0 || _disputeID > currentDisputeId) {
            revert DisputeNotFound();
        }
        return disputeRulings[_disputeID];
    }
}
