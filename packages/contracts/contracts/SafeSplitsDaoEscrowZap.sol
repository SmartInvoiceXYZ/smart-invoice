// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SafeSplitsEscrowZap} from "./SafeSplitsEscrowZap.sol";
import {ISafeProxyFactory} from "./interfaces/ISafeProxyFactory.sol";
import {ISplitFactoryV2} from "./interfaces/ISplitFactoryV2.sol";
import {SplitV2Lib} from "./libraries/SplitV2Lib.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";

/// @title SafeSplitsDaoEscrowZap
/// @notice Extends SafeSplitsEscrowZap with built-in DAO fee splitting using BPS (basis points).
///         spoilsBPS is the DAO share in BPS (10_000 = 100%).
contract SafeSplitsDaoEscrowZap is SafeSplitsEscrowZap {
    /// @notice DAO controller address (controller for the DAO split).
    address public dao;

    /// @notice Address that receives the DAO spoils.
    address public daoReceiver;

    /// @notice DAO spoils in basis points (BPS). 10_000 = 100%.
    uint16 public spoilsBPS;

    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @dev Emitted when a Safe+Split(+DAO split)+Escrow is created.
    event SafeSplitsDaoEscrowCreated(
        address providerSafe,
        address providerSplit,
        address daoSplit,
        address escrow
    );

    /// @dev Configuration updates
    event DaoUpdated(address indexed dao);
    event DaoReceiverUpdated(address indexed daoReceiver);
    event SpoilsBPSUpdated(uint16 spoilsBPS);

    /// @dev Errors
    error DaoSplitCreationFailed();
    error InvalidReceiver();
    error InvalidDao();
    error InvalidSpoilsBPS();

    struct DaoZapData {
        ZapData zapData; // providerSafe, providerSplit, escrow
        address daoSplit; // optional DAO split (if created)
    }

    /// @notice Constructor. Pass the same-ordered bytes payload as the parent, plus DAO params:
    ///         abi.encode(
    ///           safeSingleton, fallbackHandler, safeFactory, splitFactoryV2, escrowFactory,
    ///           dao, daoReceiver, spoilsBPS
    ///         )
    constructor(bytes memory _data) SafeSplitsEscrowZap(_data) {}

    /*//////////////////////////////////////////////////////////////
                        INTERNAL VIRTUAL HOOKS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc SafeSplitsEscrowZap
    function _handleData(bytes memory _data) internal override {
        (
            address _safeSingleton,
            address _fallbackHandler,
            address _safeFactory,
            address _splitFactoryV2,
            address _escrowFactory,
            address _dao,
            address _daoReceiver,
            uint16 _spoilsBPS
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
                    uint16
                )
            );

        // sanity checks
        if (_safeSingleton == address(0))
            revert InvalidAddress("safeSingleton");
        if (_safeFactory == address(0)) revert InvalidAddress("safeFactory");
        if (_splitFactoryV2 == address(0))
            revert InvalidAddress("splitFactoryV2");
        if (_escrowFactory == address(0))
            revert InvalidAddress("escrowFactory");
        if (_fallbackHandler == address(0))
            revert InvalidAddress("fallbackHandler");

        // Set base zap dependencies
        safeSingleton = _safeSingleton;
        fallbackHandler = _fallbackHandler;
        safeFactory = ISafeProxyFactory(_safeFactory);
        splitFactory = ISplitFactoryV2(_splitFactoryV2);
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);

        // Validate & set DAO config
        if (_dao == address(0)) revert InvalidDao();
        if (_daoReceiver == address(0)) revert InvalidReceiver();
        if (_spoilsBPS > BPS_DENOMINATOR) revert InvalidSpoilsBPS();

        dao = _dao;
        daoReceiver = _daoReceiver;
        spoilsBPS = _spoilsBPS;
    }

    /// @notice Create project split (optional) and DAO split (optional).
    /// @dev `_splitsData` must be `abi.encode(bool createProjectSplit, bool createDaoSplit)`.
    function _deploySplit(
        address[] memory _owners,
        uint256[] memory _allocations,
        bytes calldata _splitsData,
        DaoZapData memory _daoZapData
    ) internal returns (DaoZapData memory) {
        (bool createProjectSplit, bool createDaoSplit) = abi.decode(
            _splitsData,
            (bool, bool)
        );

        // Project team split (controller = providerSafe)
        if (createProjectSplit) {
            if (_allocations.length != _owners.length) {
                revert InvalidAllocationsOwnersData();
            }

            // Build v2 Split params
            uint256 len = _owners.length;

            if (len == 0) revert EmptyOwners();

            uint256 total;
            for (uint256 i; i < len; ++i) {
                if (_owners[i] == address(0)) revert InvalidOwner();
                total += _allocations[i];
            }

            SplitV2Lib.Split memory projectSplitParams = SplitV2Lib.Split({
                recipients: _owners,
                allocations: _allocations,
                totalAllocation: total,
                distributionIncentive: distributionIncentive
            });

            // Owner = Dao; Creator = msg.sender (for event attribution)
            _daoZapData.zapData.providerSplit = splitFactory.createSplit(
                projectSplitParams,
                _daoZapData.zapData.providerSafe,
                msg.sender
            );
        }

        // If no project split, fall back to using the Safe address as the "providerSplit" recipient.

        if (_daoZapData.zapData.providerSplit == address(0)) {
            if (_daoZapData.zapData.providerSafe != address(0)) {
                _daoZapData.zapData.providerSplit = _daoZapData
                    .zapData
                    .providerSafe;
            } else {
                revert ProjectTeamSplitNotCreated();
            }
        }

        // DAO split (controller = dao)
        if (!createDaoSplit) return _daoZapData;

        // Validate DAO split config when requested
        if (daoReceiver == address(0)) revert InvalidReceiver();
        if (spoilsBPS == 0 || spoilsBPS >= BPS_DENOMINATOR)
            revert InvalidSpoilsBPS();

        uint256 projectBPS = BPS_DENOMINATOR - spoilsBPS;

        address[] memory recipients = new address[](2);
        uint256[] memory allocations = new uint256[](2);

        recipients[0] = daoReceiver;
        recipients[1] = _daoZapData.zapData.providerSplit;
        allocations[0] = spoilsBPS;
        allocations[1] = projectBPS;

        SplitV2Lib.Split memory daoSplitParams = SplitV2Lib.Split({
            recipients: recipients,
            allocations: allocations,
            totalAllocation: BPS_DENOMINATOR,
            distributionIncentive: distributionIncentive
        });

        // Owner = Safe; Creator = msg.sender (for event attribution)
        _daoZapData.daoSplit = splitFactory.createSplit(
            daoSplitParams,
            dao,
            msg.sender
        );
        if (_daoZapData.daoSplit == address(0)) revert DaoSplitCreationFailed();

        return _daoZapData;
    }

    /// @notice If a DAO split was created, DAO becomes the provider and its split the daoReceiver.
    function _decodeEscrowParams(
        DaoZapData memory _daoZapData
    ) internal view returns (address[] memory escrowParams) {
        escrowParams = new address[](2);
        escrowParams[0] = _daoZapData.zapData.providerSafe;
        escrowParams[1] = _daoZapData.zapData.providerSplit;

        if (_daoZapData.daoSplit != address(0)) {
            escrowParams[0] = dao; // provider = DAO
            escrowParams[1] = _daoZapData.daoSplit; // providerReceiver = DAO split
        }

        return escrowParams;
    }

    /// @inheritdoc SafeSplitsEscrowZap
    function _createSafeSplitEscrow(
        address[] memory _owners,
        uint256[] memory _allocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        address _safeAddress,
        bytes calldata _splitsData,
        bytes calldata _escrowData
    ) internal override {
        DaoZapData memory dz = DaoZapData({
            zapData: ZapData({
                providerSafe: _safeAddress,
                providerSplit: address(0),
                escrow: address(0)
            }),
            daoSplit: address(0)
        });

        // Safe (if not supplied)
        if (dz.zapData.providerSafe == address(0)) {
            dz.zapData.providerSafe = _deploySafe(_owners, _safeData);
        }

        // Splits (project, then optional DAO split)
        dz = _deploySplit(_owners, _allocations, _splitsData, dz);

        // Escrow
        address[] memory escrowParams = _decodeEscrowParams(dz);
        dz.zapData.escrow = _deployEscrow(
            _milestoneAmounts,
            _escrowData,
            escrowParams
        );

        emit SafeSplitsDaoEscrowCreated(
            dz.zapData.providerSafe,
            dz.zapData.providerSplit,
            dz.daoSplit,
            dz.zapData.escrow
        );

        emit SafeSplitsEscrowCreated(
            dz.zapData.providerSafe,
            dz.zapData.providerSplit == dz.zapData.providerSafe
                ? address(0)
                : dz.zapData.providerSplit,
            dz.zapData.escrow
        );
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN CONFIG (only ADMIN)
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the DAO controller.
    function setDao(address _dao) external onlyRole(ADMIN) {
        if (_dao == address(0)) revert InvalidDao();
        dao = _dao;
        emit DaoUpdated(_dao);
    }

    /// @notice Update the daoReceiver (DAO treasury).
    function setReceiver(address _daoReceiver) external onlyRole(ADMIN) {
        if (_daoReceiver == address(0)) revert InvalidReceiver();
        daoReceiver = _daoReceiver;
        emit DaoReceiverUpdated(_daoReceiver);
    }

    /// @notice Update the DAO spoils in basis points (0–10_000).
    function setSpoilsBPS(uint16 _spoilsBPS) external onlyRole(ADMIN) {
        if (_spoilsBPS > BPS_DENOMINATOR) revert InvalidSpoilsBPS();
        spoilsBPS = _spoilsBPS;
        emit SpoilsBPSUpdated(_spoilsBPS);
    }
}
