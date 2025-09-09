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
import {
    ISmartInvoiceEscrow
} from "contracts/interfaces/ISmartInvoiceEscrow.sol";
import {
    ISmartInvoiceFactory
} from "contracts/interfaces/ISmartInvoiceFactory.sol";
import {IWRAPPED} from "contracts/interfaces/IWRAPPED.sol";
import {SignatureDecoder} from "../libraries/SignatureDecoder.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title SmartInvoiceEscrowCore
/// @notice A comprehensive core escrow contract with milestone-based payments and updatable addresses
abstract contract SmartInvoiceEscrowCore is
    ISmartInvoiceEscrow,
    Initializable,
    ReentrancyGuard,
    EIP712
{
    using SafeERC20 for IERC20;

    /// @notice Maximum allowed termination time (2 years from contract creation)
    uint256 public constant MAX_TERMINATION_TIME = 730 days;

    /// @notice Maximum number of milestones allowed per contract
    uint256 public constant MAX_MILESTONE_LIMIT = 50;

    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Wrapped ETH contract for handling ETH deposits
    IWRAPPED public immutable WRAPPED_ETH;

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
    /// @notice ERC20 token used for payments in this escrow
    address public token;
    /// @notice Timestamp after which client can withdraw remaining funds
    uint256 public terminationTime;

    /// @notice Platform fee rate in basis points (100 BPS = 1%)
    uint256 public feeBPS;
    /// @notice Treasury address that receives platform fees
    address public treasury;

    /// @notice Array of milestone payment amounts
    uint256[] public amounts;
    /// @notice Total amount across all milestones
    uint256 public total;
    /// @notice Whether the contract is locked due to an active dispute
    bool public locked;
    /// @notice Off-chain signal that the client has verified control of this address.
    /// @dev Informational only; does not affect permissions or fund flow.
    bool public verified;
    /// @notice Current milestone index (0 to amounts.length)
    uint256 public milestone;
    /// @notice Total amount released to provider so far
    uint256 public released;
    /// @notice Mapping of approved hashes for client and provider
    mapping(address => mapping(bytes32 => bool)) public approvedHashes;

    /// @notice Hash of unlock data struct for eip712 signature
    bytes32 public constant UNLOCK_HASH =
        keccak256("Unlock(uint256 refundBPS,string unlockURI)");

    constructor(address _wrappedETH, address _factory) {
        if (_wrappedETH == address(0)) revert InvalidWrappedETH();
        if (_factory == address(0)) revert InvalidFactory();
        WRAPPED_ETH = IWRAPPED(_wrappedETH);
        FACTORY = ISmartInvoiceFactory(_factory);
        _disableInitializers();
    }

    /**
     * @notice Initializes the escrow contract with provider, milestone amounts, and configuration data
     * @dev Can only be called once by the factory contract. Validates all parameters and sets up the escrow
     * @param _provider The address of the service provider receiving payments
     * @param _amounts Array of milestone amounts (must be non-empty, max 50 milestones)
     * @param _data ABI-encoded InitData struct containing client, token, and other configuration
     */
    function init(
        address _provider,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external virtual override initializer {
        if (msg.sender != address(FACTORY)) revert OnlyFactory();

        InitData memory initData = abi.decode(_data, (InitData));
        _handleData(_provider, _amounts, initData);
    }

    /**
     * @dev Internal function to decode initialization data and set contract state
     * @param _provider The address of the service provider
     * @param _amounts Array of milestone amounts to validate and store
     * @param _data InitData containing all escrow configuration parameters
     * @dev IMPORTANT: The token MUST be a standard ERC20 token
     *      Fee-on-transfer, rebasing, or ERC777 tokens may break the contract functionality
     */
    function _handleData(
        address _provider,
        uint256[] calldata _amounts,
        InitData memory _data
    ) internal virtual {
        if (_provider == address(0)) revert InvalidProvider();
        provider = _provider;
        amounts = _amounts;
        uint256 _total;
        uint256 amountsLength = amounts.length;
        if (amountsLength == 0) revert NoMilestones();
        if (amountsLength > MAX_MILESTONE_LIMIT) revert ExceedsMilestoneLimit();
        for (uint256 i; i < amountsLength; ) {
            if (amounts[i] == 0) revert ZeroAmount();
            _total += amounts[i];
            unchecked {
                ++i;
            }
        }
        total = _total;

        if (_data.client == address(0)) revert InvalidClient();
        if (_data.token == address(0)) revert InvalidToken();
        if (_data.token.code.length == 0) revert InvalidToken();
        if (_data.terminationTime <= block.timestamp) revert DurationEnded();
        if (_data.terminationTime > block.timestamp + MAX_TERMINATION_TIME)
            revert DurationTooLong();
        if (_data.feeBPS > 1000) revert InvalidFeeBPS(); // max 10% (1000/10000)
        if (_data.feeBPS > 0 && _data.treasury == address(0))
            revert InvalidTreasury();
        if (_data.providerReceiver == address(this))
            revert InvalidProviderReceiver();
        if (_data.clientReceiver == address(this))
            revert InvalidClientReceiver();

        client = _data.client;
        token = _data.token;
        terminationTime = _data.terminationTime;
        providerReceiver = _data.providerReceiver;
        clientReceiver = _data.clientReceiver;
        feeBPS = _data.feeBPS;
        treasury = _data.treasury;

        _handleResolverData(_data.resolverData);

        if (!_data.requireVerification) {
            verified = true;
            emit Verified(client, address(this));
        }

        emit InvoiceInit(provider, client, amounts, _data.details);
    }

    function _handleResolverData(bytes memory _resolverData) internal virtual;

    /**
     * @notice Mark the client as verified for off-chain consumers.
     * @dev Does not affect release/withdraw permissions.
     */
    function verify() external override {
        if (verified) revert AlreadyVerified();
        if (msg.sender != client) revert NotClient(msg.sender);
        verified = true;
        emit Verified(client, address(this));
    }

    /**
     * @dev Internal helper to automatically verify the client if not already verified
     *      Called by release methods to ensure verification event is emitted when client takes action
     */
    function _autoVerify() internal {
        if (!verified) {
            verified = true;
            emit Verified(client, address(this));
        }
    }

    /**
     * @notice Updates the client address
     * @param _client Theent address (cannot be zero address)
     * @dev Only callable by current client when contract is not locked
     */
    function updateClient(address _client) external {
        if (msg.sender != client) revert NotClient(msg.sender);
        if (locked) revert Locked();
        if (_client == address(0) || _client == address(this))
            revert InvalidClient();
        if (_client == client) revert NoChange();

        address oldClient = client;
        client = _client;
        emit UpdatedClient(oldClient, _client);
        _updateClientReceiver(address(0));
    }

    /**
     * @notice Updates the provider address
     * @param _provider The new provider address (cannot be zero address)
     * @dev Only callable by current provider when contract is not locked
     */
    function updateProvider(address _provider) external {
        if (msg.sender != provider) revert NotProvider(msg.sender);
        if (locked) revert Locked();
        if (_provider == address(0) || _provider == address(this))
            revert InvalidProvider();
        if (_provider == provider) revert NoChange();

        address oldProvider = provider;
        provider = _provider;
        emit UpdatedProvider(oldProvider, _provider);
        _updateProviderReceiver(address(0));
    }

    /**
     * @notice Updates the provider's receiver address for milestone payments
     * @param _providerReceiver The new receiver address (cannot be this contract)
     * @dev allows setting to zero address to fallback to provider
     */
    function updateProviderReceiver(address _providerReceiver) external {
        if (msg.sender != provider) revert NotProvider(msg.sender);
        if (_providerReceiver == providerReceiver) revert NoChange();
        _updateProviderReceiver(_providerReceiver);
    }

    /**
     * @dev Internal function to update the provider receiver address
     * @param _providerReceiver The new provider receiver address
     */
    function _updateProviderReceiver(address _providerReceiver) internal {
        if (_providerReceiver == address(this))
            revert InvalidProviderReceiver();
        if (_providerReceiver == providerReceiver) return;

        address oldProviderReceiver = providerReceiver;
        providerReceiver = _providerReceiver;
        emit UpdatedProviderReceiver(oldProviderReceiver, _providerReceiver);
    }

    /**
     * @notice Updates the client's receiver address for withdrawal payments
     * @param _clientReceiver The new receiver address (cannot be this contract)
     * @dev allows setting to zero address to fallback to client
     */
    function updateClientReceiver(address _clientReceiver) external {
        if (msg.sender != client) revert NotClient(msg.sender);
        if (_clientReceiver == clientReceiver) revert NoChange();
        _updateClientReceiver(_clientReceiver);
    }

    /**
     * @dev Internal function to update the client receiver address
     * @param _clientReceiver The new client receiver address
     */
    function _updateClientReceiver(address _clientReceiver) internal {
        if (_clientReceiver == address(this)) revert InvalidClientReceiver();
        if (_clientReceiver == clientReceiver) return;

        address oldClientReceiver = clientReceiver;
        clientReceiver = _clientReceiver;
        emit UpdatedClientReceiver(oldClientReceiver, _clientReceiver);
    }

    /**
     * @notice Adds milestones with extra details.
     * @param _milestones The array of new milestones to be added
     * @param _detailsURI Additional details for the milestones
     */
    function addMilestones(
        uint256[] calldata _milestones,
        string calldata _detailsURI
    ) external override {
        _addMilestones(_milestones, _detailsURI);
    }

    /**
     * @dev Internal function to add milestones and update the contract state.
     * @param _milestones The array of new milestones to be added
     * @param _detailsURI Additional details for the milestones
     */
    function _addMilestones(
        uint256[] calldata _milestones,
        string memory _detailsURI
    ) internal virtual {
        if (locked) revert Locked();
        if (block.timestamp > terminationTime) revert Terminated();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);
        if (_milestones.length == 0) revert NoMilestones();

        uint256 newLength = amounts.length + _milestones.length;
        if (newLength > MAX_MILESTONE_LIMIT) revert ExceedsMilestoneLimit();

        uint256 newTotal = total;
        for (uint256 i; i < _milestones.length; ) {
            if (_milestones[i] == 0) revert ZeroAmount();
            amounts.push(_milestones[i]);
            newTotal += _milestones[i];
            unchecked {
                ++i;
            }
        }

        total = newTotal;

        if (bytes(_detailsURI).length > 0) {
            emit DetailsUpdated(msg.sender, _detailsURI);
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
     * @notice Checks if there are enough funds remaining to cover unpaid milestones up to `_milestoneId`.
     * @param _milestoneId The milestone index to check funding for (0-based)
     * @return True if current balance can cover milestones from `milestone` through `_milestoneId` (inclusive).
     * @dev If `_milestoneId` is before the current milestone, returns true.
     * @dev Reverts if milestoneId is out of bounds
     */
    function isFunded(uint256 _milestoneId) external view returns (bool) {
        if (_milestoneId >= amounts.length) revert InvalidMilestone();
        if (_milestoneId < milestone) return true;

        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 required;

        for (uint256 i = milestone; i <= _milestoneId; ) {
            required += amounts[i];
            if (required > balance) return false; // short-circuit
            unchecked {
                ++i;
            }
        }
        return true;
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

            milestone += 1;
            _transferToProvider(token, amount);
            released += amount;
            emit Release(currentMilestone, amount);
        } else {
            // All milestones completed, release any remaining balance
            if (balance == 0) revert BalanceIsZero();

            _transferToProvider(token, balance);
            released += balance;
            emit ReleaseRemainder(balance);
        }
    }

    /**
     * @notice External function to release funds from the contract to the provider
     *         Uses the internal `_release` function to perform the actual release
     */
    function release() external virtual override nonReentrant {
        _release();
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
        if (block.timestamp > terminationTime) revert Terminated();
        if (_milestone < milestone) revert InvalidMilestone();
        if (_milestone >= amounts.length) revert InvalidMilestone();

        _autoVerify();

        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 amount;
        // Calculate total amount to release from current milestone to target milestone
        for (uint256 i = milestone; i <= _milestone; ) {
            // For the last milestone, release all remaining balance if it exceeds cumulative amount
            if (i == amounts.length - 1 && amount + amounts[i] < balance) {
                emit Release(i, balance - amount);
                amount = balance;
            } else {
                emit Release(i, amounts[i]);
                amount = amount + amounts[i];
            }
            unchecked {
                ++i;
            }
        }
        if (balance < amount) revert InsufficientBalance();

        _transferToProvider(token, amount);
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

            _transferToProvider(_token, balance);
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

        _transferToClient(token, balance);
        milestone = amounts.length;

        emit Withdraw(balance);
    }

    /**
     * @notice External function to withdraw funds from the contract to the client
     *         Uses the internal `_withdraw` function to perform the actual withdrawal
     */
    function withdraw() external override nonReentrant {
        _withdraw();
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
            uint256 balance = IERC20(_token).balanceOf(address(this));
            if (balance == 0) revert BalanceIsZero();

            _transferToClient(_token, balance);
        }
    }

    /**
     * @notice External function to lock the contract and initiate dispute resolution
     *         Can only be called by client or provider before termination
     * @param _disputeURI Off-chain URI for extra evidence/details regarding dispute
     * @dev it is payable to allow for potential dispute fees in ether
     */
    function lock(string calldata _disputeURI) external payable virtual;

    /**
     * @dev Internal function to lock the contract and initiate dispute resolution
     *      Can only be called by client or provider before termination
     * @param _disputeURI Off-chain URI for extra evidence/details regarding dispute
     */
    function _lock(string calldata _disputeURI) internal virtual {
        if (locked) revert Locked();
        if (block.timestamp > terminationTime) revert Terminated();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();

        locked = true;

        emit Lock(msg.sender, _disputeURI);
    }

    /**
     * @notice External function to unlock the contract by the client and provider
     * @param _data UnlockData struct containing refundBPS and unlockURI
     * @param _signatures concatenated EIP712 signatures for the hash of the data
     */
    function unlock(
        UnlockData calldata _data,
        bytes calldata _signatures
    ) external virtual override nonReentrant {
        if (!locked) revert NotLocked();
        if (_data.refundBPS > BPS_DENOMINATOR) revert InvalidRefundBPS();

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();

        // Compute hash from data
        bytes32 _hash = _hashTypedDataV4(
            keccak256(abi.encode(UNLOCK_HASH, _data.refundBPS, _data.unlockURI))
        );

        // Check signatures
        _checkSignature(_hash, _signatures);

        uint256 clientAward = (balance * _data.refundBPS) / BPS_DENOMINATOR;
        uint256 providerAward = balance - clientAward;

        if (providerAward > 0) {
            _transferToProvider(token, providerAward);
        }
        if (clientAward > 0) {
            _transferToClient(token, clientAward);
        }

        // Complete all milestones
        milestone = amounts.length;

        // Reset locked state
        locked = false;

        // Set released state
        released += balance;

        emit Unlock(msg.sender, clientAward, providerAward, _data.unlockURI);
    }

    /**
     * @notice Approve a hash on-chain.
     * @param _hash bytes32 - hash that is to be approved
     */
    function approveHash(bytes32 _hash) external {
        // Allowing anyone to sign, as its hard to add restrictions here.
        // Store _hash as signed for sender.
        approvedHashes[msg.sender][_hash] = true;

        emit ApproveHash(_hash, msg.sender);
    }

    /**
     * @dev Check if recovered signatures match with client and provider address.
     * Signatures must be in sequential order. First client then provider.
     * Reverts if signature do not match.
     * @param _hash bytes32 typed hash of data
     * @param _signature bytes appended signatures
     */
    function _checkSignature(
        bytes32 _hash,
        bytes calldata _signature
    ) internal {
        _checkSignatureValidity(client, _hash, _signature, 0);
        _checkSignatureValidity(provider, _hash, _signature, 1);
    }

    /**
     * @dev Internal function for checking signature validity
     * @dev Checks if the signature is approved or recovered
     * @dev Reverts if not
     * @param _address - address checked for validity
     * @param _hash bytes32 - hash for which the signature is recovered
     * @param _signatures bytes - concatenated signatures
     * @param _signatureIndex uint256 - index at which the signature should be present
     */
    function _checkSignatureValidity(
        address _address,
        bytes32 _hash,
        bytes calldata _signatures,
        uint256 _signatureIndex
    ) internal {
        if (
            !approvedHashes[_address][_hash] &&
            SignatureDecoder.recoverKey(_hash, _signatures, _signatureIndex) !=
            _address
        ) {
            revert InvalidSignatures();
        }

        // delete from approvedHash
        delete approvedHashes[_address][_hash];
    }

    /**
     * @dev Internal function to transfer payment to the provider or provider receiver
     *      Deducts fee if configured and transfers to treasury
     * @param _token The token to transfer
     * @param _amount The amount to transfer
     */
    function _transferToProvider(
        address _token,
        uint256 _amount
    ) internal virtual {
        address recipient = providerReceiver != address(0)
            ? providerReceiver
            : provider;

        _transferWithFees(_token, _amount, recipient);
    }

    /**
     * @dev Internal function to withdraw deposit to the client or client receiver
     *      Deducts fee if configured and transfers to treasury
     * @param _token The token to withdraw
     * @param _amount The amount to withdraw
     */
    function _transferToClient(
        address _token,
        uint256 _amount
    ) internal virtual {
        address recipient = clientReceiver != address(0)
            ? clientReceiver
            : client;

        _transferWithFees(_token, _amount, recipient);
    }

    /**
     * @dev Internal function to transfer payment to a recipient and handle fees
     * @param _token The token to transfer
     * @param _amount The amount to transfer
     * @param _recipient The recipient address
     */
    function _transferWithFees(
        address _token,
        uint256 _amount,
        address _recipient
    ) internal virtual {
        if (feeBPS > 0 && treasury != address(0)) {
            uint256 feeAmount = (_amount * feeBPS) / BPS_DENOMINATOR;
            uint256 netAmount = _amount - feeAmount;

            _transferToken(_token, treasury, feeAmount);
            _transferToken(_token, _recipient, netAmount);

            emit FeeTransferred(_token, feeAmount, treasury);
        } else {
            _transferToken(_token, _recipient, _amount);
        }
    }

    function _transferToken(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal virtual;

    /**
     * @notice Receives ETH transfers and wraps them as WETH
     *         Only accepts ETH if the token is WETH and contract is not locked
     */
    // solhint-disable-next-line no-complex-fallback
    receive() external payable nonReentrant {
        if (token != address(WRAPPED_ETH)) revert InvalidWrappedETH();
        WRAPPED_ETH.deposit{value: msg.value}();
        emit Deposit(msg.sender, msg.value, token);
    }

    /**
     * @notice Wraps any ETH balance in the contract to WETH
     *         Handles edge cases when ETH was sent via self-destruct
     */
    function wrapETH() external nonReentrant {
        uint256 bal = address(this).balance;
        if (bal == 0) revert BalanceIsZero();
        WRAPPED_ETH.deposit{value: bal}();
        emit WrappedStrayETH(bal);
        if (token == address(WRAPPED_ETH)) {
            // Log address(this) as depositor since it was obtained via self-destruct
            emit Deposit(address(this), bal, token);
        }
        // Handle release of WETH as per `releaseTokens` or `withdrawTokens` as needed
    }
}
