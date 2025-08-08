// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ISmartInvoiceEscrow} from "./interfaces/ISmartInvoiceEscrow.sol";
import {ISmartInvoiceFactory} from "./interfaces/ISmartInvoiceFactory.sol";
import {IArbitrable} from "./interfaces/IArbitrable.sol";
import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {IWRAPPED} from "./interfaces/IWRAPPED.sol";

/// @title SmartInvoiceEscrow
/// @notice A comprehensive escrow contract with milestone payments, arbitration, and updatable addresses
contract SmartInvoiceEscrow is
    ISmartInvoiceEscrow,
    IArbitrable,
    Initializable,
    Context,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    enum ADR {
        INDIVIDUAL,
        ARBITRATOR
    }

    string public constant VERSION = "3.0.0";

    uint256 public constant NUM_RULING_OPTIONS = 5; // excludes options 0, 1 and 2

    // solhint-disable-next-line var-name-mixedcase
    uint8[2][6] public RULINGS = [
        [1, 1], // 0 = refused to arbitrate
        [1, 0], // 1 = 100% to client
        [3, 1], // 2 = 75% to client
        [1, 1], // 3 = 50% to client
        [1, 3], // 4 = 25% to client
        [0, 1] // 5 = 0% to client
    ];

    uint256 public constant MAX_TERMINATION_TIME = 63113904; // 2-year limit on locker

    address public wrappedNativeToken;

    address public client;
    address public provider;
    address public providerReceiver;
    address public clientReceiver;
    ADR public resolverType;
    address public resolver;
    address public token;
    uint256 public terminationTime;
    uint256 public resolutionRate;
    bytes32 public details;

    uint256[] public amounts; // milestones split into amounts
    uint256 public total = 0;
    bool public locked;
    uint256 public milestone = 0; // current milestone - starts from 0 to amounts.length
    uint256 public released = 0;
    uint256 public disputeId;

    modifier onlyProvider() {
        if (msg.sender != provider) revert NotProvider();
        _;
    }

    modifier onlyClient() {
        if (msg.sender != client) revert NotClient();
        _;
    }

    constructor() {
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
        if (_provider == address(0)) revert InvalidProvider();

        _handleData(_data);

        provider = _provider;
        amounts = _amounts;
        uint256 _total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            _total += amounts[i];
        }
        total = _total;
    }

    /**
     * @dev Handles the provided data, decodes it, and initializes necessary contract state variables.
     * @param _data The data to be handled and decoded
     */
    function _handleData(bytes calldata _data) internal virtual {
        (
            address _client,
            uint8 _resolverType,
            address _resolver,
            address _token,
            uint256 _terminationTime,
            bytes32 _details,
            address _wrappedNativeToken,
            bool _requireVerification,
            address _factory,
            address _providerReceiver,
            address _clientReceiver
        ) = abi.decode(
                _data,
                (
                    address,
                    uint8,
                    address,
                    address,
                    uint256,
                    bytes32,
                    address,
                    bool,
                    address,
                    address,
                    address
                )
            );

        uint256 _resolutionRate = ISmartInvoiceFactory(_factory)
            .resolutionRateOf(_resolver);
        if (_resolutionRate == 0) {
            _resolutionRate = 20;
        }

        if (_client == address(0)) revert InvalidClient();
        if (_resolverType > uint8(ADR.ARBITRATOR)) revert InvalidResolverType();
        if (_resolver == address(0)) revert InvalidResolver();
        if (_token == address(0)) revert InvalidToken();
        if (_terminationTime <= block.timestamp) revert DurationEnded();
        if (_terminationTime > block.timestamp + MAX_TERMINATION_TIME)
            revert DurationTooLong();
        if (_resolutionRate == 0) revert InvalidResolutionRate();
        if (_wrappedNativeToken == address(0))
            revert InvalidWrappedNativeToken();

        client = _client;
        resolverType = ADR(_resolverType);
        resolver = _resolver;
        token = _token;
        terminationTime = _terminationTime;
        resolutionRate = _resolutionRate;
        details = _details;
        wrappedNativeToken = _wrappedNativeToken;
        providerReceiver = _providerReceiver;
        clientReceiver = _clientReceiver;

        if (!_requireVerification) emit Verified(client, address(this));
    }

    /**
     * @dev Verifies the client and contract are paired
     * @dev This ensures that client indeed controls this address and can release funds from this escrow
     */
    function verify() external override {
        if (msg.sender != client) revert NotClient();
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
        if (_providerReceiver == address(0)) revert InvalidProviderReceiver();
        providerReceiver = _providerReceiver;
        emit UpdatedProviderReceiver(_providerReceiver);
    }

    /**
     * @notice Updates the client's receiver address.
     * @param _clientReceiver The updated client receiver address.
     */
    function updateClientReceiver(address _clientReceiver) external onlyClient {
        if (_clientReceiver == address(0)) revert InvalidClientReceiver();
        clientReceiver = _clientReceiver;
        emit UpdatedClientReceiver(_clientReceiver);
    }

    /**
     * @dev Adds milestones without extra details.
     * @param _milestones The array of new milestones to be added
     */
    function addMilestones(uint256[] calldata _milestones) external override {
        _addMilestones(_milestones, bytes32(0));
    }

    /**
     * @dev Adds milestones with extra details.
     * @param _milestones The array of new milestones to be added
     * @param _details Additional details for the milestones
     */
    function addMilestones(
        uint256[] calldata _milestones,
        bytes32 _details
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
        bytes32 _details
    ) internal {
        if (locked) revert Locked();
        if (block.timestamp >= terminationTime) revert Terminated();
        if (_msgSender() != client && _msgSender() != provider)
            revert NotParty();
        if (_milestones.length == 0) revert NoMilestones();
        if (_milestones.length > 10) revert ExceedsMilestoneLimit();

        uint256 newLength = amounts.length + _milestones.length;
        uint256[] memory baseArray = new uint256[](newLength);
        uint256 newTotal = total;

        for (uint256 i = 0; i < amounts.length; i++) {
            baseArray[i] = amounts[i];
        }
        for (uint256 i = amounts.length; i < newLength; i++) {
            baseArray[i] = _milestones[i - amounts.length];
            newTotal += _milestones[i - amounts.length];
        }

        total = newTotal;
        amounts = baseArray;

        if (_details != bytes32(0)) {
            details = _details;
            emit DetailsUpdated(msg.sender, _details);
        }

        emit MilestonesAdded(msg.sender, address(this), _milestones);
    }

    /**
     * @dev Returns the amounts associated with the milestones.
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
        if (_msgSender() != client) revert NotClient();

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
     * @dev External function to release funds from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     */
    function release() external virtual override nonReentrant {
        return _release();
    }

    /**
     * @dev External function to release funds from the contract to the provider up to a certain milestone.
     * @param _milestone The milestone to release funds to
     */
    function release(
        uint256 _milestone
    ) external virtual override nonReentrant {
        if (locked) revert Locked();
        if (_msgSender() != client) revert NotClient();
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
     * @dev External function to release tokens from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     * @param _token The token to release funds from
     */
    function releaseTokens(
        address _token
    ) external virtual override nonReentrant {
        if (_token == token) {
            _release();
        } else {
            if (_msgSender() != client) revert NotClient();
            uint256 balance = IERC20(_token).balanceOf(address(this));
            _transferPayment(_token, balance);
        }
    }

    /**
     * @dev Internal function to withdraw funds from the contract to the client.
     */
    function _withdraw() internal {
        if (locked) revert Locked();
        if (block.timestamp <= terminationTime) revert Terminated();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();

        _withdrawDeposit(token, balance);
        milestone = amounts.length;

        emit Withdraw(balance);
    }

    /**
     * @dev External function to withdraw funds from the contract to the client.
     * Uses the internal `_withdraw` function to perform the actual withdrawal.
     */
    function withdraw() external override nonReentrant {
        return _withdraw();
    }

    /**
     * @dev External function to withdraw tokens from the contract to the client.
     * Uses the internal `_withdraw` function to perform the actual withdrawal.
     * @param _token The token to withdraw
     */
    function withdrawTokens(address _token) external override nonReentrant {
        if (_token == token) {
            _withdraw();
        } else {
            if (block.timestamp <= terminationTime) revert Terminated();
            uint256 balance = IERC20(_token).balanceOf(address(this));
            if (balance == 0) revert BalanceIsZero();

            _withdrawDeposit(_token, balance);
        }
    }

    /**
     * @dev External function to lock the contract.
     * @param _details Details of the dispute
     */
    function lock(bytes32 _details) external payable override nonReentrant {
        if (locked) revert Locked();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        if (block.timestamp >= terminationTime) revert Terminated();
        if (_msgSender() != client && _msgSender() != provider)
            revert NotParty();

        if (resolverType == ADR.ARBITRATOR) {
            disputeId = IArbitrator(resolver).createDispute{value: msg.value}(
                NUM_RULING_OPTIONS,
                abi.encodePacked(details)
            );
        }
        locked = true;

        emit Lock(_msgSender(), _details);
    }

    /**
     * @dev External function to resolve the contract.
     * @param _clientAward The amount to award the client
     * @param _providerAward The amount to award the provider
     * @param _details Details of the dispute
     */
    function resolve(
        uint256 _clientAward,
        uint256 _providerAward,
        bytes32 _details
    ) external virtual override nonReentrant {
        if (resolverType != ADR.INDIVIDUAL) revert InvalidIndividualResolver();
        if (!locked) revert Locked();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        if (_msgSender() != resolver) revert NotResolver();

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
            _msgSender(),
            _clientAward,
            _providerAward,
            resolutionFee,
            _details
        );
    }

    /**
     * @dev External function to rule on a dispute.
     * @param _disputeId The ID of the dispute
     * @param _ruling The ruling of the arbitrator
     */
    function rule(
        uint256 _disputeId,
        uint256 _ruling
    ) external virtual override nonReentrant {
        if (resolverType != ADR.ARBITRATOR) revert InvalidArbitratorResolver();
        if (!locked) revert Locked();
        if (_msgSender() != resolver) revert NotResolver();
        if (_disputeId != disputeId) revert IncorrectDisputeId();
        if (_ruling > NUM_RULING_OPTIONS) revert InvalidRuling();
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

        milestone = amounts.length;
        locked = false;

        emit Rule(resolver, clientAward, providerAward, _ruling);
        emit Ruling(resolver, _disputeId, _ruling);
    }

    /**
     * @dev Internal function to get the ruling of the arbitrator.
     * @param _ruling The ruling of the arbitrator
     */
    function _getRuling(
        uint256 _ruling
    ) internal pure returns (uint8[2] memory ruling) {
        uint8[2][6] memory rulings = [
            [1, 1], // 0 = refused to arbitrate
            [1, 0], // 1 = 100% to client
            [3, 1], // 2 = 75% to client
            [1, 1], // 3 = 50% to client
            [1, 3], // 4 = 25% to client
            [0, 1] // 5 = 0% to client
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
        IERC20(_token).safeTransfer(recipient, _amount);
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
        IERC20(_token).safeTransfer(recipient, _amount);
    }

    // receive eth transfers
    // solhint-disable-next-line no-complex-fallback
    receive() external payable {
        if (locked) revert Locked();
        if (token != wrappedNativeToken) revert InvalidWrappedNativeToken();
        IWRAPPED(wrappedNativeToken).deposit{value: msg.value}();
        emit Deposit(_msgSender(), msg.value);
    }
}
