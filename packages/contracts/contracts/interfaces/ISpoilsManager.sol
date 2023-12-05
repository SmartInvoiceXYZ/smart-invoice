// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISpoilsManager {
    function SPLIT_PERCENTAGE_SCALE() external view returns (uint32);

    function getSpoils() external view returns (uint32);

    function init(
        uint32 _spoils,
        address _receiver,
        address _newOwner
    ) external;

    function initLock() external;

    function owner() external view returns (address);

    function receiver() external view returns (address);

    function renounceOwnership() external;

    function setReceiver(address _receiver) external;

    function setSpoils(uint32 _spoils) external;

    function spoils() external view returns (uint32);

    function transferOwnership(address newOwner) external;
}
