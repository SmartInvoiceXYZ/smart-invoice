// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/// @title ISmartInvoiceEscrow
/// @notice Interface for Smart Invoice Escrow functionality with customizable milestones, releases, and dispute resolution.
interface ISmartInvoiceEscrow {
    /// @dev Struct for storing initialization data.
    struct InitData {
        address client;
        uint8 resolverType;
        address resolver;
        address token;
        uint256 terminationTime;
        bool requireVerification;
        address providerReceiver;
        address clientReceiver;
        uint256 feeBPS;
        address treasury;
        string details;
    }

    /**
     * @notice Initializes the Smart Invoice with the provided recipient, amounts, and data.
     * @param _recipient The address of the recipient to receive payments.
     * @param _amounts An array of amounts representing payments or milestones.
     * @param _data Additional data needed for initialization, encoded as bytes.
     */
    function init(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external;

    /**
        @notice Returns the address of the token used for payment.
        @return The address of the token used for payment.
    */
    function token() external view returns (address);

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
        string calldata _details
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
    function lock(string calldata _details) external payable;

    /**
     * @notice Resolves a dispute by awarding funds to the client and provider.
     * @param _clientAward The amount to be awarded to the client.
     * @param _providerAward The amount to be awarded to the provider.
     * @param _details Additional details of the resolution.
     */
    function resolve(
        uint256 _clientAward,
        uint256 _providerAward,
        string calldata _details
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
    error OnlyFactory();
    error InvalidFactory();
    error NotClient(address caller);
    error NotProvider(address caller);
    error NotParty(address caller);
    error Locked();
    error NotLocked();
    error Terminated();
    error NotTerminated();
    error NoMilestones();
    error ExceedsMilestoneLimit();
    error InsufficientBalance();
    error BalanceIsZero();
    error InvalidMilestone();
    error IncorrectDisputeId();
    error InvalidRuling(uint256 ruling);
    error InvalidIndividualResolver(address resolver);
    error InvalidArbitratorResolver(address resolver);
    error NotResolver(address caller);
    error ResolutionMismatch();
    error InvalidProviderReceiver();
    error InvalidClientReceiver();
    error InvalidFeeBPS();
    error InvalidTreasury();

    /// @notice Emitted when a the invoice is initialized.
    /// @param provider The address of the provider.
    /// @param client The address of the client.
    /// @param amounts The amounts of the invoice.
    /// @param details The details of the invoice.
    event InvoiceInit(
        address indexed provider,
        address indexed client,
        uint256[] amounts,
        string details
    );

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
    event DetailsUpdated(address indexed sender, string details);

    /// @notice Emitted when a deposit is made into the invoice.
    /// @param sender The address that made the deposit.
    /// @param amount The amount of the deposit.
    /// @param token The token that was deposited.
    event Deposit(address indexed sender, uint256 amount, address token);

    /// @notice Emitted when stray eth is wrapped.
    /// @param amount The amount of eth wrapped.
    event WrappedStrayETH(uint256 amount);

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
    event Lock(address indexed sender, string details);

    /// @notice Emitted when the dispute is appealed.
    /// @param sender The address that appealed the dispute.
    /// @param details The details of the appeal.
    event DisputeAppealed(address indexed sender, string details);

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
        string details
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

    /// @notice Emitted when a fee is transferred to the treasury.
    /// @param token The address of the token transferred as fee.
    /// @param amount The amount of fee transferred.
    /// @param treasury The address of the treasury receiving the fee.
    event FeeTransferred(
        address indexed token,
        uint256 amount,
        address indexed treasury
    );
}
