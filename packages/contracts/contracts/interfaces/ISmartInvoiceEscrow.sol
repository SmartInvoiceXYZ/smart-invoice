// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/// @title ISmartInvoiceEscrow
/// @notice Interface for Smart Invoice Escrow functionality with milestone-based payments and dispute resolution
/// @dev Supports both individual and arbitrator-based dispute resolution with customizable fee structures
interface ISmartInvoiceEscrow {
    /// @dev Struct containing all initialization parameters for escrow setup
    struct InitData {
        address client; // Address of the client funding the escrow
        address token; // ERC20 token contract for payments
        uint256 terminationTime; // Timestamp when client can withdraw remaining funds
        bool requireVerification; // Optional off-chain signal for frontends; not enforced in escrow logic.
        address providerReceiver; // Optional custom receiver for provider payments
        address clientReceiver; // Optional custom receiver for client withdrawals
        uint256 feeBPS; // Platform fee in basis points (100 BPS = 1%)
        address treasury; // Address to receive platform fees
        string details; // IPFS hash or details about the project/invoice
        bytes resolverData; // Resolver-specific data
    }

    /**
     * @notice Initializes the escrow contract with provider, milestone amounts, and configuration
     * @param _recipient The address of the service provider who will receive milestone payments
     * @param _amounts Array of milestone amounts (must be non-empty, max 50 milestones)
     * @param _data ABI-encoded InitData struct containing all escrow configuration parameters
     * @dev Can only be called once by the factory contract during escrow creation
     */
    function init(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external;

    /**
     * @notice Returns the ERC20 token contract address used for all payments in this escrow
     * @return The address of the ERC20 token contract
     */
    function token() external view returns (address);

    /**
     * @notice Returns whether the client has been verified for this escrow
     * @return True if the client has been verified (either automatically or manually)
     */
    function verified() external view returns (bool);

    /**
     * @notice Checks if the escrow contract has been fully funded
     * @return True if current balance plus released amount equals or exceeds total milestone amount
     */
    function isFullyFunded() external view returns (bool);

    /**
     * @notice Checks if the escrow has sufficient funds to cover milestones up to a specific milestone
     * @param _milestoneId The milestone index to check funding for (0-based)
     * @return True if current balance plus released amount can cover milestones up to and including _milestoneId
     */
    function isFunded(uint256 _milestoneId) external view returns (bool);

    /**
     * @notice Adds new milestone amounts to the escrow without additional details
     * @param _milestones Array of new milestone amounts to append to existing milestones
     * @dev Only callable by client or provider when contract is not locked or terminated
     */
    function addMilestones(uint256[] calldata _milestones) external;

    /**
     * @notice Adds new milestone amounts to the escrow with additional project details
     * @param _milestones Array of new milestone amounts to append to existing milestones
     * @param _details IPFS hash or description of the new milestones/work scope
     * @dev Only callable by client or provider when contract is not locked or terminated
     */
    function addMilestones(
        uint256[] calldata _milestones,
        string calldata _details
    ) external;

    /**
     * @notice Releases funds for the next pending milestone to the provider
     * @dev Only callable by client when contract has sufficient balance and is not locked
     */
    function release() external;

    /**
     * @notice Releases funds for a specific milestone to the provider
     * @param _milestone The milestone index to release (must be current or future milestone)
     * @dev Only callable by client when contract has sufficient balance and is not locked
     */
    function release(uint256 _milestone) external;

    /**
     * @notice Releases all tokens of a specified type to the provider (for non-escrow tokens)
     * @param _token The address of the token contract to release
     * @dev Used to release tokens that were sent to the contract by mistake or as bonuses
     */
    function releaseTokens(address _token) external;

    /**
     * @notice Client can optionally mark the invoice as verified for off-chain tracking
     * @dev This is informational only for off-chain consumers; it does not restrict releases
     */
    function verify() external;

    /**
     * @notice Withdraws remaining escrow funds to the client after termination time
     * @dev Only callable after terminationTime has passed and contract is not locked
     */
    function withdraw() external;

    /**
     * @notice Withdraws tokens of a specified type to the client after termination
     * @param _token The address of the token contract to withdraw
     * @dev Only callable after terminationTime, used for non-escrow tokens
     */
    function withdrawTokens(address _token) external;

    /**
     * @notice Locks the contract to initiate dispute resolution process
     * @param _details IPFS hash or description of the dispute and issues
     * @dev Callable by client or provider, may require arbitration fee for arbitrator disputes
     */
    function lock(string calldata _details) external payable;

    /// @dev Custom errors for more efficient gas usage

    error InvalidProvider();
    error InvalidClient();
    error InvalidResolverType();
    error InvalidResolverData();
    error InvalidResolver();
    error InvalidToken();
    error DurationEnded();
    error DurationTooLong();
    error InvalidResolutionRate();
    error InvalidWrappedETH();
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
    error NotResolver(address caller);
    error ResolutionMismatch();
    error InvalidProviderReceiver();
    error InvalidClientReceiver();
    error InvalidFeeBPS();
    error InvalidTreasury();
    error AppealPeriodNotStarted();
    error AppealPeriodEnded();
    error AppealFeeAlreadyPaid();
    error DisputeAlreadyRuled();
    error DisputeNotRuled();

    /// @notice Emitted when the escrow contract is successfully initialized
    /// @param provider The address of the service provider
    /// @param client The address of the client funding the escrow
    /// @param amounts Array of milestone amounts for this escrow
    /// @param details IPFS hash or description of the project/work scope
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

    /// @notice Emitted when stray ETH sent to the contract is wrapped to WETH
    /// @param amount The amount of ETH that was wrapped to WETH
    event WrappedStrayETH(uint256 amount);

    /// @notice Emitted when a milestone is released.
    /// @param milestone The milestone number that was released.
    /// @param amount The amount released for the milestone.
    event Release(uint256 milestone, uint256 amount);

    /// @notice Emitted when funds are released after all milestones have been released.
    /// @param amount The amount released.
    event ReleaseRemainder(uint256 amount);

    /// @notice Emitted when funds are withdrawn from the invoice.
    /// @param balance The amount withdrawn.
    event Withdraw(uint256 balance);

    /// @notice Emitted when the contract is locked.
    /// @param sender The address that locked the contract.
    /// @param details The details of the lock.
    event Lock(address indexed sender, string details);

    /// @notice Emitted when a dispute is resolved by an individual resolver
    /// @param resolver The address of the individual resolver
    /// @param clientAward The amount awarded to the client
    /// @param providerAward The amount awarded to the provider
    /// @param resolutionFee The fee paid to the resolver (in token units)
    /// @param details IPFS hash or description of the resolution reasoning
    event Resolve(
        address indexed resolver,
        uint256 clientAward,
        uint256 providerAward,
        uint256 resolutionFee,
        string details
    );

    /// @notice Emitted when a ruling is made by an arbitrator resolver
    /// @param resolver The address of the arbitrator
    /// @param clientAward The amount awarded to the client
    /// @param providerAward The amount awarded to the provider
    /// @param ruling The ruling number (0=refused/split, 1=client wins, 2=provider wins)
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

    /// @notice Emitted when platform fees are transferred to the treasury
    /// @param token The address of the token used for fee payment
    /// @param amount The amount of fees transferred (in token units)
    /// @param treasury The address of the treasury receiving the platform fees
    event FeeTransferred(
        address indexed token,
        uint256 amount,
        address indexed treasury
    );
}
