// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ISafeSplitsEscrowZap} from "./ISafeSplitsEscrowZap.sol";

/// @title ISafeSplitsDaoEscrowZap
/// @notice Interface for SafeSplitsDaoEscrowZap that extends SafeSplitsEscrowZap with DAO functionality
interface ISafeSplitsDaoEscrowZap is ISafeSplitsEscrowZap {
    /// @notice Emitted when the DAO controller is updated
    /// @param dao The new DAO controller address
    event DaoUpdated(address indexed dao);

    /// @notice Emitted when the DAO receiver is updated
    /// @param daoReceiver The new DAO receiver address
    event DaoReceiverUpdated(address indexed daoReceiver);

    /// @notice Emitted when the spoils BPS is updated
    /// @param spoilsBPS The new spoils percentage in basis points
    event SpoilsBPSUpdated(uint16 spoilsBPS);

    /// @notice Emitted when a Safe+Split(+DAO split)+Escrow is created.
    /// @param providerSafe The Safe address
    /// @param providerSplit The Split address
    /// @param daoSplit The DAO Split address
    /// @param escrow The Escrow address
    event SafeSplitsDaoEscrowCreated(
        address providerSafe,
        address providerSplit,
        address daoSplit,
        address escrow
    );

    /// @notice Thrown when an invalid DAO address is provided
    error InvalidDao();

    /// @notice Thrown when an invalid receiver address is provided
    error InvalidReceiver();

    /// @notice Thrown when an invalid spoils BPS is provided
    error InvalidSpoilsBPS();

    /// @notice Thrown when the project team split is not created
    error DaoSplitCreationFailed();

    /// @notice Update the DAO controller address
    /// @param _dao The new DAO controller address
    function setDao(address _dao) external;

    /// @notice Update the DAO receiver (treasury) address
    /// @param _daoReceiver The new DAO receiver address
    function setReceiver(address _daoReceiver) external;

    /// @notice Update the DAO spoils in basis points
    /// @param _spoilsBPS The new spoils percentage in basis points (0-10000)
    function setSpoilsBPS(uint16 _spoilsBPS) external;
}
