// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./SafeSplitsEscrowZap.sol";
import "./interfaces/ISpoilsManager.sol";

contract SafeSplitsDaoEscrowZap is SafeSplitsEscrowZap {
    /// @notice The DAO controller address
    address dao;

    error DaoSplitCreationFailed();

    /// @notice The DAO's SpoilsManager address
    ISpoilsManager spoilsManager;

    event SafeSplitsDaoEscrowCreated(
        address safe,
        address projectTeamSplit,
        address daoSplit,
        address escrow
    );

    struct DaoZapData {
        ZapData zapData;
        address daoSplit;
    }

    /**
     * @dev Deploys a new Split with the provided owners and percent allocations, optionally creates a DAO split for spoils
     * @param _owners The address list of owners for the raid party split
     * @param _percentAllocations The percent allocations for the raid party split
     * @param _splitsData Bundled data for splits
     * @param _daoZapData Resulting data struct
     */
    function _createSplit(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        bytes calldata _splitsData,
        DaoZapData memory _daoZapData
    ) internal returns (DaoZapData memory) {
        _daoZapData.zapData.projectTeamSplit = splitMain.createSplit(
            _owners,
            _percentAllocations,
            distributorFee,
            _daoZapData.zapData.safe
        );
        if (_daoZapData.zapData.projectTeamSplit == address(0)) {
            revert ProjectTeamSplitNotCreated();
        }

        bool _isDaoSplit = abi.decode(_splitsData, (bool));

        if (_isDaoSplit) {
            // prepare arrays
            address[] memory daoSplitRecipients = new address[](2);
            uint32[] memory daoSplitPercentAllocations = new uint32[](2);

            // dao split recipients
            address daoReceiver = spoilsManager.receiver();

            // dao split amounts
            uint32 daoSplitAmount = spoilsManager.getSpoils();
            uint32 projectSplitAmount = (100 *
                spoilsManager.SPLIT_PERCENTAGE_SCALE()) - (daoSplitAmount);

            // sort the addresses into the correct order
            if (
                uint160(daoReceiver) <
                uint160(_daoZapData.zapData.projectTeamSplit)
            ) {
                daoSplitRecipients[0] = daoReceiver;
                daoSplitRecipients[1] = _daoZapData.zapData.projectTeamSplit;
                daoSplitPercentAllocations[0] = daoSplitAmount;
                daoSplitPercentAllocations[1] = projectSplitAmount;
            } else {
                daoSplitRecipients[0] = _daoZapData.zapData.projectTeamSplit;
                daoSplitRecipients[1] = daoReceiver;
                daoSplitPercentAllocations[0] = projectSplitAmount;
                daoSplitPercentAllocations[1] = daoSplitAmount;
            }

            // (recipients array, percent allocations array, no distributor fee, safe address)
            _daoZapData.daoSplit = splitMain.createSplit(
                daoSplitRecipients,
                daoSplitPercentAllocations,
                distributorFee,
                dao
            );
            if (_daoZapData.daoSplit == address(0)) {
                revert DaoSplitCreationFailed();
            }
        }

        return _daoZapData;
    }

    function _handleEscrowParams(
        DaoZapData memory _daoZapData
    ) internal view returns (address[] memory) {
        address[] memory escrowParams = new address[](2);
        escrowParams[0] = _daoZapData.zapData.safe;
        escrowParams[1] = _daoZapData.zapData.projectTeamSplit;

        if (_daoZapData.daoSplit != address(0)) {
            escrowParams[0] = dao;
            escrowParams[1] = _daoZapData.daoSplit;
        }

        return escrowParams;
    }

    function _createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        bytes calldata _splitsData,
        bytes calldata _escrowData
    ) internal {
        DaoZapData memory daoZapData = DaoZapData({
            zapData: ZapData({
                safe: address(0),
                projectTeamSplit: address(0),
                escrow: address(0)
            }),
            daoSplit: address(0)
        });

        daoZapData.zapData = _deploySafe(
            _owners,
            _safeData,
            daoZapData.zapData
        );

        daoZapData = _createSplit(
            _owners,
            _percentAllocations,
            _splitsData,
            daoZapData
        );

        address[] memory escrowParams = _handleEscrowParams(daoZapData);

        daoZapData.zapData = _deployEscrow(
            _milestoneAmounts,
            _escrowData,
            escrowParams,
            daoZapData.zapData
        );

        emit SafeSplitsDaoEscrowCreated(
            daoZapData.zapData.safe,
            daoZapData.zapData.projectTeamSplit,
            daoZapData.daoSplit,
            daoZapData.zapData.escrow
        );
    }

    /**
     * @dev Deploys a new Safe, Raid Party Split and Escrow with the provided details
     * @param _owners The safe owners and raid party split participants
     * @param _percentAllocations The percent allocations for the raid party split
     * @param _milestoneAmounts The initial milestone amounts for the escrow
     * @param _safeData The number of required confirmations for a Safe transaction
     * @param _escrowData The nonce for the salt used in the escrow deployment (recycled from safe deployment)
     */
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        bytes calldata _splitsData,
        bytes calldata _escrowData
    ) public {
        if (_percentAllocations.length != _owners.length) {
            revert InvalidAllocationsOwnersData();
        }
        _createSafeSplitEscrow(
            _owners,
            _percentAllocations,
            _milestoneAmounts,
            _safeData,
            _splitsData,
            _escrowData
        );
    }

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
