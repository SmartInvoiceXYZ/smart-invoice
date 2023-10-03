// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "./interfaces/ISafeSplitsEscrowZap.sol";
import "./interfaces/ISafeProxyFactory.sol";
import "./interfaces/ISplitMain.sol";
import "./interfaces/ISmartInvoiceFactory.sol";
import "./interfaces/ISmartInvoiceSplitEscrow.sol";
import "./interfaces/IWRAPPED.sol";

contract SafeSplitsEscrowZap is AccessControl, Initializable {
    /// @notice The SafeL2 singleton address
    address safeSingleton;

    /// @notice The fallback handler address
    address fallbackHandler;

    /// @notice The Safe proxy factory address
    ISafeProxyFactory safeFactory;

    /// @notice The SplitMain address
    ISplitMain splitMain;

    /// @notice The SmartInvoiceFactory address
    ISmartInvoiceFactory escrowFactory;

    /// @notice The wrapped native token (WETH) address
    IWRAPPED wrappedNativeToken;

    /// @notice The distributor fee provided for processing 0xSplits
    uint32 distributorFee = 0;

    bytes32 public constant ADMIN = keccak256("ADMIN");

    error InvalidAllocationsOwnersData();
    error SafeNotCreated();
    error ProjectTeamSplitNotCreated();
    error EscrowNotCreated();
    error NotAuthorized();

    event SafeSplitsEscrowCreated(
        address safe,
        address projectTeamSplit,
        address escrow
    );
    event UpdatedAddresses(
        address safeSingleton,
        address safeFactory,
        address splitMain,
        address escrowFactory
    );
    event UpdatedDistributorFee(uint32 distributorFee);

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

    // solhint-disable-next-line no-empty-blocks
    function initLock() external initializer {}

    function init(bytes calldata _data) external virtual initializer {
        _handleData(_data);
    }

    // INTERNAL

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
     * @dev Deploys a new Safe with the provided owners and threshold
     * @param _owners The address list of owners for the safe
     * @param _safeData The number of required confirmations for a Safe transaction
     * @param _zapData Resulting data struct
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
            address(0), //          to
            bytes("0x"), //         data
            fallbackHandler, //     fallbackHandlerAddress
            address(0), //          paymentToken
            0, //                   payment
            address(0) //           paymentReceiver
        );

        // (implementation address, initializer data, salt nonce)
        _zapData.safe = safeFactory.createProxyWithNonce(
            safeSingleton,
            safeInitializer,
            _saltNonce
        );
        if (_zapData.safe == address(0)) {
            revert SafeNotCreated();
        }

        return _zapData;
    }

    /**
     * @dev Deploys a new Split with the provided owners and percent allocations, optionally creates a DAO split for spoils
     * @param _owners The address list of owners for the raid party split
     * @param _percentAllocations The percent allocations for the raid party split
     * @param _zapData Resulting data struct
     */
    function _createSplit(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {
        // (recipients array, percent allocations array, no distributor fee, safe address)
        _zapData.projectTeamSplit = splitMain.createSplit(
            _owners,
            _percentAllocations,
            distributorFee,
            _zapData.safe
        );

        if (_zapData.projectTeamSplit == address(0)) {
            revert ProjectTeamSplitNotCreated();
        }

        return _zapData;
    }

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

        EscrowData memory escrowData = EscrowData({
            client: client,
            arbitration: uint8(arbitration),
            resolver: resolver,
            token: token,
            terminationTime: terminationTime,
            saltNonce: bytes32(_saltNonce),
            details: details,
            providerReceiver: address(0)
        });

        return escrowData;
    }

    /**
     * @dev Deploys a new Escrow with the provided details
     * @param _milestoneAmounts The initial milestone amounts for the escrow
     * @param _escrowData EscrowData struct containing escrow details
     * @param _zapData Resulting data struct
     */
    function _deployEscrow(
        uint256[] memory _milestoneAmounts,
        bytes calldata _escrowData,
        address[] memory _escrowParams,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {
        EscrowData memory escrowData = _handleEscrowData(_escrowData);

        // encode data for escrow details
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
            _escrowParams[1] //  providerReceiver
        );

        // deploy SplitEscrow
        _zapData.escrow = escrowFactory.createDeterministic(
            _escrowParams[0],
            _milestoneAmounts,
            escrowDetails,
            bytes32("updatable"),
            escrowData.saltNonce
        );
        if (_zapData.escrow == address(0)) {
            revert EscrowNotCreated();
        }

        return _zapData;
    }

    function _handleEscrowParams(
        ZapData memory _zapData
    ) internal pure returns (address[] memory) {
        address[] memory escrowParams = new address[](2);
        escrowParams[0] = _zapData.safe;
        escrowParams[1] = _zapData.projectTeamSplit;

        return escrowParams;
    }

    function _createSafeSplitEscrow(
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        uint256[] memory _milestoneAmounts,
        bytes calldata _safeData,
        bytes calldata _escrowData
    ) internal virtual {
        ZapData memory zapData = ZapData({
            safe: address(0),
            projectTeamSplit: address(0),
            escrow: address(0)
        });

        zapData = _deploySafe(_owners, _safeData, zapData);

        zapData = _createSplit(_owners, _percentAllocations, zapData);

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
            _escrowData
        );
    }

    // VIEW

    /**
     * @dev Views the addresses of the contracts used in the zap
     * @return address Safe singleton address
     * @return address Safe fallback handler address
     * @return address SplitMain address
     * @return address EscrowFactory address
     * @return address SpoilsManager address
     * @return address WrappedNativeToken address
     */
    function getAddresses()
        public
        view
        returns (address, address, address, address, address, address)
    {
        return (
            safeSingleton,
            fallbackHandler,
            address(safeFactory),
            address(splitMain),
            address(escrowFactory),
            address(wrappedNativeToken)
        );
    }

    /**
     * @dev Views the distributor fee used in the zap
     * @return uint32 The distributor fee provided for processing splits
     */
    function getDistributorFee() public view returns (uint32) {
        return distributorFee;
    }

    function _updateAddresses(bytes calldata _data) internal {
        (
            address _safeSingleton,
            address _safeFactory,
            address _splitMain,
            address _escrowFactory
        ) = abi.decode(_data, (address, address, address, address));

        if (_safeSingleton != address(0)) {
            safeSingleton = _safeSingleton;
        }
        if (_safeFactory != address(0)) {
            safeFactory = ISafeProxyFactory(_safeFactory);
        }
        if (_splitMain != address(0)) {
            splitMain = ISplitMain(_splitMain);
        }
        if (_escrowFactory != address(0)) {
            escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        }

        emit UpdatedAddresses(
            _safeSingleton,
            _safeFactory,
            _splitMain,
            _escrowFactory
        );
    }

    // ADMIN
    // ! zap could be solitary deploy to reduce potential for abuse
    // deployer retains ADMIN for instance
    /**
     * @dev Views the distributor fee used in the zap
     * @param _data The data for updating the instance's addresses
     */
    function updateAddresses(bytes calldata _data) external {
        if (hasRole(ADMIN, _msgSender())) {
            revert NotAuthorized();
        }

        _updateAddresses(_data);
    }

    function updateDistributorFee(uint32 _distributorFee) external {
        if (hasRole(ADMIN, _msgSender())) {
            revert NotAuthorized();
        }
        distributorFee = _distributorFee;
        emit UpdatedDistributorFee(_distributorFee);
    }
}

contract SafeSplitsEscrowZapFactory {
    address public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    event SafeSplitsEscrowZapCreated(
        address indexed safeSplitsEscrowZap,
        address indexed implementation,
        bytes32 indexed salt
    );

    /**
     * @dev Create a new SpoilsManager contract
     * @param _data addresses of the contracts used in the zap
     * @param _salt Salt used to create the contract address
     */
    function createSafeSplitsEscrowZap(
        bytes calldata _data,
        bytes32 _salt
    ) external returns (address) {
        address safeSplitEscrowZap = Clones.cloneDeterministic(
            implementation,
            _salt
        );
        SafeSplitsEscrowZap(safeSplitEscrowZap).init(_data);
        emit SafeSplitsEscrowZapCreated(
            safeSplitEscrowZap,
            implementation,
            _salt
        );
        return safeSplitEscrowZap;
    }
}
