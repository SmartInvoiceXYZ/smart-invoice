// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {ISafeSplitsEscrowZap} from "./interfaces/ISafeSplitsEscrowZap.sol";
import {ISafeProxyFactory} from "./interfaces/ISafeProxyFactory.sol";
import {ISplitMain} from "./interfaces/ISplitMain.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SafeSplitsEscrowZap
/// @notice Contract for creating and managing Safe splits escrow with customizable settings
///         Provides a unified interface to deploy Gnosis Safe, 0xSplits, and SmartInvoice Escrow in a single transaction
contract SafeSplitsEscrowZap is
    AccessControl,
    Initializable,
    ISafeSplitsEscrowZap
{
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

    /// @notice The wrapped native token (WETH) address
    IWRAPPED public wrappedNativeToken;

    /// @notice The distributor fee provided for processing 0xSplits
    uint32 public distributorFee = 0;

    /// @notice Admin role identifier for access control
    bytes32 public constant ADMIN = keccak256("ADMIN");

    /// @notice Hash identifier for escrow type used in deterministic deployment
    bytes32 public constant ESCROW_TYPE_HASH = keccak256("escrow-v3");

    /// @notice Constructor that disables initializers to prevent direct initialization
    ///         Contract must be initialized via the init() function after deployment
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with provided data
     *         Can only be called once due to initializer modifier
     * @param _data The initialization data containing addresses for all required contracts
     */
    function init(bytes calldata _data) external virtual initializer {
        _handleData(_data);
    }

    /**
     * @dev Internal function to handle initialization data
     *      Decodes and sets all required contract addresses
     * @param _data The initialization data containing contract addresses
     */
    function _handleData(bytes calldata _data) internal virtual {
        (
            address _safeSingleton,
            address _fallbackHandler,
            address _safeFactory,
            address _splitMain,
            address _escrowFactory,
            address _wrappedNativeToken
        ) = abi.decode(
                _data,
                (address, address, address, address, address, address)
            );

        safeSingleton = _safeSingleton;
        fallbackHandler = _fallbackHandler;
        safeFactory = ISafeProxyFactory(_safeFactory);
        splitMain = ISplitMain(_splitMain);
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        wrappedNativeToken = IWRAPPED(_wrappedNativeToken);
    }

    /**
     * @dev Internal function to deploy a new Gnosis Safe with the provided owners and threshold
     * @param _owners The address list of owners for the Safe
     * @param _safeData The encoded data for Safe setup containing threshold and salt nonce
     * @return safe The address of the deployed Safe
     */
    function _deploySafe(
        address[] memory _owners,
        bytes calldata _safeData
    ) internal returns (address safe) {
        (uint256 _threshold, uint256 _saltNonce) = abi.decode(
            _safeData,
            (uint256, uint256)
        );

        // Encode the Safe setup call with provided parameters
        bytes memory safeInitializer = abi.encodeWithSelector(
            bytes4(
                keccak256(
                    "setup(address[],uint256,address,bytes,address,address,uint256,address)"
                )
            ),
            _owners,
            _threshold,
            address(0), // to (no initial transaction)
            bytes("0x"), // data (no initial transaction data)
            fallbackHandler, // fallbackHandlerAddress
            address(0), // paymentToken (no payment)
            0, // payment (no payment)
            address(0) // paymentReceiver (no payment)
        );

        // Create the Safe proxy
        safe = safeFactory.createProxyWithNonce(
            safeSingleton,
            safeInitializer,
            _saltNonce
        );
        if (safe == address(0)) revert SafeNotCreated();

        return safe;
    }

    /**
     * @dev Internal function to create a new 0xSplits split with the provided owners and percent allocations
     * @param _owners The address list of owners for the split (must be sorted ascending)
     * @param _percentAllocations The percent allocations for the split (must match owners length)
     * @param _splitData The encoded data for split setup containing creation flag
     * @param _splitController The address of the controller for the split
     * @return split The address of the deployed split, or zero address if not created
     */
    function _deploySplit(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        bytes calldata _splitData,
        address _splitController
    ) internal returns (address split) {
        bool createProjectSplit = abi.decode(_splitData, (bool));
        if (!createProjectSplit) return address(0);

        // Create the project team split
        split = splitMain.createSplit(
            _owners,
            _percentAllocations,
            distributorFee,
            _splitController
        );

        if (split == address(0)) {
            revert ProjectTeamSplitNotCreated();
        }

        return split;
    }

    /**
     * @dev Internal function to handle escrow data.
     * @param _escrowData The encoded data for escrow setup.
     */
    function _decodeEscrowData(
        bytes calldata _escrowData
    ) internal pure returns (EscrowData memory escrowData) {
        escrowData = abi.decode(_escrowData, (EscrowData));

        return escrowData;
    }

    /**
     * @dev Internal function to handle escrow parameters.
     * @param _zapData The data struct for storing deployment results.
     * @return The escrow parameters for the deployment.
     */
    function _decodeEscrowParams(
        ZapData memory _zapData
    ) internal pure returns (address[] memory) {
        address[] memory escrowParams = new address[](2);
        escrowParams[0] = _zapData.providerSafe;
        escrowParams[1] = _zapData.providerSplit == address(0)
            ? _zapData.providerSafe
            : _zapData.providerSplit;

        return escrowParams;
    }

    /**
     * @dev Internal function to deploy a new Escrow with the provided details.
     * @param _milestoneAmounts The milestone amounts for the escrow.
     * @param _escrowData The encoded data for escrow setup.
     * @param _escrowParams The provider parameters for the escrow setup.
     */
    function _deployEscrow(
        uint256[] memory _milestoneAmounts,
        bytes calldata _escrowData,
        address[] memory _escrowParams
    ) internal returns (address escrow) {
        EscrowData memory escrowData = _decodeEscrowData(_escrowData);

        // Create InitData struct for escrow setup
        ISmartInvoiceEscrow.InitData memory initData = ISmartInvoiceEscrow
            .InitData({
                client: escrowData.client,
                resolverType: escrowData.resolverType,
                resolver: escrowData.resolver,
                token: escrowData.token,
                terminationTime: escrowData.terminationTime,
                requireVerification: escrowData.requireVerification,
                providerReceiver: _escrowParams[1], // providerReceiver
                clientReceiver: escrowData.clientReceiver,
                feeBPS: escrowData.feeBPS,
                treasury: escrowData.treasury,
                details: escrowData.details
            });

        // Encode data for escrow setup
        bytes memory escrowDetails = abi.encode(initData);

        uint256 version = escrowFactory.currentVersions(ESCROW_TYPE_HASH);

        // Deploy the escrow
        escrow = escrowFactory.createDeterministic(
            _escrowParams[0], // provider
            _milestoneAmounts, // milestoneAmounts
            escrowDetails,
            ESCROW_TYPE_HASH,
            version,
            escrowData.saltNonce
        );
        if (escrow == address(0)) revert EscrowNotCreated();

        return escrow;
    }

    /**
     * @dev Internal function to create a new Safe, Split, and Escrow.
     * @param _owners The list of owners for the Safe and Split.
     * @param _percentAllocations The percent allocations for the Split.
     * @param _milestoneAmounts The milestone amounts for the Escrow.
     * @param _providerSafeData The encoded data for Safe setup.
     * @param _providerSafeAddress The address of an existing Safe.
     * @param _splitData The encoded data for Split setup.
     * @param _escrowData The encoded data for Escrow setup.
     */
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

    /**
     * @notice Deploys a new Safe, Project Team Split, and Escrow with the provided details.
     * @param _owners The Safe owners and project team participants.
     * @param _percentAllocations The percent allocations for the project team split.
     * @param _milestoneAmounts The milestone amounts for the escrow.
     * @param _providerSafeData The encoded data for deploying a Safe.
     * @param _providerSafeAddress The address of an existing Safe.
     * @param _splitData The encoded data for deploying a Split.
     * @param _escrowData The encoded data for escrow deployment.
     */
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _providerSafeData,
        address _providerSafeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) public virtual {
        if (_percentAllocations.length != _owners.length)
            revert InvalidAllocationsOwnersData();

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
     * @dev Internal function to update addresses used by the contract.
     * @param _data The encoded data for updating addresses.
     */
    function _updateAddresses(bytes calldata _data) internal {
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
     * @notice Updates the addresses used by the contract.
     * @param _data The encoded data for updating addresses.
     */
    function updateAddresses(bytes calldata _data) external {
        if (!hasRole(ADMIN, msg.sender)) revert NotAuthorized();
        _updateAddresses(_data);
    }

    /**
     * @notice Updates the distributor fee.
     * @param _distributorFee The new distributor fee.
     */
    function updateDistributorFee(uint32 _distributorFee) external {
        if (!hasRole(ADMIN, msg.sender)) revert NotAuthorized();
        distributorFee = _distributorFee;
        emit UpdatedDistributorFee(_distributorFee);
    }
}
