// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ISmartInvoice} from "./ISmartInvoice.sol";

/// @title ISmartInvoiceEscrow
/// @notice Interface for Smart Invoice Escrow functionality with customizable milestones, releases, and dispute resolution.
interface ISmartInvoiceEscrow is ISmartInvoice {
    /**
        @notice Returns the address of the token used for payment.
        @return token The address of the token used for payment.
    */
    function token() external view returns (address token);

    /**
     * @notice Adds new milestones to the invoice.
     * @param _milestones An array of milestone amounts to be added.
     */
    function addMilestones(uint256[] calldata _milestones) external;

    /**
     * @notice Adds new milestones to the invoice with additional details.
     * @param _milestones An array of milestone amounts to be added.
     * @param _details Additional details associated with the milestones.
     */
    function addMilestones(
        uint256[] calldata _milestones,
        bytes32 _details
    ) external;

    /**
     * @notice Releases funds for the next milestone.
     */
    function release() external;

    /**
     * @notice Releases funds for a specific milestone.
     * @param _milestone The milestone number to release funds for.
     */
    function release(uint256 _milestone) external;

    /**
     * @notice Releases all tokens of a specified type from the contract.
     * @param _token The address of the token to be released.
     */
    function releaseTokens(address _token) external;

    /**
     * @notice Verifies the client and the contract are correctly paired.
     */
    function verify() external;

    /**
     * @notice Withdraws funds from the contract to the client.
     */
    function withdraw() external;

    /**
     * @notice Withdraws tokens of a specified type from the contract to the client.
     * @param _token The address of the token to be withdrawn.
     */
    function withdrawTokens(address _token) external;

    /**
     * @notice Locks the contract to prevent further actions until resolved.
     * @param _details The details of the dispute or reason for locking.
     */
    function lock(bytes32 _details) external payable;

    /**
     * @notice Resolves a dispute by awarding funds to the client and provider.
     * @param _clientAward The amount to be awarded to the client.
     * @param _providerAward The amount to be awarded to the provider.
     * @param _details Additional details of the resolution.
     */
    function resolve(
        uint256 _clientAward,
        uint256 _providerAward,
        bytes32 _details
    ) external;

    /// @dev Custom errors for more efficient gas usage

    error InvalidProvider();
    error InvalidClient();
    error InvalidResolverType();
    error InvalidResolver();
    error InvalidToken();
    error DurationEnded();
    error DurationTooLong();
    error InvalidResolutionRate();
    error InvalidWrappedNativeToken();
    error NotClient();
    error NotProvider();
    error NotParty();
    error Locked();
    error Terminated();
    error NoMilestones();
    error ExceedsMilestoneLimit();
    error InsufficientBalance();
    error BalanceIsZero();
    error InvalidMilestone();
    error IncorrectDisputeId();
    error InvalidRuling();
    error InvalidIndividualResolver();
    error InvalidArbitratorResolver();
    error NotResolver();
    error ResolutionMismatch();
    error InvalidProviderReceiver();
    error InvalidClientReceiver();

    /// @notice Emitted when new milestones are added to the invoice.
    /// @param sender The address that added the milestones.
    /// @param invoice The address of the invoice.
    /// @param milestones The array of milestone amounts added.
    event MilestonesAdded(
        address indexed sender,
        address indexed invoice,
        uint256[] milestones
    );

    /// @notice Emitted when the details of the invoice are updated.
    /// @param sender The address that updated the details.
    /// @param details The new details of the invoice.
    event DetailsUpdated(address indexed sender, bytes32 details);

    /// @notice Emitted when a deposit is made into the invoice.
    /// @param sender The address that made the deposit.
    /// @param amount The amount of the deposit.
    event Deposit(address indexed sender, uint256 amount);

    /// @notice Emitted when a milestone is released.
    /// @param milestone The milestone number that was released.
    /// @param amount The amount released for the milestone.
    event Release(uint256 milestone, uint256 amount);

    /// @notice Emitted when funds are withdrawn from the invoice.
    /// @param balance The amount withdrawn.
    event Withdraw(uint256 balance);

    /// @notice Emitted when the contract is locked.
    /// @param sender The address that locked the contract.
    /// @param details The details of the lock.
    event Lock(address indexed sender, bytes32 details);

    /// @notice Emitted when a dispute is resolved.
    /// @param resolver The address that resolved the dispute.
    /// @param clientAward The amount awarded to the client.
    /// @param providerAward The amount awarded to the provider.
    /// @param resolutionFee The fee deducted for resolving the dispute.
    /// @param details Additional details of the resolution.
    event Resolve(
        address indexed resolver,
        uint256 clientAward,
        uint256 providerAward,
        uint256 resolutionFee,
        bytes32 details
    );

    /// @notice Emitted when a ruling is made on a dispute.
    /// @param resolver The address that made the ruling.
    /// @param clientAward The amount awarded to the client.
    /// @param providerAward The amount awarded to the provider.
    /// @param ruling The ruling number representing the decision.
    event Rule(
        address indexed resolver,
        uint256 clientAward,
        uint256 providerAward,
        uint256 ruling
    );

    /// @notice Emitted when the client and invoice are verified.
    /// @param client The address of the client.
    /// @param invoice The address of the invoice.
    event Verified(address indexed client, address indexed invoice);

    /// @notice Emitted when the client address is updated.
    /// @param client The new client address.
    event UpdatedClient(address indexed client);

    /// @notice Emitted when the provider address is updated.
    /// @param provider The new provider address.
    event UpdatedProvider(address indexed provider);

    /// @notice Emitted when the provider receiver address is updated.
    /// @param providerReceiver The new provider receiver address.
    event UpdatedProviderReceiver(address indexed providerReceiver);

    /// @notice Emitted when the client receiver address is updated.
    /// @param clientReceiver The new client receiver address.
    event UpdatedClientReceiver(address indexed clientReceiver);
}
