// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {ISafeSplitsEscrowZap} from "./interfaces/ISafeSplitsEscrowZap.sol";
import {ISafeProxyFactory} from "./interfaces/ISafeProxyFactory.sol";
import {ISplitFactoryV2} from "./interfaces/ISplitFactoryV2.sol";
import {SplitV2Lib} from "./libraries/SplitV2Lib.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";

/// @title SafeSplitsEscrowZap (v2 Splits)
/// @notice Deploys a Safe (optional), a Splits v2 splitter (optional), and a SmartInvoice escrow in one tx.
///         Splits v2 decouples the splitter from balances (Warehouse) and supports Push/Pull flavors via factories.
contract SafeSplitsEscrowZap is AccessControl, ISafeSplitsEscrowZap {
    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice The SafeL2 singleton address
    address public safeSingleton;

    /// @notice The fallback handler address
    address public fallbackHandler;

    /// @notice The Safe proxy factory address
    ISafeProxyFactory public safeFactory;

    /// @notice The Splits v2 factory address
    ISplitFactoryV2 public splitFactory;

    /// @notice The SmartInvoiceFactory address
    ISmartInvoiceFactory public escrowFactory;

    /// @notice The Splits v2 distribution incentive (max ~6.5%)
    uint16 public distributionIncentive = 0;

    /// @notice Admin role
    bytes32 public constant ADMIN = keccak256("ADMIN");

    /// @notice Hash identifier for escrow type used in deterministic deployment
    bytes32 public constant ESCROW_TYPE_HASH = keccak256("escrow-v3");

    /// @dev Reverts when a required address is zero.
    error InvalidAddress(string field);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _data abi.encode(
    ///   address _safeSingleton,
    ///   address _fallbackHandler,
    ///   address _safeFactory,
    ///   address _splitFactoryV2, the PushSplitFactory or PullSplitFactory
    ///   address _escrowFactory
    /// )
    constructor(bytes memory _data) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN, msg.sender);
        _handleData(_data);
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    function _handleData(bytes memory _data) internal virtual {
        (
            address _safeSingleton,
            address _fallbackHandler,
            address _safeFactory,
            address _splitFactoryV2,
            address _escrowFactory
        ) = abi.decode(_data, (address, address, address, address, address));

        if (_safeSingleton == address(0))
            revert InvalidAddress("safeSingleton");
        if (_safeFactory == address(0)) revert InvalidAddress("safeFactory");
        if (_splitFactoryV2 == address(0))
            revert InvalidAddress("splitFactoryV2");
        if (_escrowFactory == address(0))
            revert InvalidAddress("escrowFactory");
        if (_fallbackHandler == address(0))
            revert InvalidAddress("fallbackHandler");

        safeSingleton = _safeSingleton;
        fallbackHandler = _fallbackHandler;
        safeFactory = ISafeProxyFactory(_safeFactory);
        splitFactory = ISplitFactoryV2(_splitFactoryV2);
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
    }

    /// @dev Deploy a Safe
    function _deploySafe(
        address[] memory _owners,
        bytes calldata _safeData
    ) internal returns (address safe) {
        (uint256 _threshold, uint256 _saltNonce) = abi.decode(
            _safeData,
            (uint256, uint256)
        );

        // encode Safe.setup(..)
        bytes memory safeInitializer = abi.encodeWithSelector(
            bytes4(
                keccak256(
                    "setup(address[],uint256,address,bytes,address,address,uint256,address)"
                )
            ),
            _owners,
            _threshold,
            address(0), // to
            bytes(""), // data
            fallbackHandler, // fallback handler
            address(0), // payment token
            0, // payment
            address(0) // payment receiver
        );

        safe = safeFactory.createProxyWithNonce(
            safeSingleton,
            safeInitializer,
            _saltNonce
        );
        if (safe == address(0)) revert SafeNotCreated();
    }

    /// @dev Create a Splits v2 splitter via factory (Push or Pull depending on factory address)
    function _deploySplit(
        address[] memory _owners,
        uint256[] memory _allocations,
        bytes calldata _splitData,
        address _splitOwner
    ) internal returns (address split) {
        bool createProjectSplit = abi.decode(_splitData, (bool));
        if (!createProjectSplit) return address(0);

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

        SplitV2Lib.Split memory params = SplitV2Lib.Split({
            recipients: _owners,
            allocations: _allocations,
            totalAllocation: total,
            distributionIncentive: distributionIncentive
        });

        // Owner = Safe; Creator = msg.sender (for event attribution)
        split = splitFactory.createSplit(params, _splitOwner, msg.sender);
        if (split == address(0)) revert ProjectTeamSplitNotCreated();
    }

    function _decodeEscrowData(
        bytes calldata _escrowData
    ) internal pure returns (EscrowData memory escrowData) {
        escrowData = abi.decode(_escrowData, (EscrowData));
    }

    function _decodeEscrowParams(
        ZapData memory _zapData
    ) internal pure returns (address[] memory escrowParams) {
        escrowParams = new address[](2);
        escrowParams[0] = _zapData.providerSafe;
        escrowParams[1] = _zapData.providerSplit == address(0)
            ? _zapData.providerSafe
            : _zapData.providerSplit;
        return escrowParams;
    }

    function _deployEscrow(
        uint256[] memory _milestoneAmounts,
        bytes calldata _escrowData,
        address[] memory _escrowParams
    ) internal returns (address escrow) {
        EscrowData memory d = _decodeEscrowData(_escrowData);

        ISmartInvoiceEscrow.InitData memory initData = ISmartInvoiceEscrow
            .InitData({
                client: d.client,
                resolverData: d.resolverData,
                resolver: d.resolver,
                token: d.token,
                terminationTime: d.terminationTime,
                requireVerification: d.requireVerification,
                providerReceiver: _escrowParams[1],
                clientReceiver: d.clientReceiver,
                feeBPS: d.feeBPS,
                treasury: d.treasury,
                details: d.details
            });

        bytes memory escrowDetails = abi.encode(initData);
        uint256 version = escrowFactory.currentVersions(ESCROW_TYPE_HASH);

        escrow = escrowFactory.createDeterministic(
            _escrowParams[0], // provider (Safe)
            _milestoneAmounts,
            escrowDetails,
            ESCROW_TYPE_HASH,
            version,
            d.saltNonce
        );
        if (escrow == address(0)) revert EscrowNotCreated();
    }

    function _createSafeSplitEscrow(
        address[] memory _owners,
        uint256[] memory _allocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _providerSafeData,
        address _providerSafeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) internal virtual {
        ZapData memory zapData = ZapData({
            providerSafe: _providerSafeAddress,
            providerSplit: address(0),
            escrow: address(0)
        });

        if (zapData.providerSafe == address(0)) {
            zapData.providerSafe = _deploySafe(_owners, _providerSafeData);
        }

        // v2 splitter (optional)
        zapData.providerSplit = _deploySplit(
            _owners,
            _allocations,
            _splitData,
            zapData.providerSafe // owner of the split is the Safe
        );

        address[] memory escrowParams = _decodeEscrowParams(zapData);

        zapData.escrow = _deployEscrow(
            _milestoneAmounts,
            _escrowData,
            escrowParams
        );

        emit SafeSplitsEscrowCreated(
            zapData.providerSafe,
            zapData.providerSplit,
            zapData.escrow
        );
    }

    /*//////////////////////////////////////////////////////////////
                             EXTERNAL API
    //////////////////////////////////////////////////////////////*/

    function createSafeSplitEscrow(
        address[] memory _owners,
        uint256[] memory _allocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _providerSafeData,
        address _providerSafeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) external {
        _createSafeSplitEscrow(
            _owners,
            _allocations,
            _milestoneAmounts,
            _providerSafeData,
            _providerSafeAddress,
            _splitData,
            _escrowData
        );
    }

    /**
     * @notice Admin: update core addresses. Pass zero to keep a field unchanged.
     * @param _data abi.encode(
     *   address _safeSingleton,
     *   address _safeFactory,
     *   address _splitFactoryV2,
     *   address _escrowFactory
     * )
     */
    function updateAddresses(bytes calldata _data) external {
        if (!hasRole(ADMIN, msg.sender)) revert NotAuthorized();

        (
            address _safeSingleton,
            address _safeFactory,
            address _splitFactoryV2,
            address _escrowFactory
        ) = abi.decode(_data, (address, address, address, address));

        if (_safeSingleton != address(0)) safeSingleton = _safeSingleton;
        if (_safeFactory != address(0))
            safeFactory = ISafeProxyFactory(_safeFactory);
        if (_splitFactoryV2 != address(0))
            splitFactory = ISplitFactoryV2(_splitFactoryV2);
        if (_escrowFactory != address(0))
            escrowFactory = ISmartInvoiceFactory(_escrowFactory);

        emit UpdatedAddresses(
            address(safeSingleton),
            address(safeFactory),
            address(splitFactory),
            address(escrowFactory)
        );
    }

    /**
     * @notice Admin: update the Splits v2 distribution incentive
     */
    function updateDistributionIncentive(
        uint16 _distributionIncentive
    ) external {
        if (!hasRole(ADMIN, msg.sender)) revert NotAuthorized();

        distributionIncentive = uint16(_distributionIncentive);

        emit UpdatedDistributionIncentive(_distributionIncentive);
    }
}
