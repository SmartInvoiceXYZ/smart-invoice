// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {ISafeSplitsEscrowZap} from "./interfaces/ISafeSplitsEscrowZap.sol";
import {ISafeProxyFactory} from "./interfaces/ISafeProxyFactory.sol";
import {ISplitMain} from "./interfaces/ISplitMain.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";

/// @title SafeSplitsEscrowZap
/// @notice Contract for creating and managing Safe splits escrow with customizable settings
///         Provides a unified interface to deploy Gnosis Safe, 0xSplits, and SmartInvoice Escrow in a single transaction
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

    /// @notice The SplitMain address
    ISplitMain public splitMain;

    /// @notice The SmartInvoiceFactory address
    ISmartInvoiceFactory public escrowFactory;

    /// @notice 0xSplits distributor fee (scaled by 1e6)
    uint32 public distributorFee = 0;

    /// @notice Admin role identifier for access control
    bytes32 public constant ADMIN = keccak256("ADMIN");

    /// @notice Hash identifier for escrow type used in deterministic deployment
    bytes32 public constant ESCROW_TYPE_HASH = keccak256("escrow-v3");

    /// @dev Reverts when a required address is zero.
    error InvalidAddress(string field);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _data encoded data for initialization
    constructor(bytes memory _data) {
        // grant roles to deployer
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
            address _splitMain,
            address _escrowFactory
        ) = abi.decode(_data, (address, address, address, address, address));

        // minimal sanity checks to avoid footguns
        if (_safeSingleton == address(0))
            revert InvalidAddress("safeSingleton");
        if (_safeFactory == address(0)) revert InvalidAddress("safeFactory");
        if (_splitMain == address(0)) revert InvalidAddress("splitMain");
        if (_escrowFactory == address(0))
            revert InvalidAddress("escrowFactory");
        // fallbackHandler can be zero depending on your Safe setup; keep optional

        safeSingleton = _safeSingleton;
        fallbackHandler = _fallbackHandler;
        safeFactory = ISafeProxyFactory(_safeFactory);
        splitMain = ISplitMain(_splitMain);
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
    }

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
            bytes("0x"), // data
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

    function _deploySplit(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        bytes calldata _splitData,
        address _splitController
    ) internal returns (address split) {
        bool createProjectSplit = abi.decode(_splitData, (bool));
        if (!createProjectSplit) return address(0);

        if (_percentAllocations.length != _owners.length) {
            revert InvalidAllocationsOwnersData();
        }

        split = splitMain.createSplit(
            _owners,
            _percentAllocations,
            distributorFee,
            _splitController
        );
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
                resolverType: d.resolverType,
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
        uint32[] memory _percentAllocations,
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

        zapData.providerSplit = _deploySplit(
            _owners,
            _percentAllocations,
            _splitData,
            zapData.providerSafe
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

    /**
     * @notice Deploy a Safe (if not provided), an optional 0xSplits split, and a SmartInvoice escrow.
     * @param _owners Safe owners / split recipients (must match _percentAllocations length)
     * @param _percentAllocations Split allocations (1e6 = 100%); ignored if split disabled
     * @param _milestoneAmounts Escrow milestone amounts
     * @param _providerSafeData abi.encode(threshold, saltNonce) for Safe; ignored if _providerSafeAddress != 0
     * @param _providerSafeAddress Existing Safe to reuse; if zero, a new Safe will be created
     * @param _splitData abi.encode(bool createProjectSplit)
     * @param _escrowData abi.encode(EscrowData)
     */
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _providerSafeData,
        address _providerSafeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) external {
        if (_percentAllocations.length != _owners.length) {
            revert InvalidAllocationsOwnersData();
        }

        _createSafeSplitEscrow(
            _owners,
            _percentAllocations,
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
     *   address _splitMain,
     *   address _escrowFactory
     * )
     */
    function updateAddresses(bytes calldata _data) external {
        if (!hasRole(ADMIN, msg.sender)) revert NotAuthorized();

        (
            address _safeSingleton,
            address _safeFactory,
            address _splitMain,
            address _escrowFactory
        ) = abi.decode(_data, (address, address, address, address));

        if (_safeSingleton != address(0)) safeSingleton = _safeSingleton;
        if (_safeFactory != address(0))
            safeFactory = ISafeProxyFactory(_safeFactory);
        if (_splitMain != address(0)) splitMain = ISplitMain(_splitMain);
        if (_escrowFactory != address(0))
            escrowFactory = ISmartInvoiceFactory(_escrowFactory);

        emit UpdatedAddresses(
            _safeSingleton,
            _safeFactory,
            _splitMain,
            _escrowFactory
        );
    }

    /**
     * @notice Admin: update the 0xSplits distributor fee (scaled by 1e6).
     */
    function updateDistributorFee(uint32 _distributorFee) external {
        if (!hasRole(ADMIN, msg.sender)) revert NotAuthorized();
        distributorFee = _distributorFee;
        emit UpdatedDistributorFee(_distributorFee);
    }
}
