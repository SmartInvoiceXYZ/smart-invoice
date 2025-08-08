// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {SafeSplitsEscrowZap} from "./SafeSplitsEscrowZap.sol";
import {ISafeProxyFactory} from "./interfaces/ISafeProxyFactory.sol";
import {ISplitMain} from "./interfaces/ISplitMain.sol";
import {ISpoilsManager} from "./interfaces/ISpoilsManager.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SafeSplitsDaoEscrowZap
/// @notice Contract for creating and managing Safe splits with DAO escrow using customizable settings.
contract SafeSplitsDaoEscrowZap is SafeSplitsEscrowZap {
    /// @notice The DAO controller address
    address public dao;

    /// @notice The DAO's SpoilsManager address
    ISpoilsManager public spoilsManager;

    /// @dev Custom error for DAO split creation failure
    error DaoSplitCreationFailed();

    /// @notice Emitted when a new Safe splits DAO escrow is created.
    /// @param safe The address of the created Safe.
    /// @param providerSplit The address of the created project team split.
    /// @param daoSplit The address of the created DAO split.
    /// @param escrow The address of the created escrow.
    event SafeSplitsDaoEscrowCreated(
        address safe,
        address providerSplit,
        address daoSplit,
        address escrow
    );

    struct DaoZapData {
        ZapData zapData;
        address daoSplit;
    }

    /**
     * @dev Internal function to create a new Split with the provided owners and percent allocations, optionally creates a DAO split for spoils.
     * @param _owners The address list of owners for the raid party split.
     * @param _percentAllocations The percent allocations for the raid party split.
     * @param _splitsData Bundled data for splits.
     * @param _daoZapData The data struct for storing deployment results.
     * @return The updated `DaoZapData` with the deployed split addresses.
     */
    function _deploySplit(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        bytes calldata _splitsData,
        DaoZapData memory _daoZapData
    ) internal returns (DaoZapData memory) {
        (bool createProjectSplit, bool createDaoSplit) = abi.decode(
            _splitsData,
            (bool, bool)
        );

        // Create project team split if required
        if (createProjectSplit) {
            _daoZapData.zapData.providerSplit = splitMain.createSplit(
                _owners,
                _percentAllocations,
                distributorFee,
                _daoZapData.zapData.providerSafe
            );
        }

        // Handle the case when project team split is not created
        if (_daoZapData.zapData.providerSplit == address(0)) {
            if (_daoZapData.zapData.providerSafe != address(0)) {
                _daoZapData.zapData.providerSplit = _daoZapData
                    .zapData
                    .providerSafe;
            } else {
                revert ProjectTeamSplitNotCreated();
            }
        }

        // Create DAO split if required
        if (!createDaoSplit) return _daoZapData;

        // Prepare arrays for DAO split
        address[] memory daoSplitRecipients = new address[](2);
        uint32[] memory daoSplitPercentAllocations = new uint32[](2);

        // Get DAO split recipients and amounts
        address daoReceiver = spoilsManager.receiver();
        uint32 daoSplitAmount = spoilsManager.getSpoils();
        uint32 projectSplitAmount = (100 *
            spoilsManager.SPLIT_PERCENTAGE_SCALE()) - daoSplitAmount;

        // Sort the addresses and amounts in the correct order
        if (uint160(daoReceiver) < uint160(_daoZapData.zapData.providerSplit)) {
            daoSplitRecipients[0] = daoReceiver;
            daoSplitRecipients[1] = _daoZapData.zapData.providerSplit;
            daoSplitPercentAllocations[0] = daoSplitAmount;
            daoSplitPercentAllocations[1] = projectSplitAmount;
        } else {
            daoSplitRecipients[0] = _daoZapData.zapData.providerSplit;
            daoSplitRecipients[1] = daoReceiver;
            daoSplitPercentAllocations[0] = projectSplitAmount;
            daoSplitPercentAllocations[1] = daoSplitAmount;
        }

        // Create DAO split
        _daoZapData.daoSplit = splitMain.createSplit(
            daoSplitRecipients,
            daoSplitPercentAllocations,
            distributorFee,
            dao
        );

        if (_daoZapData.daoSplit == address(0)) {
            revert DaoSplitCreationFailed();
        }

        return _daoZapData;
    }

    /**
     * @dev Internal function to handle escrow parameters.
     * @param _daoZapData The data struct for storing deployment results.
     * @return The escrow parameters for the deployment.
     */
    function _handleEscrowParams(
        DaoZapData memory _daoZapData
    ) internal view returns (address[] memory) {
        address[] memory escrowParams = new address[](2);
        escrowParams[0] = _daoZapData.zapData.providerSafe;
        escrowParams[1] = _daoZapData.zapData.providerSplit;

        if (_daoZapData.daoSplit != address(0)) {
            escrowParams[0] = dao;
            escrowParams[1] = _daoZapData.daoSplit;
        }

        return escrowParams;
    }

    /**
     * @dev Internal function to create a new Safe, Split, and Escrow with DAO support.
     * @param _owners The list of owners for the Safe and Split.
     * @param _percentAllocations The percent allocations for the Split.
     * @param _milestoneAmounts The milestone amounts for the Escrow.
     * @param _safeData The encoded data for Safe setup.
     * @param _safeAddress The address of an existing Safe.
     * @param _splitsData The encoded data for Split setup.
     * @param _escrowData The encoded data for Escrow setup.
     */
    function _createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        address _safeAddress,
        bytes calldata _splitsData,
        bytes calldata _escrowData
    ) internal override {
        // Initialize DaoZapData
        DaoZapData memory daoZapData = DaoZapData({
            zapData: ZapData({
                providerSafe: _safeAddress,
                providerSplit: address(0),
                escrow: address(0)
            }),
            daoSplit: address(0)
        });

        // Deploy Safe if not already provided
        if (daoZapData.zapData.providerSafe == address(0)) {
            daoZapData.zapData.providerSafe = _deploySafe(_owners, _safeData);
        }

        // Create Split(s)
        daoZapData = _deploySplit(
            _owners,
            _percentAllocations,
            _splitsData,
            daoZapData
        );

        // Handle escrow parameters and deploy escrow
        address[] memory escrowParams = _handleEscrowParams(daoZapData);

        daoZapData.zapData.escrow = _deployEscrow(
            _milestoneAmounts,
            _escrowData,
            escrowParams
        );

        // Emit event for the created Safe splits DAO escrow
        emit SafeSplitsDaoEscrowCreated(
            daoZapData.zapData.providerSafe,
            daoZapData.zapData.providerSplit,
            daoZapData.daoSplit,
            daoZapData.zapData.escrow
        );
    }

    /**
     * @dev Internal function to handle initialization data.
     * @param _data The initialization data.
     */
    function _handleData(bytes calldata _data) internal override {
        (
            address _safeSingleton,
            address _fallbackHandler,
            address _safeFactory,
            address _splitMain,
            address _spoilsManager,
            address _escrowFactory,
            address _wrappedNativeToken,
            address _dao
        ) = abi.decode(
                _data,
                (
                    address,
                    address,
                    address,
                    address,
                    address,
                    address,
                    address,
                    address
                )
            );

        safeSingleton = _safeSingleton;
        fallbackHandler = _fallbackHandler;
        safeFactory = ISafeProxyFactory(_safeFactory);
        splitMain = ISplitMain(_splitMain);
        spoilsManager = ISpoilsManager(_spoilsManager);
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        wrappedNativeToken = IWRAPPED(_wrappedNativeToken);
        dao = _dao;
    }
}
