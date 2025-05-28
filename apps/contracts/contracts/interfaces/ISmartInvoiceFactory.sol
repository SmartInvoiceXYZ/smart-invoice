// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/// @title ISmartInvoiceFactory
/// @notice Interface for the Smart Invoice Factory contract that facilitates creating and managing Smart Invoices.
interface ISmartInvoiceFactory {
    /**
     * @notice Creates a new Smart Invoice with the provided recipient, amounts, and data.
     * @param _recipient The address of the recipient to receive payments.
     * @param _amounts An array of amounts representing payments or milestones.
     * @param _data Additional data needed for initialization, encoded as bytes.
     * @param _type The type of the Smart Invoice to be created.
     * @return The address of the newly created Smart Invoice.
     */
    function create(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type
    ) external returns (address);

    /**
     * @notice Creates a new Smart Invoice deterministically using a salt value.
     * @param _recipient The address of the recipient to receive payments.
     * @param _amounts An array of amounts representing payments or milestones.
     * @param _data Additional data needed for initialization, encoded as bytes.
     * @param _type The type of the Smart Invoice to be created.
     * @param _salt The salt value used for deterministic address calculation.
     * @return The address of the newly created Smart Invoice.
     */
    function createDeterministic(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data,
        bytes32 _type,
        bytes32 _salt
    ) external returns (address);

    /**
     * @notice Predicts the deterministic address of a Smart Invoice to be created with a specific salt.
     * @param _type The type of the Smart Invoice.
     * @param _salt The salt value used for deterministic address calculation.
     * @return The predicted deterministic address of the Smart Invoice.
     */
    function predictDeterministicAddress(
        bytes32 _type,
        bytes32 _salt
    ) external returns (address);

    /**
     * @notice Returns the resolution rate for a specific resolver address.
     * @param _resolver The address of the resolver.
     * @return The resolution rate for the specified resolver.
     */
    function resolutionRateOf(
        address _resolver
    ) external view returns (uint256);

    /// @dev Error definitions for more efficient gas usage.

    /// @notice Reverts when the wrapped native token is invalid.
    error InvalidWrappedNativeToken();

    /// @notice Reverts when the requested implementation does not exist.
    error ImplementationDoesNotExist();

    /// @notice Reverts when the implementation address provided is the zero address.
    error ZeroAddressImplementation();

    /// @notice Emitted when a new invoice is created.
    /// @param invoiceId The ID of the created invoice.
    /// @param invoiceAddress The address of the created invoice.
    /// @param amounts The amounts associated with the invoice.
    /// @param invoiceType The type of the invoice.
    /// @param version The version of the invoice implementation.
    event LogNewInvoice(
        uint256 indexed invoiceId,
        address indexed invoiceAddress,
        uint256[] amounts,
        bytes32 indexed invoiceType,
        uint256 version
    );

    /// @notice Emitted when a new implementation is added.
    /// @param invoiceType The type of the invoice.
    /// @param version The version of the invoice implementation.
    /// @param implementation The address of the new implementation.
    event AddImplementation(
        bytes32 indexed invoiceType,
        uint256 version,
        address implementation
    );

    /// @notice Emitted when the resolution rate is updated.
    /// @param resolver The address of the resolver.
    /// @param resolutionRate The new resolution rate.
    /// @param details Additional details about the update.
    event UpdateResolutionRate(
        address indexed resolver,
        uint256 resolutionRate,
        bytes32 details
    );
}
