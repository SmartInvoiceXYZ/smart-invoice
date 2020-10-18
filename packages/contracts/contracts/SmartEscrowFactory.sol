// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SmartEscrow.sol";

contract SmartEscrowFactory {
  using SafeMath for uint256;

  uint256 public id = 0;
  mapping(uint256 => address) internal _escrows;

  event LogNewEscrow(uint256 indexed id, address escrow);

  function create(
    address _client,
    address _provider,
    uint8 _resolverType,
    address _resolver,
    address _token,
    uint256[] memory _amounts,
    uint256 _total,
    uint256 _terminationTime,
    bytes32 _details
  ) public returns (address) {
    address escrowAddress;
    SmartEscrow escrow = new SmartEscrow(
      _client,
      _provider,
      _resolverType,
      _resolver,
      _token,
      _amounts,
      _total,
      _terminationTime,
      _details
    );
    escrowAddress = address(escrow);

    uint256 escrowId = id;
    _escrows[escrowId] = escrowAddress;
    id = id.add(1);

    emit LogNewEscrow(escrowId, escrowAddress);
    return escrowAddress;
  }

  function getEscrowAddress(uint256 _id) public view returns (address) {
    return _escrows[_id];
  }
}
