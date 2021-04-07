// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../IArbitrable.sol";

contract MockArbitrator {
  mapping(address => uint256) public disputes;
  mapping(uint256 => uint256) public choices;
  uint256 public currentDisputeId;
  uint256 private immutable cost;

  event DisputeCreation(
    uint256 indexed _disputeID,
    address indexed _arbitrable
  );

  constructor(uint256 _cost) {
    cost = _cost;
  }

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

  function createDispute(uint256 _choices, bytes calldata)
    external
    payable
    returns (uint256 disputeID)
  {
    require(msg.value == 10, "!cost");
    currentDisputeId = currentDisputeId + 1;
    disputes[msg.sender] = currentDisputeId;
    choices[currentDisputeId] = _choices;
    emit DisputeCreation(currentDisputeId, msg.sender);
    return currentDisputeId;
  }

  function arbitrationCost(bytes calldata) external view returns (uint256) {
    return cost;
  }
}
