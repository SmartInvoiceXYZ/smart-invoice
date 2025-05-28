// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {ISafeSplitsEscrowZap} from "./interfaces/ISafeSplitsEscrowZap.sol";
import {ISafeProxyFactory} from "./interfaces/ISafeProxyFactory.sol";
import {ISplitMain} from "./interfaces/ISplitMain.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SafeSplitsEscrowZap
/// @notice Contract for creating and managing Safe splits escrow with customizable settings.
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

    bytes32 public constant ADMIN = keccak256("ADMIN");

    struct ZapData {
        address safe;
        address projectTeamSplit;
        address escrow;
    }

    struct EscrowData {
        address client;
        uint8 arbitration;
        address resolver;
        address token;
        uint256 terminationTime;
        bytes32 saltNonce;
        bytes32 details;
        address providerReceiver;
    }

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with provided data.
     * @param _data The initialization data.
     */
    function init(bytes calldata _data) external virtual initializer {
        _handleData(_data);
    }

    /**
     * @dev Internal function to handle initialization data.
     * @param _data The initialization data.
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
     * @dev Internal function to deploy a new Safe with the provided owners and threshold.
     * @param _owners The address list of owners for the Safe.
     * @param _safeData The encoded data for Safe setup.
     * @param _zapData The data struct for storing deployment results.
     */
    function _deploySafe(
        address[] memory _owners,
        bytes calldata _safeData,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {
        (uint256 _threshold, uint256 _saltNonce) = abi.decode(
            _safeData,
            (uint256, uint256)
        );

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
            fallbackHandler, // fallbackHandlerAddress
            address(0), // paymentToken
            0, // payment
            address(0) // paymentReceiver
        );

        // Create the Safe proxy
        _zapData.safe = safeFactory.createProxyWithNonce(
            safeSingleton,
            safeInitializer,
            _saltNonce
        );
        if (_zapData.safe == address(0)) revert SafeNotCreated();

        return _zapData;
    }

    /**
     * @dev Internal function to create a new Split with the provided owners and percent allocations.
     * @param _owners The address list of owners for the split.
     * @param _percentAllocations The percent allocations for the split.
     * @param _splitData The encoded data for split setup.
     * @param _zapData The data struct for storing deployment results.
     */
    function _createSplit(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        bytes calldata _splitData,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {
        bool projectSplit = abi.decode(_splitData, (bool));
        if (!projectSplit) return _zapData;

        // Create the project team split
        _zapData.projectTeamSplit = splitMain.createSplit(
            _owners,
            _percentAllocations,
            distributorFee,
            _zapData.safe
        );

        if (_zapData.projectTeamSplit == address(0))
            revert ProjectTeamSplitNotCreated();

        return _zapData;
    }

    /**
     * @dev Internal function to handle escrow data.
     * @param _escrowData The encoded data for escrow setup.
     */
    function _handleEscrowData(
        bytes calldata _escrowData
    ) internal pure returns (EscrowData memory) {
        (
            address client,
            uint32 arbitration,
            address resolver,
            address token,
            uint256 terminationTime,
            uint256 _saltNonce,
            bytes32 details
        ) = abi.decode(
                _escrowData,
                (address, uint32, address, address, uint256, uint256, bytes32)
            );

        return
            EscrowData({
                client: client,
                arbitration: uint8(arbitration),
                resolver: resolver,
                token: token,
                terminationTime: terminationTime,
                saltNonce: bytes32(_saltNonce),
                details: details,
                providerReceiver: address(0)
            });
    }

    /**
     * @dev Internal function to deploy a new Escrow with the provided details.
     * @param _milestoneAmounts The milestone amounts for the escrow.
     * @param _escrowData The encoded data for escrow setup.
     * @param _escrowParams The parameters required for escrow deployment.
     * @param _zapData The data struct for storing deployment results.
     */
    function _deployEscrow(
        uint256[] memory _milestoneAmounts,
        bytes calldata _escrowData,
        address[] memory _escrowParams,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {
        EscrowData memory escrowData = _handleEscrowData(_escrowData);

        // Encode data for escrow setup
        bytes memory escrowDetails = abi.encode(
            escrowData.client,
            escrowData.arbitration,
            escrowData.resolver,
            escrowData.token,
            escrowData.terminationTime,
            escrowData.details,
            wrappedNativeToken,
            false, // requireVerification
            address(escrowFactory), // factory address
            _escrowParams[1] // providerReceiver
        );

        // Deploy the escrow
        _zapData.escrow = escrowFactory.createDeterministic(
            _escrowParams[0], // provider
            _milestoneAmounts, // milestoneAmounts
            escrowDetails,
            bytes32("updatable"),
            escrowData.saltNonce
        );
        if (_zapData.escrow == address(0)) revert EscrowNotCreated();

        return _zapData;
    }

    /**
     * @dev Internal function to handle escrow parameters.
     * @param _zapData The data struct for storing deployment results.
     */
    function _handleEscrowParams(
        ZapData memory _zapData
    ) internal pure returns (address[] memory) {
        address[] memory escrowParams = new address[](2);
        escrowParams[0] = _zapData.safe;
        escrowParams[1] = _zapData.projectTeamSplit != address(0)
            ? _zapData.projectTeamSplit
            : _zapData.safe;
        return escrowParams;
    }

    /**
     * @dev Internal function to create a new Safe, Split, and Escrow.
     * @param _owners The list of owners for the Safe and Split.
     * @param _percentAllocations The percent allocations for the Split.
     * @param _milestoneAmounts The milestone amounts for the Escrow.
     * @param _safeData The encoded data for Safe setup.
     * @param _safeAddress The address of an existing Safe.
     * @param _splitData The encoded data for Split setup.
     * @param _escrowData The encoded data for Escrow setup.
     */
    function _createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        address _safeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) internal virtual {
        ZapData memory zapData = ZapData({
            safe: _safeAddress,
            projectTeamSplit: address(0),
            escrow: address(0)
        });

        if (zapData.safe == address(0)) {
            zapData = _deploySafe(_owners, _safeData, zapData);
        }

        zapData = _createSplit(
            _owners,
            _percentAllocations,
            _splitData,
            zapData
        );

        address[] memory escrowParams = _handleEscrowParams(zapData);

        zapData = _deployEscrow(
            _milestoneAmounts,
            _escrowData,
            escrowParams,
            zapData
        );

        emit SafeSplitsEscrowCreated(
            zapData.safe,
            zapData.projectTeamSplit,
            zapData.escrow
        );
    }

    /**
     * @notice Deploys a new Safe, Project Team Split, and Escrow with the provided details.
     * @param _owners The Safe owners and project team participants.
     * @param _percentAllocations The percent allocations for the project team split.
     * @param _milestoneAmounts The milestone amounts for the escrow.
     * @param _safeData The encoded data for deploying a Safe.
     * @param _safeAddress The address of an existing Safe.
     * @param _splitData The encoded data for deploying a Split.
     * @param _escrowData The encoded data for escrow deployment.
     */
    function createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        address _safeAddress,
        bytes calldata _splitData,
        bytes calldata _escrowData
    ) public virtual {
        if (_percentAllocations.length != _owners.length)
            revert InvalidAllocationsOwnersData();

        _createSafeSplitEscrow(
            _owners,
            _percentAllocations,
            _milestoneAmounts,
            _safeData,
            _safeAddress,
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
        if (!hasRole(ADMIN, _msgSender())) revert NotAuthorized();
        _updateAddresses(_data);
    }

    /**
     * @notice Updates the distributor fee.
     * @param _distributorFee The new distributor fee.
     */
    function updateDistributorFee(uint32 _distributorFee) external {
        if (!hasRole(ADMIN, _msgSender())) revert NotAuthorized();
        distributorFee = _distributorFee;
        emit UpdatedDistributorFee(_distributorFee);
    }
}
