// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

abstract contract IArbitrable {
  bytes4 internal constant ARBITRABLE_INTERFACE_ID = bytes4(0x88f3ee69);

  /**
   * @dev Give a ruling for a certain dispute, the account calling it must have rights to rule on the contract
   * @param _disputeId Identification number of the dispute to be ruled
   * @param _ruling Ruling given by the arbitrator, where 0 is reserved for "refused to make a decision"
   */
  function rule(uint256 _disputeId, uint256 _ruling) external virtual;

  /**
   * @dev ERC165 - Query if a contract implements a certain interface
   * @param _interfaceId The interface identifier being queried, as specified in ERC-165
   * @return True if this contract supports the given interface, false otherwise
   */
  function supportsInterface(bytes4 _interfaceId) external pure returns (bool) {
    return _interfaceId == ARBITRABLE_INTERFACE_ID;
  }
}
