// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity 0.8.30;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {IArbitrable} from "@kleros/erc-792/contracts/IArbitrable.sol";
import {IArbitrator} from "@kleros/erc-792/contracts/IArbitrator.sol";
import {IEvidence} from "@kleros/erc-792/contracts/erc-1497/IEvidence.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SmartInvoiceEscrow
/// @notice A comprehensive escrow contract with milestone-based payments, dispute resolution, and updatable addresses
/// @dev Supports both individual and arbitrator-based dispute resolution with customizable fee structures
contract SmartInvoiceEscrow is
    ISmartInvoiceEscrow,
    IArbitrable,
    IEvidence,
    Initializable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    enum ADR {
        INDIVIDUAL,
        ARBITRATOR
    }

    /// @notice Contract version identifier
    string public constant VERSION = "3.0.0";

    /// @notice Number of ruling options available to arbitrators (client wins or provider wins)
    uint256 public constant NUM_RULING_OPTIONS = 2;

    /// @notice Maximum allowed termination time (730 days from contract creation)
    uint256 public constant MAX_TERMINATION_TIME = 730 days;

    /// @notice Maximum number of milestones allowed per contract
    uint256 public constant MAX_MILESTONE_LIMIT = 50;

    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Wrapped native token contract for handling ETH deposits
    IWRAPPED public immutable WRAPPED_NATIVE_TOKEN;

    /// @notice Factory contract that deployed this escrow instance
    ISmartInvoiceFactory public immutable FACTORY;

    /// @notice Address of the client who can release funds and receives refunds
    address public client;
    /// @notice Address of the service provider who receives milestone payments
    address public provider;
    /// @notice Optional address to receive provider payments (defaults to provider if not set)
    address public providerReceiver;
    /// @notice Optional address to receive client refunds (defaults to client if not set)
    address public clientReceiver;
    /// @notice Type of dispute resolution mechanism (INDIVIDUAL or ARBITRATOR)
    ADR public resolverType;
    /// @notice Address of the dispute resolver (individual or arbitrator contract)
    address public resolver;
    /// @notice ERC20 token used for payments in this escrow
    address public token;
    /// @notice Timestamp after which client can withdraw remaining funds
    uint256 public terminationTime;
    /// @notice Resolution fee rate in basis points (BPS) charged by individual resolvers
    uint256 public resolutionRateBPS;

    /// @notice Platform fee rate in basis points (100 BPS = 1%)
    uint256 public feeBPS;
    /// @notice Treasury address that receives platform fees
    address public treasury;

    /// @notice Array of milestone payment amounts
    uint256[] public amounts;
    /// @notice Total amount across all milestones
    uint256 public total = 0;
    /// @notice Whether the contract is locked due to an active dispute
    bool public locked;
    /// @notice Off-chain signal that the client has verified control of this address.
    /// @dev Informational only; does not affect permissions or fund flow.
    bool public verified;
    /// @notice Current milestone index (0 to amounts.length)
    uint256 public milestone = 0;
    /// @notice Total amount released to provider so far
    uint256 public released = 0;
    /// @notice Current dispute ID when using arbitrator resolution
    uint256 public disputeId;

    /// @notice Latest MetaEvidence identifier for this escrow (ERC-1497)
    /// @dev Advances when off-chain details change (e.g., via _addMilestones),
    ///      and the current value is referenced by new Disputes
    uint256 public metaEvidenceId;
    /// @notice Per-dispute Evidence group identifier (ERC-1497)
    /// @dev Incremented *before* opening a new dispute so both Dispute and
    ///      subsequent Evidence events for that dispute share the same group
    uint256 public evidenceGroupId;

    /// @notice Initializes the contract with wrapped native token and factory addresses
    /// @param _wrappedNativeToken The address of the wrapped native token contract
    /// @param _factory The address of the SmartInvoiceFactory contract
    constructor(address _wrappedNativeToken, address _factory) {
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();
        if (_factory == address(0)) revert InvalidFactory();
        WRAPPED_NATIVE_TOKEN = IWRAPPED(_wrappedNativeToken);
        FACTORY = ISmartInvoiceFactory(_factory);
        _disableInitializers();
    }

    /**
     * @notice Initializes the escrow contract with provider, milestone amounts, and configuration data
     * @dev Can only be called once by the factory contract. Validates all parameters and sets up the escrow
     * @param _provider The address of the service provider receiving payments
     * @param _amounts Array of milestone amounts (must be non-empty, max 50 milestones)
     * @param _data ABI-encoded InitData struct containing client, resolver, token, and other configuration
     */
    function init(
        address _provider,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external virtual override initializer {
        if (msg.sender != address(FACTORY)) revert OnlyFactory();

        _handleData(_provider, _amounts, _data);
    }

    /**
     * @dev Internal function to decode initialization data and set contract state
     * @param _provider The address of the service provider
     * @param _amounts Array of milestone amounts to validate and store
     * @param _data ABI-encoded InitData containing all escrow configuration parameters
     * @dev IMPORTANT: The token MUST be a standard ERC20 token
     *      Fee-on-transfer, rebasing, or ERC777 tokens may break the contract functionality
     *      Resolution rate is fetched from the factory and must not exceed 1000 BPS (10%)
     */
    function _handleData(
        address _provider,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) internal virtual {
        if (_provider == address(0)) revert InvalidProvider();
        provider = _provider;
        amounts = _amounts;
        uint256 _total = 0;
        uint256 amountsLength = amounts.length;
        if (amountsLength == 0) revert NoMilestones();
        if (amountsLength > MAX_MILESTONE_LIMIT) revert ExceedsMilestoneLimit();
        for (uint256 i = 0; i < amountsLength; ) {
            _total += amounts[i];
            unchecked {
                ++i;
            }
        }
        total = _total;

        InitData memory initData = abi.decode(_data, (InitData));

        uint256 _resolutionRateBPS = FACTORY.resolutionRateOf(
            initData.resolver
        );
        if (_resolutionRateBPS > 1000) revert InvalidResolutionRate();
        if (initData.client == address(0)) revert InvalidClient();
        if (initData.resolverType > uint8(ADR.ARBITRATOR))
            revert InvalidResolverType();
        if (initData.resolver == address(0)) revert InvalidResolver();
        if (initData.token == address(0)) revert InvalidToken();
        if (initData.token.code.length == 0) revert InvalidToken();
        if (initData.terminationTime <= block.timestamp) revert DurationEnded();
        if (initData.terminationTime > block.timestamp + MAX_TERMINATION_TIME)
            revert DurationTooLong();
        if (initData.feeBPS > 1000) revert InvalidFeeBPS(); // max 10% (1000/10000)
        if (initData.feeBPS > 0 && initData.treasury == address(0))
            revert InvalidTreasury();
        if (initData.providerReceiver == address(this))
            revert InvalidProviderReceiver();
        if (initData.clientReceiver == address(this))
            revert InvalidClientReceiver();

        client = initData.client;
        resolverType = ADR(initData.resolverType);
        resolver = initData.resolver;
        token = initData.token;
        terminationTime = initData.terminationTime;
        resolutionRateBPS = _resolutionRateBPS;
        providerReceiver = initData.providerReceiver;
        clientReceiver = initData.clientReceiver;
        feeBPS = initData.feeBPS;
        treasury = initData.treasury;

        if (!initData.requireVerification) {
            verified = true;
            emit Verified(client, address(this));
        }

        emit InvoiceInit(provider, client, amounts, initData.details);
        emit MetaEvidence(metaEvidenceId, initData.details);
    }

    /**
     * @notice Mark the client as verified for off-chain consumers.
     * @dev Does not affect release/withdraw permissions.
     */
    function verify() external override {
        if (msg.sender != client) revert NotClient(msg.sender);
        verified = true;
        emit Verified(client, address(this));
    }

    /**
     * @dev Internal helper to automatically verify the client if not already verified
     *      Called by release methods to ensure verification event is emitted when client takes action
     */
    function _autoVerify() internal {
        if (!verified && msg.sender == client) {
            verified = true;
            emit Verified(client, address(this));
        }
    }

    /**
     * @notice Updates the client address
     * @param _client The new client address (cannot be zero address)
     * @dev Only callable by current client when contract is not locked
     */
    function updateClient(address _client) external {
        if (msg.sender != client) revert NotClient(msg.sender);
        if (_client == address(0)) revert InvalidClient();
        if (locked) revert Locked();

        client = _client;
        emit UpdatedClient(_client);
    }

    /**
     * @notice Updates the provider address
     * @param _provider The new provider address (cannot be zero address)
     * @dev Only callable by current provider when contract is not locked
     */
    function updateProvider(address _provider) external {
        if (msg.sender != provider) revert NotProvider(msg.sender);
        if (_provider == address(0)) revert InvalidProvider();
        if (locked) revert Locked();

        provider = _provider;
        emit UpdatedProvider(_provider);
    }

    /**
     * @notice Updates the provider's receiver address for milestone payments
     * @param _providerReceiver The new receiver address (cannot be zero or this contract)
     * @dev Only callable by current provider when contract is not locked
     */
    function updateProviderReceiver(address _providerReceiver) external {
        if (msg.sender != provider) revert NotProvider(msg.sender);
        if (
            _providerReceiver == address(0) ||
            _providerReceiver == address(this)
        ) revert InvalidProviderReceiver();
        if (locked) revert Locked();

        providerReceiver = _providerReceiver;
        emit UpdatedProviderReceiver(_providerReceiver);
    }

    /**
     * @notice Updates the client's receiver address for withdrawal payments
     * @param _clientReceiver The new receiver address (cannot be zero or this contract)
     * @dev Only callable by current client when contract is not locked
     */
    function updateClientReceiver(address _clientReceiver) external {
        if (msg.sender != client) revert NotClient(msg.sender);
        if (_clientReceiver == address(0) || _clientReceiver == address(this))
            revert InvalidClientReceiver();
        if (locked) revert Locked();

        clientReceiver = _clientReceiver;
        emit UpdatedClientReceiver(_clientReceiver);
    }

    /**
     * @notice Adds new milestone amounts to the escrow without additional details
     * @param _milestones Array of new milestone amounts to add
     * @dev Only callable by client or provider when contract is not locked and not terminated
     * @dev Total milestones cannot exceed MAX_MILESTONE_LIMIT (50)
     */
    function addMilestones(uint256[] calldata _milestones) external override {
        _addMilestones(_milestones, "");
    }

    /**
     * @notice Adds milestones with extra details.
     * @param _milestones The array of new milestones to be added
     * @param _details Additional details for the milestones
     */
    function addMilestones(
        uint256[] calldata _milestones,
        string calldata _details
    ) external override {
        _addMilestones(_milestones, _details);
    }

    /**
     * @dev Internal function to add milestones and update the contract state.
     * @param _milestones The array of new milestones to be added
     * @param _details Additional details for the milestones
     */
    function _addMilestones(
        uint256[] calldata _milestones,
        string memory _details
    ) internal {
        if (locked) revert Locked();
        if (block.timestamp >= terminationTime) revert Terminated();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);
        if (_milestones.length == 0) revert NoMilestones();

        uint256 newLength = amounts.length + _milestones.length;
        if (newLength > MAX_MILESTONE_LIMIT) revert ExceedsMilestoneLimit();

        uint256 newTotal = total;
        for (uint256 i = 0; i < _milestones.length; ) {
            amounts.push(_milestones[i]);
            newTotal += _milestones[i];
            unchecked {
                ++i;
            }
        }

        total = newTotal;

        if (bytes(_details).length > 0) {
            emit DetailsUpdated(msg.sender, _details);
            metaEvidenceId = metaEvidenceId + 1;
            emit MetaEvidence(metaEvidenceId, _details);
        }

        emit MilestonesAdded(msg.sender, address(this), _milestones);
    }

    /**
     * @notice Returns the amounts associated with the milestones.
     * @return An array of amounts for each milestone
     */
    function getAmounts() public view returns (uint256[] memory) {
        return amounts;
    }

    /**
     * @notice Checks if the escrow contract has been fully funded
     * @return True if current balance plus released amount equals or exceeds total milestone amount
     * @dev Useful for determining if the contract has sufficient funds for all milestones
     */
    function isFullyFunded() external view returns (bool) {
        return IERC20(token).balanceOf(address(this)) + released >= total;
    }

    /**
     * @notice Checks if the escrow has sufficient funds to cover milestones up to a specific milestone
     * @param _milestoneId The milestone index to check funding for (0-based)
     * @return True if current balance plus released amount can cover milestones up to and including _milestoneId
     * @dev Reverts if milestoneId is out of bounds
     */
    function isFunded(uint256 _milestoneId) external view returns (bool) {
        if (_milestoneId >= amounts.length) revert InvalidMilestone();

        uint256 requiredAmount = released;
        for (uint256 i = milestone; i <= _milestoneId; i++) {
            requiredAmount += amounts[i];
        }

        return
            IERC20(token).balanceOf(address(this)) + released >= requiredAmount;
    }

    /**
     * @dev Internal function to release funds from the contract to the provider
     *      Releases the current milestone amount or remaining balance if last milestone
     */
    function _release() internal virtual {
        if (locked) revert Locked();
        if (msg.sender != client) revert NotClient(msg.sender);
        if (block.timestamp > terminationTime) revert Terminated();

        _autoVerify();

        uint256 currentMilestone = milestone;
        uint256 balance = IERC20(token).balanceOf(address(this));

        if (currentMilestone < amounts.length) {
            uint256 amount = amounts[currentMilestone];
            // For the last milestone, release all remaining balance if it exceeds the milestone amount
            if (currentMilestone == amounts.length - 1 && amount < balance) {
                amount = balance;
            }
            if (balance < amount) revert InsufficientBalance();

            milestone = milestone + 1;
            _transferPayment(token, amount);
            released = released + amount;
            emit Release(currentMilestone, amount);
        } else {
            // All milestones completed, release any remaining balance
            if (balance == 0) revert BalanceIsZero();

            _transferPayment(token, balance);
            released = released + balance;
            emit ReleaseRemainder(balance);
        }
    }

    /**
     * @notice External function to release funds from the contract to the provider
     *         Uses the internal `_release` function to perform the actual release
     */
    function release() external virtual override nonReentrant {
        return _release();
    }

    /**
     * @notice External function to release funds from the contract to the provider up to a certain milestone
     * @param _milestone The milestone index to release funds to (inclusive)
     */
    function release(
        uint256 _milestone
    ) external virtual override nonReentrant {
        if (locked) revert Locked();
        if (msg.sender != client) revert NotClient(msg.sender);
        if (_milestone < milestone) revert InvalidMilestone();
        if (_milestone >= amounts.length) revert InvalidMilestone();

        _autoVerify();

        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 amount = 0;
        // Calculate total amount to release from current milestone to target milestone
        for (uint256 j = milestone; j <= _milestone; j++) {
            // For the last milestone, release all remaining balance if it exceeds cumulative amount
            if (j == amounts.length - 1 && amount + amounts[j] < balance) {
                emit Release(j, balance - amount);
                amount = balance;
            } else {
                emit Release(j, amounts[j]);
                amount = amount + amounts[j];
            }
        }
        if (balance < amount) revert InsufficientBalance();

        _transferPayment(token, amount);
        released = released + amount;
        milestone = _milestone + 1;
    }

    /**
     * @notice External function to release tokens from the contract to the provider
     *         For the main token, uses internal `_release` function; for other tokens, releases entire balance
     * @param _token The token address to release funds from
     */
    function releaseTokens(
        address _token
    ) external virtual override nonReentrant {
        if (_token == token) {
            _release();
        } else {
            if (locked) revert Locked();
            if (msg.sender != client) revert NotClient(msg.sender);
            if (block.timestamp > terminationTime) revert Terminated();

            _autoVerify();

            uint256 balance = IERC20(_token).balanceOf(address(this));
            if (balance == 0) revert BalanceIsZero();

            _transferPayment(_token, balance);
        }
    }

    /**
     * @dev Internal function to withdraw funds from the contract to the client
     *      Can only be called after termination time has passed
     */
    function _withdraw() internal {
        if (locked) revert Locked();
        if (block.timestamp <= terminationTime) revert NotTerminated();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();

        _withdrawDeposit(token, balance);
        milestone = amounts.length;

        emit Withdraw(balance);
    }

    /**
     * @notice External function to withdraw funds from the contract to the client
     *         Uses the internal `_withdraw` function to perform the actual withdrawal
     */
    function withdraw() external override nonReentrant {
        return _withdraw();
    }

    /**
     * @notice External function to withdraw tokens from the contract to the client
     *         For the main token, uses internal `_withdraw` function; for other tokens, withdraws entire balance
     * @param _token The token address to withdraw
     */
    function withdrawTokens(address _token) external override nonReentrant {
        if (_token == token) {
            _withdraw();
        } else {
            if (locked) revert Locked();
            if (block.timestamp <= terminationTime) revert NotTerminated();
            uint256 balance = IERC20(_token).balanceOf(address(this));
            if (balance == 0) revert BalanceIsZero();

            _withdrawDeposit(_token, balance);
        }
    }

    /**
     * @notice External function to lock the contract and initiate dispute resolution
     *         Can only be called by client or provider before termination
     * @param _disputeURI Extra data for the arbitrator
     */
    function lock(
        string calldata _disputeURI
    ) external payable override nonReentrant {
        if (locked) revert Locked();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        if (block.timestamp >= terminationTime) revert Terminated();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);

        locked = true;

        if (resolverType == ADR.ARBITRATOR) {
            // Note: user must call `IArbitrator(resolver).arbitrationCost(_disputeURI)` to get the arbitration cost

            // Ensure each dispute has its own evidence group id
            unchecked {
                ++evidenceGroupId;
            }

            disputeId = IArbitrator(resolver).createDispute{value: msg.value}(
                NUM_RULING_OPTIONS,
                bytes(_disputeURI)
            );

            emit Dispute(
                IArbitrator(resolver),
                disputeId,
                metaEvidenceId,
                evidenceGroupId
            );
        }

        emit Lock(msg.sender, _disputeURI);
    }

    /**
     * @notice External function to appeal a dispute
     *         Can only be called by client or provider when contract is locked with arbitrator resolver
     * @param _appealURI Extra data for the arbitrator
     */
    function appeal(string calldata _appealURI) external payable nonReentrant {
        if (resolverType != ADR.ARBITRATOR)
            revert InvalidArbitratorResolver(resolver);
        if (!locked) revert NotLocked();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);

        // Note: user must call `IArbitrator(resolver).appealCost(disputeId, _appealURI)` to get the appeal cost
        IArbitrator(resolver).appeal{value: msg.value}(
            disputeId,
            bytes(_appealURI)
        );

        emit DisputeAppealed(msg.sender, _appealURI);
    }

    /**
     * @notice External function to submit evidence for a dispute
     *         Can only be called by client or provider when contract is locked with arbitrator resolver
     * @param _evidenceURI Extra data for the arbitrator
     */
    function submitEvidence(
        string calldata _evidenceURI
    ) external nonReentrant {
        if (resolverType != ADR.ARBITRATOR)
            revert InvalidArbitratorResolver(resolver);
        if (!locked) revert NotLocked();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);

        // Evidence submitted here is associated with the most recently opened dispute,
        // via the current evidenceGroupId (incremented in lock())
        emit Evidence(
            IArbitrator(resolver),
            evidenceGroupId,
            msg.sender,
            _evidenceURI
        );
    }

    /**
     * @notice Resolves a dispute through individual resolver with specified award amounts
     * @param _clientAward Amount to be awarded to the client
     * @param _providerAward Amount to be awarded to the provider
     * @param _resolutionURI URI containing details and reasoning for the resolution
     * @dev Only callable by individual resolver when contract is locked
     * @dev Total awards plus resolution fee must equal contract balance
     * @dev Resolution fee is calculated as (balance * resolutionRateBPS) / 10000
     */
    function resolve(
        uint256 _clientAward,
        uint256 _providerAward,
        string calldata _resolutionURI
    ) external virtual override nonReentrant {
        if (resolverType != ADR.INDIVIDUAL)
            revert InvalidIndividualResolver(resolver);
        if (!locked) revert NotLocked();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        if (msg.sender != resolver) revert NotResolver(msg.sender);

        uint256 resolutionFee = (balance * resolutionRateBPS) / BPS_DENOMINATOR;

        // Ensure awards plus resolution fee equals total balance
        if (_clientAward + _providerAward != balance - resolutionFee)
            revert ResolutionMismatch();

        if (_providerAward > 0) {
            _transferPayment(token, _providerAward);
        }
        if (_clientAward > 0) {
            _withdrawDeposit(token, _clientAward);
        }
        if (resolutionFee > 0) {
            IERC20(token).safeTransfer(resolver, resolutionFee);
        }

        // Complete all milestones
        milestone = amounts.length;

        // Reset locked state
        locked = false;

        emit Resolve(
            msg.sender,
            _clientAward,
            _providerAward,
            resolutionFee,
            _resolutionURI
        );
    }

    /**
     * @notice Rules on a dispute through arbitrator resolver with predefined award distribution
     * @param _disputeId The ID of the dispute being ruled on (must match current disputeId)
     * @param _ruling The arbitrator's ruling (0=refused/split, 1=client wins, 2=provider wins)
     * @dev Only callable by arbitrator resolver when contract is locked
     * @dev Awards are distributed based on predefined ruling ratios
     * @dev No resolution fee is charged for arbitrator rulings
     */
    function rule(
        uint256 _disputeId,
        uint256 _ruling
    ) external virtual override nonReentrant {
        if (resolverType != ADR.ARBITRATOR)
            revert InvalidArbitratorResolver(resolver);
        if (!locked) revert NotLocked();
        if (msg.sender != resolver) revert NotResolver(msg.sender);
        if (_disputeId != disputeId) revert IncorrectDisputeId();
        if (_ruling > NUM_RULING_OPTIONS) revert InvalidRuling(_ruling);
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();

        uint8[2] memory ruling = _getRuling(_ruling);
        uint8 clientShare = ruling[0];
        uint8 providerShare = ruling[1];
        uint8 denom = clientShare + providerShare;
        uint256 providerAward = (balance * providerShare) / denom;
        uint256 clientAward = balance - providerAward;

        if (providerAward > 0) {
            _transferPayment(token, providerAward);
        }
        if (clientAward > 0) {
            _withdrawDeposit(token, clientAward);
        }

        // Complete all milestones
        milestone = amounts.length;

        // Reset locked state
        locked = false;

        emit Rule(resolver, clientAward, providerAward, _ruling);
        emit Ruling(IArbitrator(resolver), _disputeId, _ruling);
    }

    /**
     * @dev Internal function to get the ruling distribution based on arbitrator decision
     * @param _ruling The ruling of the arbitrator (0=refused, 1=client wins, 2=provider wins)
     * @return ruling Array containing [clientShare, providerShare] proportions
     */
    function _getRuling(
        uint256 _ruling
    ) internal pure returns (uint8[2] memory ruling) {
        uint8[2][3] memory rulings = [
            [1, 1], // 0 = refused to arbitrate => 50% to client, 50% to provider
            [1, 0], // 1 = 100% to client, 0% to provider
            [0, 1] // 2 = 0% to client, 100% to provider
        ];
        ruling = rulings[_ruling];
    }

    /**
     * @dev Internal function to transfer payment to the provider or provider receiver
     *      Deducts fee if configured and transfers to treasury
     * @param _token The token to transfer
     * @param _amount The amount to transfer
     */
    function _transferPayment(
        address _token,
        uint256 _amount
    ) internal virtual {
        address recipient = providerReceiver != address(0)
            ? providerReceiver
            : provider;

        if (feeBPS > 0 && treasury != address(0)) {
            uint256 feeAmount = (_amount * feeBPS) / BPS_DENOMINATOR;
            uint256 netAmount = _amount - feeAmount;

            IERC20(_token).safeTransfer(treasury, feeAmount);
            IERC20(_token).safeTransfer(recipient, netAmount);

            emit FeeTransferred(_token, feeAmount, treasury);
        } else {
            IERC20(_token).safeTransfer(recipient, _amount);
        }
    }

    /**
     * @dev Internal function to withdraw deposit to the client or client receiver
     *      Deducts fee if configured and transfers to treasury
     * @param _token The token to withdraw
     * @param _amount The amount to withdraw
     */
    function _withdrawDeposit(
        address _token,
        uint256 _amount
    ) internal virtual {
        address recipient = clientReceiver != address(0)
            ? clientReceiver
            : client;

        if (feeBPS > 0 && treasury != address(0)) {
            uint256 feeAmount = (_amount * feeBPS) / BPS_DENOMINATOR;
            uint256 netAmount = _amount - feeAmount;

            IERC20(_token).safeTransfer(treasury, feeAmount);
            IERC20(_token).safeTransfer(recipient, netAmount);

            emit FeeTransferred(_token, feeAmount, treasury);
        } else {
            IERC20(_token).safeTransfer(recipient, _amount);
        }
    }

    /**
     * @notice Receives ETH transfers and wraps them as WETH
     *         Only accepts ETH if the token is WETH and contract is not locked
     */
    // solhint-disable-next-line no-complex-fallback
    receive() external payable nonReentrant {
        if (locked) revert Locked();
        if (token != address(WRAPPED_NATIVE_TOKEN))
            revert InvalidWrappedNativeToken();
        WRAPPED_NATIVE_TOKEN.deposit{value: msg.value}();
        emit Deposit(msg.sender, msg.value, token);
    }

    /**
     * @notice Wraps any ETH balance in the contract to WETH
     *         Handles edge cases when ETH was sent via self-destruct
     */
    function wrapETH() external nonReentrant {
        if (locked) revert Locked();
        uint256 bal = address(this).balance;
        if (bal == 0) revert BalanceIsZero();
        WRAPPED_NATIVE_TOKEN.deposit{value: bal}();
        emit WrappedStrayETH(bal);
        if (token == address(WRAPPED_NATIVE_TOKEN)) {
            // Log address(this) as depositor since it was obtained via self-destruct
            emit Deposit(address(this), bal, token);
        }
        // Handle release of WETH as per `releaseTokens` or `withdrawTokens` as needed
    }
}
