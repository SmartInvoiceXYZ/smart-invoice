// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IWRAPPED} from "./IWRAPPED.sol";

/// @title ISmartInvoiceFactory
/// @notice Interface for creating and managing Smart Invoice implementations & escrows.
interface ISmartInvoiceFactory {
    /*//////////////////////////////////////////////////////////////
                                CREATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Create a new invoice using the latest implementation version for the given type.
    function create(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type
    ) external returns (address);

    /// @notice Create a new invoice deterministically using CREATE2 and an explicit version.
    function createDeterministic(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type,
        uint256 _version,
        bytes32 _salt
    ) external returns (address);

    /// @notice Predict the deterministic address for a (type, version, salt) before creation.
    function predictDeterministicAddress(
        bytes32 _type,
        uint256 _version,
        bytes32 _salt
    ) external view returns (address);

    /*//////////////////////////////////////////////////////////////
                         CREATE + FUND IN ONE TX
    //////////////////////////////////////////////////////////////*/

    /// @notice Create an escrow invoice and fund it in a single transaction.
    function createAndDeposit(
        address _provider,
        uint256[] calldata _milestoneAmounts,
        bytes calldata _escrowData,
        bytes32 _escrowType,
        uint256 _fundAmount
    ) external payable returns (address escrow);

    /// @notice Create an escrow invoice deterministically and fund it in a single transaction.
    function createDeterministicAndDeposit(
        address _provider,
        uint256[] calldata _milestoneAmounts,
        bytes calldata _escrowData,
        bytes32 _escrowType,
        uint256 _version,
        bytes32 _salt,
        uint256 _fundAmount
    ) external payable returns (address escrow);

    /*//////////////////////////////////////////////////////////////
                              ADMIN OPS
    //////////////////////////////////////////////////////////////*/

    /// @notice Add a new implementation for a given type, auto-incrementing version if one exists.
    function addImplementation(bytes32 _type, address _implementation) external;

    /// @notice Set the current version pointer for a given type (must exist).
    function setCurrentVersion(bytes32 _type, uint256 _version) external;

    /*//////////////////////////////////////////////////////////////
                             RESOLUTION RATES
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the caller's resolution rate (denominator for fee calc).
    function updateResolutionRateBPS(
        uint256 _resolutionRateBPS,
        string calldata _details
    ) external;

    /// @notice Read the stored resolution rate via dedicated accessor.
    function resolutionRateOf(
        address _resolver
    ) external view returns (uint256);

    /*//////////////////////////////////////////////////////////////
                                GETTERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Total invoices created so far.
    function invoiceCount() external view returns (uint256);

    /// @notice Fetch an invoice address by sequential index.
    function getInvoiceAddress(uint256 index) external view returns (address);

    /// @notice Convenience getter for an implementation.
    function getImplementation(
        bytes32 _implementationType,
        uint256 _implementationVersion
    ) external view returns (address);

    /// @notice Public mapping getter for implementations[type][version].
    function implementations(
        bytes32 _type,
        uint256 _version
    ) external view returns (address);

    /// @notice Public mapping getter for the current version of a type.
    function currentVersions(bytes32 _type) external view returns (uint256);

    /// @notice Address of the wrapped native token contract used by the factory.
    function WRAPPED_NATIVE_TOKEN() external view returns (IWRAPPED);

    /*//////////////////////////////////////////////////////////////
                               SWEEPERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Rescue ERC20 tokens sent to the factory by mistake.
    function sweepERC20(address token, address to, uint256 amt) external;

    /// @notice Rescue native ETH sent to the factory by mistake.
    function sweepETH(address to) external;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidWrappedNativeToken();
    error ImplementationDoesNotExist();
    error ZeroAddressImplementation();
    error EscrowNotCreated();
    error InvalidFundAmount();
    error ETHNotAccepted();
    error InvalidResolutionRate();
    error UnexpectedETH();
    error InvalidInvoiceIndex();
    error ETHTransferFailed();
    error InvalidEscrow();
    error VersionMismatch();
    error FundAmountMismatch();

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new invoice is created.
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed invoiceAddress,
        uint256[] amounts,
        bytes32 indexed escrowType,
        uint256 version
    );

    /// @notice Emitted when a new implementation is added.
    event AddImplementation(
        bytes32 indexed escrowType,
        uint256 indexed version,
        address implementation
    );

    /// @notice Emitted when a resolver updates their rate.
    event UpdateResolutionRate(
        address indexed resolver,
        uint256 resolutionRateBPS,
        string details
    );

    /// @notice Emitted when an escrow is funded by the factory.
    event InvoiceFunded(
        address indexed escrow,
        address indexed token,
        uint256 amount
    );

    /// @notice Emitted when a new particular version is set as current for an invoice type
    event SetCurrentVersion(bytes32 indexed escrowType, uint256 version);
}
