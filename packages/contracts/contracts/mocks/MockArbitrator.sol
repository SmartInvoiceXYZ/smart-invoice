// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../IArbitrator.sol";
import "../IArbitrable.sol";

// solhint-disable

contract MockArbitrator is IArbitrator {
  mapping(address => uint256) public disputes;
  uint256 currentDisputeId;

  function executeRuling(address _arbitrable, uint256 _ruling) external {
    uint256 disputeId = disputes[_arbitrable];
    IArbitrable(_arbitrable).rule(disputeId, _ruling);
  }

  function executeRulingWithDisputeId(
    address _arbitrable,
    uint256 _ruling,
    uint256 _disputeId
  ) external {
    IArbitrable(_arbitrable).rule(_disputeId, _ruling);
  }

  function createDispute(uint256 _choices, bytes calldata _extraData)
    external
    payable
    override
    returns (uint256 disputeID)
  {
    require(msg.value == 10, "!cost");
    currentDisputeId = currentDisputeId + 1;
    disputes[msg.sender] = currentDisputeId;
    emit DisputeCreation(currentDisputeId, msg.sender);
    return currentDisputeId;
  }

  function arbitrationCost(bytes calldata _extraData)
    external
    view
    override
    returns (uint256 cost)
  {
    return 10;
  }

  function appeal(uint256 _disputeID, bytes calldata _extraData)
    external
    payable
    override
  {}

  function appealCost(uint256 _disputeID, bytes calldata _extraData)
    external
    view
    override
    returns (uint256 cost)
  {}

  function appealPeriod(uint256 _disputeID)
    external
    view
    override
    returns (uint256 start, uint256 end)
  {}

  function disputeStatus(uint256 _disputeID)
    external
    view
    override
    returns (DisputeStatus status)
  {}

  function currentRuling(uint256 _disputeID)
    external
    view
    override
    returns (uint256 ruling)
  {}
}
