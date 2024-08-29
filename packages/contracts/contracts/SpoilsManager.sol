// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract SpoilsManager is Ownable, Initializable {
    /// @dev The scale used to calculate the spoils percentage
    uint32 public SPLIT_PERCENTAGE_SCALE; // 100 * SPLIT_PERCENTAGE_SCALE = 100%

    /// @notice The percentage of spoils to be sent to the owner's receiver
    uint32 public spoils;

    /// @notice The address of the owner's receiver
    address public receiver;

    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the SpoilsManager contract
     * @param _spoils The percentage of spoils to be sent to the owner's receiver
     * @param _percentageScale The scale used to calculate the spoils percentage
     * @param _receiver The address of the owner's receiver
     * @param _newOwner Address of the initial owner of the SpoilsManager contract
     */
    function init(
        uint32 _spoils,
        uint32 _percentageScale,
        address _receiver,
        address _newOwner
    ) external virtual initializer {
        spoils = _spoils;
        receiver = _receiver;
        _transferOwnership(_newOwner);
        SPLIT_PERCENTAGE_SCALE = _percentageScale;
    }

    /**
     * @dev Set the spoils amount to be sent to the owner's receiver
     * @param _spoils The percentage of spoils to be sent to the owner's receiver
     */
    function setSpoils(uint32 _spoils) external onlyOwner {
        spoils = _spoils;
    }

    /**
     * @dev Set the owner's receiver address
     * @param _receiver The address of the owner's receiver
     */
    function setReceiver(address _receiver) external onlyOwner {
        receiver = _receiver;
    }

    /**
     * @dev Get the spoils amount to be sent to the owner's receiver
     * @return The percentage of spoils to be sent to the owner's receiver
     */
    function getSpoils() external view returns (uint32) {
        return spoils * SPLIT_PERCENTAGE_SCALE;
    }
}
