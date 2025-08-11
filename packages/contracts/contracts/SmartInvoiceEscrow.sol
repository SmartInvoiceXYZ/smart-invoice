// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
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
/// @notice A comprehensive escrow contract with milestone payments, arbitration, and updatable addresses
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

    string public constant VERSION = "3.0.0";

    uint256 public constant NUM_RULING_OPTIONS = 2;

    uint256 public constant MAX_TERMINATION_TIME = 63113904; // 2-year limit on termination time

    uint256 public constant MAX_MILESTONE_LIMIT = 50;

    IWRAPPED public immutable WRAPPED_NATIVE_TOKEN;

    ISmartInvoiceFactory public immutable FACTORY;

    address public client;
    address public provider;
    address public providerReceiver;
    address public clientReceiver;
    ADR public resolverType;
    address public resolver;
    address public token;
    uint256 public terminationTime;
    uint256 public resolutionRate;

    uint256 public feeBPS; // fee in basis points (100 = 1%)
    address public treasury; // treasury address to receive fees

    uint256[] public amounts; // milestones split into amounts
    uint256 public total = 0;
    bool public locked;
    uint256 public milestone = 0; // current milestone - starts from 0 to amounts.length
    uint256 public released = 0;
    uint256 public disputeId;

    // @dev metaEvidenceId: latest MetaEvidence identifier for this escrow (ERC-1497).
    // It advances when off-chain details change (e.g., via _addMilestones),
    // and the current value is referenced by new Disputes.
    uint256 public metaEvidenceId;
    // @dev" evidenceGroupId: per-dispute Evidence group identifier (ERC-1497).
    // Incremented *before* opening a new dispute so both Dispute and
    // subsequent Evidence events for that dispute share the same group.
    uint256 public evidenceGroupId;

    modifier onlyProvider() {
        if (msg.sender != provider) revert NotProvider(msg.sender);
        _;
    }

    modifier onlyClient() {
        if (msg.sender != client) revert NotClient(msg.sender);
        _;
    }

    constructor(address _wrappedNativeToken, address _factory) {
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();
        if (_factory == address(0)) revert InvalidFactory();
        WRAPPED_NATIVE_TOKEN = IWRAPPED(_wrappedNativeToken);
        FACTORY = ISmartInvoiceFactory(_factory);
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with the provided provider, amounts, and data.
     * @param _provider The address of the provider
     * @param _amounts The array of amounts associated with the provider
     * @param _data The additional data needed for initialization
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
     * @dev Handles the provided data, decodes it, and initializes necessary contract state variables.
     * @param _data The data to be handled and decoded
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
        for (uint256 i = 0; i < amountsLength; i++) {
            _total += amounts[i];
        }
        total = _total;

        InitData memory initData = abi.decode(_data, (InitData));

        uint256 _resolutionRate = FACTORY.resolutionRateOf(initData.resolver);
        if (_resolutionRate == 0) _resolutionRate = 20; // default ~5%
        if (_resolutionRate < 2 || _resolutionRate > 1000)
            revert InvalidResolutionRate();

        if (initData.client == address(0)) revert InvalidClient();
        if (initData.resolverType > uint8(ADR.ARBITRATOR))
            revert InvalidResolverType();
        if (initData.resolver == address(0)) revert InvalidResolver();
        if (initData.token == address(0)) revert InvalidToken();
        if (initData.terminationTime <= block.timestamp) revert DurationEnded();
        if (initData.terminationTime > block.timestamp + MAX_TERMINATION_TIME)
            revert DurationTooLong();
        if (initData.feeBPS > 1000) revert InvalidFeeBPS(); // max 10%
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
        resolutionRate = _resolutionRate;
        providerReceiver = initData.providerReceiver;
        clientReceiver = initData.clientReceiver;
        feeBPS = initData.feeBPS;
        treasury = initData.treasury;

        if (!initData.requireVerification) emit Verified(client, address(this));

        emit InvoiceInit(provider, client, amounts, initData.details);
        emit MetaEvidence(metaEvidenceId, initData.details);
    }

    /**
     * @notice Verifies the client and contract are paired
     * @dev This ensures that client indeed controls this address and can release funds from this escrow
     */
    function verify() external override {
        if (msg.sender != client) revert NotClient(msg.sender);
        emit Verified(client, address(this));
    }

    /**
     * @notice Updates the client address.
     * @param _client The updated client address.
     */
    function updateClient(address _client) external onlyClient {
        if (_client == address(0)) revert InvalidClient();
        client = _client;
        emit UpdatedClient(_client);
    }

    /**
     * @notice Updates the provider address.
     * @param _provider The updated provider address.
     */
    function updateProvider(address _provider) external onlyProvider {
        if (_provider == address(0)) revert InvalidProvider();
        provider = _provider;
        emit UpdatedProvider(_provider);
    }

    /**
     * @notice Updates the provider's receiver address.
     * @param _providerReceiver The updated provider receiver address.
     */
    function updateProviderReceiver(
        address _providerReceiver
    ) external onlyProvider {
        if (
            _providerReceiver == address(0) ||
            _providerReceiver == address(this)
        ) revert InvalidProviderReceiver();
        providerReceiver = _providerReceiver;
        emit UpdatedProviderReceiver(_providerReceiver);
    }

    /**
     * @notice Updates the client's receiver address.
     * @param _clientReceiver The updated client receiver address.
     */
    function updateClientReceiver(address _clientReceiver) external onlyClient {
        if (_clientReceiver == address(0) || _clientReceiver == address(this))
            revert InvalidClientReceiver();
        clientReceiver = _clientReceiver;
        emit UpdatedClientReceiver(_clientReceiver);
    }

    /**
     * @notice Adds milestones without extra details.
     * @param _milestones The array of new milestones to be added
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

        uint256[] memory baseArray = new uint256[](newLength);
        uint256 newTotal = total;

        uint256 amountsLength = amounts.length;
        for (uint256 i = 0; i < amountsLength; i++) {
            baseArray[i] = amounts[i];
        }
        for (uint256 i = amountsLength; i < newLength; i++) {
            baseArray[i] = _milestones[i - amountsLength];
            newTotal += _milestones[i - amountsLength];
        }

        total = newTotal;
        amounts = baseArray;

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
     * @dev Internal function to release funds from the contract to the provider.
     */
    function _release() internal virtual {
        if (locked) revert Locked();
        if (msg.sender != client) revert NotClient(msg.sender);

        uint256 currentMilestone = milestone;
        uint256 balance = IERC20(token).balanceOf(address(this));

        if (currentMilestone < amounts.length) {
            uint256 amount = amounts[currentMilestone];
            if (currentMilestone == amounts.length - 1 && amount < balance) {
                amount = balance;
            }
            if (balance < amount) revert InsufficientBalance();

            milestone = milestone + 1;
            _transferPayment(token, amount);
            released = released + amount;
            emit Release(currentMilestone, amount);
        } else {
            if (balance == 0) revert BalanceIsZero();

            _transferPayment(token, balance);
            released = released + balance;
            emit Release(currentMilestone, balance);
        }
    }

    /**
     * @notice External function to release funds from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     */
    function release() external virtual override nonReentrant {
        return _release();
    }

    /**
     * @notice External function to release funds from the contract to the provider up to a certain milestone.
     * @param _milestone The milestone to release funds to
     */
    function release(
        uint256 _milestone
    ) external virtual override nonReentrant {
        if (locked) revert Locked();
        if (msg.sender != client) revert NotClient(msg.sender);
        if (_milestone < milestone) revert InvalidMilestone();
        if (_milestone >= amounts.length) revert InvalidMilestone();

        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 amount = 0;
        for (uint256 j = milestone; j <= _milestone; j++) {
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
     * @notice External function to release tokens from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     * @param _token The token to release funds from
     */
    function releaseTokens(
        address _token
    ) external virtual override nonReentrant {
        if (_token == token) {
            _release();
        } else {
            if (locked) revert Locked();
            if (msg.sender != client) revert NotClient(msg.sender);
            uint256 balance = IERC20(_token).balanceOf(address(this));
            _transferPayment(_token, balance);
        }
    }

    /**
     * @dev Internal function to withdraw funds from the contract to the client.
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
     * @notice External function to withdraw funds from the contract to the client.
     * Uses the internal `_withdraw` function to perform the actual withdrawal.
     */
    function withdraw() external override nonReentrant {
        return _withdraw();
    }

    /**
     * @notice External function to withdraw tokens from the contract to the client.
     * Uses the internal `_withdraw` function to perform the actual withdrawal.
     * @param _token The token to withdraw
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
     * @notice External function to lock the contract.
     * @param _details Details of the dispute
     */
    function lock(
        string calldata _details
    ) external payable override nonReentrant {
        if (locked) revert Locked();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        if (block.timestamp >= terminationTime) revert Terminated();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);

        locked = true;

        if (resolverType == ADR.ARBITRATOR) {
            // user must call `IArbitrator(resolver).arbitrationCost(_details)` to get the arbitration cost

            // ensure each dispute has its own evidence group id
            evidenceGroupId = evidenceGroupId + 1;

            disputeId = IArbitrator(resolver).createDispute{value: msg.value}(
                NUM_RULING_OPTIONS,
                abi.encodePacked(_details)
            );

            emit Dispute(
                IArbitrator(resolver),
                disputeId,
                metaEvidenceId,
                evidenceGroupId
            );
        }

        emit Lock(msg.sender, _details);
    }

    /**
     * @notice External function to appeal a dispute.
     * @param _details Extra data for the arbitrator
     */
    function appeal(string memory _details) external payable nonReentrant {
        if (resolverType != ADR.ARBITRATOR)
            revert InvalidArbitratorResolver(resolver);
        if (!locked) revert NotLocked();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);

        IArbitrator(resolver).appeal{value: msg.value}(
            disputeId,
            abi.encodePacked(_details)
        );

        emit DisputeAppealed(msg.sender, _details);
    }

    /**
     * @notice External function to submit evidence for a dispute.
     * @param _evidenceURI The URI of the evidence
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
        // via the current evidenceGroupId (incremented in lock()).
        emit Evidence(
            IArbitrator(resolver),
            evidenceGroupId,
            msg.sender,
            _evidenceURI
        );
    }

    /**
     * @notice External function to resolve the contract.
     * @param _clientAward The amount to award the client
     * @param _providerAward The amount to award the provider
     * @param _details Details of the dispute
     */
    function resolve(
        uint256 _clientAward,
        uint256 _providerAward,
        string calldata _details
    ) external virtual override nonReentrant {
        if (resolverType != ADR.INDIVIDUAL)
            revert InvalidIndividualResolver(resolver);
        if (!locked) revert NotLocked();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        if (msg.sender != resolver) revert NotResolver(msg.sender);

        uint256 resolutionFee = balance / resolutionRate;

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

        milestone = amounts.length;
        locked = false;

        emit Resolve(
            msg.sender,
            _clientAward,
            _providerAward,
            resolutionFee,
            _details
        );
    }

    /**
     * @notice External function to rule on a dispute.
     * @param _disputeId The ID of the dispute
     * @param _ruling The ruling of the arbitrator
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

        // complete all milestones
        milestone = amounts.length;

        // reset locked state
        locked = false;

        emit Rule(resolver, clientAward, providerAward, _ruling);
        emit Ruling(IArbitrator(resolver), _disputeId, _ruling);
    }

    /**
     * @dev Internal function to get the ruling of the arbitrator.
     * @param _ruling The ruling of the arbitrator
     * @return ruling Array containing [clientShare, providerShare] percentages
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
     * @dev Internal function to transfer payment to the provider or provider receiver.
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
            uint256 feeAmount = (_amount * feeBPS) / 10000;
            uint256 netAmount = _amount - feeAmount;

            IERC20(_token).safeTransfer(treasury, feeAmount);
            IERC20(_token).safeTransfer(recipient, netAmount);

            emit FeeTransferred(_token, feeAmount, treasury);
        } else {
            IERC20(_token).safeTransfer(recipient, _amount);
        }
    }

    /**
     * @dev Internal function to withdraw deposit to the client or client receiver.
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
            uint256 feeAmount = (_amount * feeBPS) / 10000;
            uint256 netAmount = _amount - feeAmount;

            IERC20(_token).safeTransfer(treasury, feeAmount);
            IERC20(_token).safeTransfer(recipient, netAmount);

            emit FeeTransferred(_token, feeAmount, treasury);
        } else {
            IERC20(_token).safeTransfer(recipient, _amount);
        }
    }

    // receive eth transfers
    // solhint-disable-next-line no-complex-fallback
    receive() external payable {
        if (locked) revert Locked();
        if (token != address(WRAPPED_NATIVE_TOKEN))
            revert InvalidWrappedNativeToken();
        WRAPPED_NATIVE_TOKEN.deposit{value: msg.value}();
        emit Deposit(msg.sender, msg.value, token);
    }

    // wrap eth for edge cases when eth was sent via self-destruct
    function wrapETH() external nonReentrant {
        if (locked) revert Locked();
        uint256 bal = address(this).balance;
        if (bal == 0) revert BalanceIsZero();
        WRAPPED_NATIVE_TOKEN.deposit{value: bal}();
        emit WrappedStrayETH(bal);
        if (token == address(WRAPPED_NATIVE_TOKEN)) {
            // log address(this) as depositor since it was obtained via self-destruct
            emit Deposit(address(this), bal, token);
        }
        // handle release of wETH as per `releaseTokens` or `withdrawTokens` as needed
    }
}
