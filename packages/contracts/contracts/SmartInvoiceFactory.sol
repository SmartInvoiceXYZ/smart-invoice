// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

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
import {ISmartInvoice} from "./interfaces/ISmartInvoice.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SmartInvoiceFactory
/// @notice Factory contract for creating and managing smart invoice instances.
contract SmartInvoiceFactory is
    ISmartInvoiceFactory,
    AccessControl,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;
    uint256 public invoiceCount = 0;

    mapping(uint256 => address) internal _invoices;
    mapping(address => uint256) public resolutionRates;

    bytes32 public constant ADMIN = keccak256("ADMIN");

    // Implementation Storage
    mapping(bytes32 => mapping(uint256 => address)) public implementations;
    mapping(bytes32 => uint256) public currentVersions;

    // solhint-disable-next-line immutable-vars-naming
    IWRAPPED public immutable wrappedNativeToken;

    /// @notice Constructor to initialize the factory with a wrapped native token.
    /// @param _wrappedNativeToken The address of the wrapped native token.
    constructor(address _wrappedNativeToken) {
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();
        wrappedNativeToken = IWRAPPED(_wrappedNativeToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN, msg.sender);
    }

    /**
     * @dev Internal function to initialize a new invoice.
     * @param _invoiceAddress The address of the invoice contract.
     * @param _recipient The address of the recipient.
     * @param _amounts The array of amounts associated with the recipient.
     * @param _data Additional data needed for initialization.
     * @param _type The type of the invoice.
     * @param _version The version of the invoice implementation.
     */
    function _init(
        address _invoiceAddress,
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type,
        uint256 _version
    ) internal {
        uint256 invoiceId = invoiceCount;
        _invoices[invoiceId] = _invoiceAddress;
        invoiceCount++;

        ISmartInvoice(_invoiceAddress).init(_recipient, _amounts, _data);

        emit LogNewInvoice(
            invoiceId,
            _invoiceAddress,
            _amounts,
            _type,
            _version
        );
    }

    /**
     * @notice Creates a new smart invoice instance.
     * @param _recipient The address of the recipient.
     * @param _amounts The array of amounts associated with the recipient.
     * @param _data Additional data needed for initialization.
     * @param _type The type of the invoice.
     * @return The address of the created invoice.
     */
    function create(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type
    ) public override returns (address) {
        uint256 _version = currentVersions[_type];
        address _implementation = implementations[_type][_version];
        if (_implementation == address(0)) revert ImplementationDoesNotExist();

        address invoiceAddress = Clones.clone(_implementation);
        _init(invoiceAddress, _recipient, _amounts, _data, _type, _version);

        return invoiceAddress;
    }

    /**
     * @notice Predicts the deterministic address of a clone.
     * @param _type The type of the invoice.
     * @param _salt The salt used to determine the address.
     * @return The predicted address of the deterministic clone.
     */
    function predictDeterministicAddress(
        bytes32 _type,
        bytes32 _salt
    ) external view override returns (address) {
        uint256 _version = currentVersions[_type];
        address _implementation = implementations[_type][_version];
        return Clones.predictDeterministicAddress(_implementation, _salt);
    }

    /**
     * @notice Creates a new smart invoice instance deterministically.
     * @param _recipient The address of the recipient.
     * @param _amounts The array of amounts associated with the recipient.
     * @param _data Additional data needed for initialization.
     * @param _type The type of the invoice.
     * @param _salt The salt used to determine the address.
     * @return The address of the created invoice.
     */
    function createDeterministic(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type,
        bytes32 _salt
    ) public override returns (address) {
        uint256 _version = currentVersions[_type];
        address _implementation = implementations[_type][_version];
        if (_implementation == address(0)) revert ImplementationDoesNotExist();

        address invoiceAddress = Clones.cloneDeterministic(
            _implementation,
            _salt
        );
        _init(invoiceAddress, _recipient, _amounts, _data, _type, _version);

        return invoiceAddress;
    }

    /**
     * @notice Gets the implementation address for a given type and version.
     * @param _implementationType The type of the implementation.
     * @param _implementationVersion The version of the implementation.
     * @return The address of the implementation.
     */
    function getImplementation(
        bytes32 _implementationType,
        uint256 _implementationVersion
    ) external view returns (address) {
        return implementations[_implementationType][_implementationVersion];
    }

    /**
     * @notice Gets the address of an invoice by its index.
     * @param index The index of the invoice.
     * @return The address of the invoice.
     */
    function getInvoiceAddress(uint256 index) external view returns (address) {
        return _invoices[index];
    }

    /**
     * @notice Updates the resolution rate for a resolver.
     * @param _resolutionRate The new resolution rate.
     * @param _details Additional details about the update.
     */
    function updateResolutionRate(
        uint256 _resolutionRate,
        bytes32 _details
    ) external {
        resolutionRates[msg.sender] = _resolutionRate;
        emit UpdateResolutionRate(msg.sender, _resolutionRate, _details);
    }

    /**
     * @notice Gets the resolution rate of a resolver.
     * @param _resolver The address of the resolver.
     * @return The resolution rate of the resolver.
     */
    function resolutionRateOf(
        address _resolver
    ) external view override returns (uint256) {
        return resolutionRates[_resolver];
    }

    /**
     * @notice Adds a new implementation for a given type.
     * @param _type The type of the invoice.
     * @param _implementation The address of the new implementation.
     */
    function addImplementation(
        bytes32 _type,
        address _implementation
    ) external onlyRole(ADMIN) {
        if (_implementation == address(0)) revert ZeroAddressImplementation();

        uint256 _version = currentVersions[_type];
        address currentImplementation = implementations[_type][_version];

        if (currentImplementation == address(0)) {
            implementations[_type][_version] = _implementation;
        } else {
            _version++;
            implementations[_type][_version] = _implementation;
            currentVersions[_type] = _version;
        }

        emit AddImplementation(_type, _version, _implementation);
    }

    /**
     * @notice Internal function to handle funding of created escrow contracts
     * @param escrow The address of the escrow contract to fund
     * @param _fundAmount The amount to fund the escrow
     */
    function _fundEscrow(address escrow, uint256 _fundAmount) internal {
        // Ensure escrow creation was successful
        if (escrow == address(0)) revert EscrowNotCreated();

        address token = ISmartInvoiceEscrow(escrow).token();

        if (token == address(wrappedNativeToken) && msg.value > 0) {
            // Ensure the fund amount is valid
            if (msg.value != _fundAmount) revert InvalidFundAmount();

            // Transfer the native fund amount to the newly created escrow contract
            wrappedNativeToken.deposit{value: _fundAmount}();

            // Transfer the fund amount to the newly created escrow contract
            IERC20(token).safeTransfer(escrow, _fundAmount);
        } else {
            // Transfer the fund amount to the newly created escrow contract
            IERC20(token).safeTransferFrom(msg.sender, escrow, _fundAmount);
        }

        // Emit an event for the escrow creation
        emit EscrowCreated(escrow, token, _fundAmount);
    }

    /**
     * @notice Create an escrow contract and fund it with tokens
     * @param _provider The address of the provider
     * @param _milestoneAmounts Array of milestone amounts
     * @param _escrowData Additional data for the escrow
     * @param _escrowType The type of escrow to create
     * @param _fundAmount The amount to fund the escrow
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
     * @notice Create an escrow contract deterministically and fund it with tokens
     * @param _provider The address of the provider
     * @param _milestoneAmounts Array of milestone amounts
     * @param _escrowData Additional data for the escrow
     * @param _escrowType The type of escrow to create
     * @param _salt The salt used to determine the address
     * @param _fundAmount The amount to fund the escrow
     * @return escrow The address of the created escrow contract
     */
    function createDeterministicAndDeposit(
        address _provider,
        uint256[] calldata _milestoneAmounts,
        bytes calldata _escrowData,
        bytes32 _escrowType,
        bytes32 _salt,
        uint256 _fundAmount
    ) external payable nonReentrant returns (address escrow) {
        escrow = createDeterministic(
            _provider,
            _milestoneAmounts,
            _escrowData,
            _escrowType,
            _salt
        );
        _fundEscrow(escrow, _fundAmount);
    }

    /// @notice Error emitted when escrow creation fails
    error EscrowNotCreated();

    /// @notice Error emitted when the fund amount is invalid
    error InvalidFundAmount();

    /// @notice Event emitted when a new escrow is created
    /// @param escrow Address of the newly created escrow
    /// @param token Address of the token used for payment
    /// @param amount The total fund amount transferred to the escrow
    event EscrowCreated(
        address indexed escrow,
        address indexed token,
        uint256 amount
    );
}
