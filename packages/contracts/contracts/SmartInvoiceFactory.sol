// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SmartInvoiceFactory
/// @notice Factory contract for creating and managing smart invoice instances
///         Supports multiple implementation types and versions with deterministic address creation
contract SmartInvoiceFactory is
    ISmartInvoiceFactory,
    AccessControl,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    /// @notice Total count of invoices created by this factory
    uint256 public invoiceCount = 0;

    /// @dev Mapping from invoice ID to invoice address
    mapping(uint256 => address) internal _invoices;
    /// @notice Mapping from resolver address to their resolution rate
    mapping(address => uint256) public resolutionRates;

    /// @notice Admin role identifier for access control
    bytes32 public constant ADMIN = keccak256("ADMIN");

    /// @dev Storage for implementation addresses by type and version
    mapping(bytes32 => mapping(uint256 => address)) public implementations;
    /// @dev Current version for each implementation type
    mapping(bytes32 => uint256) public currentVersions;

    IWRAPPED public immutable WRAPPED_NATIVE_TOKEN;

    /// @notice Constructor to initialize the factory with a wrapped native token.
    /// @param _wrappedNativeToken The address of the wrapped native token.
    constructor(address _wrappedNativeToken) {
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();
        WRAPPED_NATIVE_TOKEN = IWRAPPED(_wrappedNativeToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN, msg.sender);
    }

    /**
     * @dev Internal function to initialize a new invoice
     * @param _invoiceAddress The address of the invoice contract
     * @param _recipient The address of the recipient (provider)
     * @param _amounts The array of amounts associated with the recipient
     * @param _data Additional data needed for initialization
     * @param _escrowType The type of the invoice (e.g., "ESCROW", "INSTANT")
     * @param _version The version of the invoice implementation
     */
    function _init(
        address _invoiceAddress,
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _escrowType,
        uint256 _version
    ) internal {
        // Not validating invoice parameters here, as they are validated in the init function of the implementation
        uint256 invoiceId = invoiceCount;
        _invoices[invoiceId] = _invoiceAddress;

        unchecked {
            invoiceCount++;
        }

        ISmartInvoiceEscrow(_invoiceAddress).init(_recipient, _amounts, _data);

        emit InvoiceCreated(
            invoiceId,
            _invoiceAddress,
            _amounts,
            _escrowType,
            _version
        );
    }

    /**
     * @notice Creates a new smart invoice instance using the latest implementation version
     * @param _recipient The address of the recipient (provider)
     * @param _amounts The array of amounts associated with the recipient
     * @param _data Additional data needed for initialization
     * @param _escrowType The type of the invoice (e.g., "ESCROW", "INSTANT")
     * @return The address of the created invoice
     */
    function create(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _escrowType
    ) public override returns (address) {
        uint256 _version = currentVersions[_escrowType];
        address _implementation = implementations[_escrowType][_version];
        if (_implementation == address(0)) revert ImplementationDoesNotExist();

        address invoiceAddress = Clones.clone(_implementation);
        _init(
            invoiceAddress,
            _recipient,
            _amounts,
            _data,
            _escrowType,
            _version
        );

        return invoiceAddress;
    }

    /**
     * @notice Predicts the deterministic address of a clone before creation
     * @param _escrowType The type of the invoice
     * @param _version The version of the invoice implementation
     * @param _salt The salt used to determine the address
     * @return The predicted address of the deterministic clone
     */
    function predictDeterministicAddress(
        bytes32 _escrowType,
        uint256 _version,
        bytes32 _salt
    ) external view override returns (address) {
        address _implementation = implementations[_escrowType][_version];
        if (_implementation == address(0)) revert ImplementationDoesNotExist();

        return Clones.predictDeterministicAddress(_implementation, _salt);
    }

    /**
     * @notice Creates a new smart invoice instance deterministically using CREATE2
     * @param _recipient The address of the recipient (provider)
     * @param _amounts The array of amounts associated with the recipient
     * @param _data Additional data needed for initialization
     * @param _escrowType The type of the invoice (e.g., "ESCROW", "INSTANT")
     * @param _version The version of the invoice implementation
     * @param _salt The salt used to determine the address
     * @return The address of the created invoice
     */
    function createDeterministic(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _escrowType,
        uint256 _version,
        bytes32 _salt
    ) public override returns (address) {
        address _implementation = implementations[_escrowType][_version];
        if (_implementation == address(0)) revert ImplementationDoesNotExist();

        address invoiceAddress = Clones.cloneDeterministic(
            _implementation,
            _salt
        );
        _init(
            invoiceAddress,
            _recipient,
            _amounts,
            _data,
            _escrowType,
            _version
        );

        return invoiceAddress;
    }

    /**
     * @notice Gets the implementation address for a given type and version
     * @param _implementationType The type of the implementation
     * @param _implementationVersion The version of the implementation
     * @return The address of the implementation
     */
    function getImplementation(
        bytes32 _implementationType,
        uint256 _implementationVersion
    ) external view returns (address) {
        return implementations[_implementationType][_implementationVersion];
    }

    /**
     * @notice Gets the address of an invoice by its sequential ID
     * @param index The sequential ID of the invoice
     * @return The address of the invoice
     */
    function getInvoiceAddress(uint256 index) external view returns (address) {
        if (index >= invoiceCount) revert InvalidInvoiceIndex();
        return _invoices[index];
    }

    /**
     * @notice Updates the resolution rate for the calling resolver
     *         Resolution rate is used to calculate fees (e.g., rate=20 means 1/20 = 5% fee)
     * @param _resolutionRate The new resolution rate (denominator for fee calculation)
     * @param _details Additional details about the update
     */
    function updateResolutionRate(
        uint256 _resolutionRate,
        bytes32 _details
    ) external {
        if (_resolutionRate < 2 || _resolutionRate > 1000)
            revert InvalidResolutionRate();
        resolutionRates[msg.sender] = _resolutionRate;
        emit UpdateResolutionRate(msg.sender, _resolutionRate, _details);
    }

    /**
     * @notice Gets the resolution rate of a resolver
     * @param _resolver The address of the resolver
     * @return The resolution rate of the resolver (denominator for fee calculation)
     */
    function resolutionRateOf(
        address _resolver
    ) external view override returns (uint256) {
        return resolutionRates[_resolver];
    }

    /**
     * @notice Adds a new implementation for a given type
     *         If it's the first implementation for the type, uses version 0; otherwise increments version
     * @param _escrowType The type of the invoice (e.g., "ESCROW", "INSTANT")
     * @param _implementation The address of the new implementation
     */
    function addImplementation(
        bytes32 _escrowType,
        address _implementation
    ) external onlyRole(ADMIN) {
        if (_implementation == address(0)) revert ZeroAddressImplementation();
        if (_implementation.code.length == 0)
            revert ImplementationDoesNotExist();

        uint256 _version = currentVersions[_escrowType];
        address currentImplementation = implementations[_escrowType][_version];

        if (currentImplementation == address(0)) {
            // First implementation for this type
            implementations[_escrowType][_version] = _implementation;
        } else {
            // Increment version and add new implementation
            _version++;
            implementations[_escrowType][_version] = _implementation;
            currentVersions[_escrowType] = _version;
        }

        emit AddImplementation(_escrowType, _version, _implementation);
    }

    /**
     * @notice Sets the current version for a given type
     * @param _escrowType The type of the invoice
     * @param _version The new version
     * @dev Only callable by admin, to be used in case of a bug in the implementation
     */
    function setCurrentVersion(
        bytes32 _escrowType,
        uint256 _version
    ) external onlyRole(ADMIN) {
        if (implementations[_escrowType][_version] == address(0))
            revert ImplementationDoesNotExist();
        currentVersions[_escrowType] = _version;
    }

    /**
     * @notice Internal function to handle funding of created escrow contracts
     * @param _escrow The address of the escrow contract to fund
     * @param _fundAmount The amount to fund the escrow
     */
    function _fundEscrow(address _escrow, uint256 _fundAmount) internal {
        if (_escrow == address(0)) revert EscrowNotCreated();
        if (_fundAmount == 0) revert InvalidFundAmount();

        try ISmartInvoiceEscrow(_escrow).token() returns (address token) {
            if (token == address(WRAPPED_NATIVE_TOKEN)) {
                if (msg.value > 0) {
                    // Wrap exactly _fundAmount
                    if (msg.value != _fundAmount) revert InvalidFundAmount();
                    WRAPPED_NATIVE_TOKEN.deposit{value: _fundAmount}();
                    IERC20(token).safeTransfer(_escrow, _fundAmount);
                } else {
                    // ERC20(WNATIVE) transferFrom path (requires allowance)
                    IERC20(token).safeTransferFrom(
                        msg.sender,
                        _escrow,
                        _fundAmount
                    );
                }
            } else {
                // Use ERC20 path (msg.value == 0)
                if (msg.value != 0) revert UnexpectedETH(); // prevent stuck ETH
                IERC20(token).safeTransferFrom(
                    msg.sender,
                    _escrow,
                    _fundAmount
                );
            }

            emit InvoiceFunded(_escrow, token, _fundAmount);
        } catch {
            revert InvalidEscrow();
        }
    }

    /**
     * @notice Create an escrow contract and fund it with tokens in a single transaction
     * @param _provider The address of the provider
     * @param _milestoneAmounts Array of milestone amounts
     * @param _escrowData Additional data for the escrow initialization
     * @param _escrowType The type of escrow to create (e.g., "ESCROW")
     * @param _fundAmount The amount to fund the escrow with
     * @return escrow The address of the created escrow contract
     */
    function createAndDeposit(
        address _provider,
        uint256[] calldata _milestoneAmounts,
        bytes calldata _escrowData,
        bytes32 _escrowType,
        uint256 _fundAmount
    ) external payable nonReentrant returns (address escrow) {
        escrow = create(_provider, _milestoneAmounts, _escrowData, _escrowType);
        _fundEscrow(escrow, _fundAmount);
    }

    /**
     * @notice Create an escrow contract deterministically and fund it with tokens in a single transaction
     * @param _provider The address of the provider
     * @param _milestoneAmounts Array of milestone amounts
     * @param _escrowData Additional data for the escrow initialization
     * @param _escrowType The type of escrow to create (e.g., "ESCROW")
     * @param _salt The salt used to determine the address
     * @param _version The version of the invoice implementation
     * @param _fundAmount The amount to fund the escrow with
     * @return escrow The address of the created escrow contract
     */
    function createDeterministicAndDeposit(
        address _provider,
        uint256[] calldata _milestoneAmounts,
        bytes calldata _escrowData,
        bytes32 _escrowType,
        uint256 _version,
        bytes32 _salt,
        uint256 _fundAmount
    ) external payable nonReentrant returns (address escrow) {
        escrow = createDeterministic(
            _provider,
            _milestoneAmounts,
            _escrowData,
            _escrowType,
            _version,
            _salt
        );
        _fundEscrow(escrow, _fundAmount);
    }

    receive() external payable {
        revert ETHNotAccepted();
    }

    function sweepERC20(
        address token,
        address to,
        uint256 amt
    ) external onlyRole(ADMIN) {
        IERC20(token).safeTransfer(to, amt);
    }
    function sweepETH(address to) external onlyRole(ADMIN) {
        (bool ok, ) = to.call{value: address(this).balance}("");
        if (!ok) revert ETHTransferFailed();
    }
}
