// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity 0.8.30;

import {
    IArbitrator,
    IDisputeResolver
} from "@kleros/dispute-resolver-interface-contract/contracts/IDisputeResolver.sol";

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SmartInvoiceEscrow
/// @notice A comprehensive escrow contract with milestone-based payments, dispute resolution, and updatable addresses
/// @dev Supports kleros-style arbitrator-based dispute resolution
abstract contract SmartInvoiceEscrowArbitrable is
    SmartInvoiceEscrowCore,
    IDisputeResolver
{
    error IncorrectDisputeId();
    error InvalidRuling(uint256 ruling);
    error AppealPeriodNotStarted();
    error AppealPeriodEnded();
    error AppealFeeAlreadyPaid();
    error DisputeAlreadyRuled();
    error DisputeNotRuled();

    /// @notice Emitted when a ruling is made by an arbitrator resolver
    /// @param resolver The address of the arbitrator
    /// @param clientAward The amount awarded to the client
    /// @param providerAward The amount awarded to the provider
    /// @param ruling The ruling number (0=refused/split, 1=client wins, 2=provider wins)
    event Rule(
        IArbitrator indexed resolver,
        uint256 clientAward,
        uint256 providerAward,
        uint256 ruling
    );

    /// @notice Round accounting adapted from Kleros ArbitrableProxy
    struct Round {
        mapping(uint256 => uint256) paidFees; // amount raised per ruling option in this round
        mapping(uint256 => bool) hasPaid; // true if that ruling option reached its specificCost in this round
        mapping(address => mapping(uint256 => uint256)) contributions; // user => ruling => amount
        uint256 feeRewards; // reimbursable appeal fees available to winners’ contributors in this round
        uint256[] fundedRulings; // ruling options that fully funded in this round
    }

    /// @notice Single dispute bookkeeping
    struct DisputeData {
        bool isRuled; // whether a dispute is currently ruled
        uint256 ruling; // final ruling
        uint256 externalDisputeId; // external dispute id
    }

    /// @notice Number of ruling options available to arbitrators: client vs provider; plus 0 = "refused/split"
    uint256 public constant NUM_RULING_OPTIONS = 2;

    /// @notice Appeal stake multipliers (basis points)
    uint256 internal constant WINNER_STAKE_MULTIPLIER = 3000; // 30% of the appeal fee
    uint256 internal constant LOSER_STAKE_MULTIPLIER = 7000; // 70% of the appeal fee
    uint256 internal constant LOSER_APPEAL_PERIOD_MULTIPLIER = 5000; // losers: first 50% of the appeal window

    /// @notice Arbitrator resolver for disputes
    IArbitrator public resolver;
    /// @notice Latest MetaEvidence identifier for this escrow (ERC-1497)
    /// @dev Advances when off-chain details change (e.g., via _addMilestones),
    ///      and the current value is referenced by new Disputes
    uint256 public metaEvidenceId;
    /// @notice Arbitrator extra data for arbitrator resolvers (court and number of jurors)
    bytes public arbitratorExtraData;
    /// @notice Current dispute data when using arbitrator resolution
    DisputeData[] private disputes;
    /// @notice Crowdfunded appeal rounds for each dispute
    mapping(uint256 => Round[]) private appealRoundsMap;
    /// @notice Maps external dispute ID to local dispute ID
    mapping(uint256 => uint256) public override externalIDtoLocalID;

    /**
     * @dev Internal function to decode initialization data and set contract state
     * @param _provider The address of the service provider
     * @param _amounts Array of milestone amounts to validate and store
     * @param _data InitData containing all escrow configuration parameters
     * @dev IMPORTANT: The token MUST be a standard ERC20 token
     *      Fee-on-transfer, rebasing, or ERC777 tokens may break the contract functionality
     *      Resolution rate is fetched from the factory and must not exceed 1000 BPS (10%)
     */
    function _handleData(
        address _provider,
        uint256[] calldata _amounts,
        InitData memory _data
    ) internal virtual override {
        super._handleData(_provider, _amounts, _data);
        emit MetaEvidence(metaEvidenceId, _data.details);
    }

    function _handleResolverData(
        bytes memory _resolverData
    ) internal virtual override {
        if (_resolverData.length < 160) revert InvalidResolverData();
        (address _resolver, bytes memory extra) = abi.decode(
            _resolverData,
            (address, bytes)
        );
        if (_resolver == address(0)) revert InvalidResolver();

        resolver = IArbitrator(_resolver);
        arbitratorExtraData = extra; // bytes("") works too
    }

    function _addMilestones(
        uint256[] calldata _milestones,
        string memory _detailsURI
    ) internal virtual override {
        super._addMilestones(_milestones, _detailsURI);
        if (bytes(_detailsURI).length > 0) {
            metaEvidenceId = metaEvidenceId + 1;
            emit MetaEvidence(metaEvidenceId, _detailsURI);
        }
    }

    /**
     * @notice External function to lock the contract and initiate dispute resolution
     *         Can only be called by client or provider before termination
     * @param _disputeURI Off-chain URI for extra evidence/details regarding dispute
     */
    function lock(
        string calldata _disputeURI
    ) external payable virtual override nonReentrant {
        _lock(_disputeURI);

        // Note: user must call `resolver.arbitrationCost(_disputeURI)` to get the arbitration cost
        uint256 externalDisputeId = resolver.createDispute{value: msg.value}(
            NUM_RULING_OPTIONS,
            arbitratorExtraData
        );

        uint256 localDisputeId = disputes.length;

        // Push new disputeData
        disputes.push(
            DisputeData({
                ruling: 0,
                externalDisputeId: externalDisputeId,
                isRuled: false
            })
        );

        // Set external dispute ID to local dispute ID
        externalIDtoLocalID[externalDisputeId] = localDisputeId;

        // initialize first round 0
        appealRoundsMap[localDisputeId].push();

        emit Dispute(
            resolver,
            externalDisputeId,
            metaEvidenceId,
            localDisputeId
        );
        emit Evidence(resolver, localDisputeId, msg.sender, _disputeURI);
    }

    /**
     * @notice External function to submit evidence for a dispute
     *         Can only be called by client or provider when contract is locked with arbitrator resolver
     * @param _localDisputeId The ID of the dispute to submit evidence for
     * @param _evidenceURI Off-chain URI to evidence for the arbitrator
     */
    function submitEvidence(
        uint256 _localDisputeId,
        string calldata _evidenceURI
    ) external override nonReentrant {
        if (!locked) revert NotLocked();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);
        if (_localDisputeId >= disputes.length) revert IncorrectDisputeId();
        DisputeData storage disputeData = disputes[_localDisputeId];
        if (disputeData.isRuled) revert DisputeAlreadyRuled();

        emit Evidence(resolver, _localDisputeId, msg.sender, _evidenceURI);
    }

    /// @notice Contribute towards appealing to a *specific ruling option*
    /// @dev Payable by ANY address; opens a new round only when two opposing options are fully funded
    function fundAppeal(
        uint256 _localDisputeId,
        uint256 _ruling
    ) external payable override nonReentrant returns (bool fullyFunded) {
        if (_localDisputeId >= disputes.length) revert IncorrectDisputeId();
        if (!locked) revert NotLocked();
        if (_ruling == 0 || _ruling > NUM_RULING_OPTIONS)
            revert InvalidRuling(_ruling);

        DisputeData storage disputeData = disputes[_localDisputeId];

        if (disputeData.isRuled) revert DisputeAlreadyRuled();

        uint256 originalCost;
        uint256 totalCost;
        {
            uint256 currentRuling = resolver.currentRuling(
                disputeData.externalDisputeId
            );
            (originalCost, totalCost) = _appealCost(
                _localDisputeId,
                _ruling,
                currentRuling
            );
            _checkAppealPeriod(_localDisputeId, _ruling, currentRuling);
        }

        Round[] storage rounds = appealRoundsMap[_localDisputeId];
        uint256 lastRoundIndex = rounds.length - 1;
        Round storage lastRound = rounds[lastRoundIndex];

        if (lastRound.hasPaid[_ruling]) revert AppealFeeAlreadyPaid();
        uint256 already = lastRound.paidFees[_ruling];

        uint256 remaining = totalCost > already ? (totalCost - already) : 0;
        uint256 contribution = msg.value < remaining ? msg.value : remaining;

        // Record contribution
        lastRound.paidFees[_ruling] = already + contribution;
        lastRound.contributions[msg.sender][_ruling] += contribution;
        emit Contribution(
            _localDisputeId,
            lastRoundIndex,
            _ruling,
            msg.sender,
            contribution
        );

        // If fully funded now, mark and add to pot
        if (lastRound.paidFees[_ruling] >= totalCost) {
            lastRound.hasPaid[_ruling] = true;
            lastRound.fundedRulings.push(_ruling);
            lastRound.feeRewards += lastRound.paidFees[_ruling];
            emit RulingFunded(_localDisputeId, lastRoundIndex, _ruling);
        }

        // If two opposing rulings are fully funded, escalate: pay base fee and open next round
        if (lastRound.fundedRulings.length == 2) {
            rounds.push(); // next round
            uint256 pay = originalCost;
            if (lastRound.feeRewards >= pay) {
                lastRound.feeRewards -= pay;
            } else {
                pay = lastRound.feeRewards;
                lastRound.feeRewards = 0;
            }
            resolver.appeal{value: pay}(
                disputeData.externalDisputeId,
                arbitratorExtraData
            );
        }

        // Refund any excess
        uint256 refund = msg.value > contribution
            ? (msg.value - contribution)
            : 0;
        if (refund > 0) {
            (bool s, ) = payable(msg.sender).call{value: refund}("");
            s;
        }

        return lastRound.hasPaid[_ruling];
    }

    /// @notice Withdraw reimbursable fees and/or rewards from a specific round
    function withdrawFeesAndRewards(
        uint256 _localDisputeId,
        address payable _contributor,
        uint256 _roundIndex,
        uint256 _ruling
    ) public override nonReentrant returns (uint256 amount) {
        if (locked) revert Locked();

        if (_localDisputeId >= disputes.length) revert IncorrectDisputeId();
        DisputeData storage disputeData = disputes[_localDisputeId];
        if (!disputeData.isRuled) revert DisputeNotRuled();

        Round[] storage rounds = appealRoundsMap[_localDisputeId];
        if (_roundIndex >= rounds.length) return 0;

        Round storage round = rounds[_roundIndex];
        amount = _previewWithdrawableAmount(
            round,
            _contributor,
            _ruling,
            disputeData.ruling
        );

        if (amount != 0) {
            round.contributions[_contributor][_ruling] = 0;
            (bool s, ) = _contributor.call{value: amount}("");
            s; // deliberately ignoring failure to match Kleros' pattern
            emit Withdrawal(
                _localDisputeId,
                _roundIndex,
                _ruling,
                _contributor,
                amount
            );
        }
    }

    /// @notice Withdraw reimbursable fees and/or rewards for all rounds
    function withdrawFeesAndRewardsForAllRounds(
        uint256 _localDisputeId,
        address payable _contributor,
        uint256 _ruling
    ) external override {
        uint256 n = appealRoundsMap[_localDisputeId].length;
        for (uint256 i; i < n; i++) {
            withdrawFeesAndRewards(_localDisputeId, _contributor, i, _ruling);
        }
    }

    /// @notice Sum of withdrawable amounts across all rounds
    function getTotalWithdrawableAmount(
        uint256 _localDisputeId,
        address payable _contributor,
        uint256 _ruling
    ) external view override returns (uint256 sum) {
        if (_localDisputeId >= disputes.length) return 0;
        if (locked) return 0;
        DisputeData storage disputeData = disputes[_localDisputeId];
        if (!disputeData.isRuled) return 0;

        Round[] storage rounds = appealRoundsMap[_localDisputeId];
        uint256 n = rounds.length;
        for (uint256 i; i < n; i++) {
            Round storage round = rounds[i];
            sum += _previewWithdrawableAmount(
                round,
                _contributor,
                _ruling,
                disputeData.ruling
            );
        }
    }

    /**
     * @notice Rules on a dispute through arbitrator resolver with predefined award distribution
     * @param _externalDisputeId The ID of the dispute being ruled on
     * @param _ruling The arbitrator's ruling (0=refused/split, 1=client wins, 2=provider wins)
     * @dev Only callable by arbitrator resolver when contract is locked
     * @dev Awards are distributed based on predefined ruling ratios
     * @dev No resolution fee is charged for arbitrator rulings
     */
    function rule(
        uint256 _externalDisputeId,
        uint256 _ruling
    ) external override nonReentrant {
        if (!locked) revert NotLocked();
        if (msg.sender != address(resolver)) revert NotResolver(msg.sender);
        if (_ruling > NUM_RULING_OPTIONS) revert InvalidRuling(_ruling);

        uint256 localDisputeId = externalIDtoLocalID[_externalDisputeId];
        DisputeData storage disputeData = disputes[localDisputeId];
        if (disputeData.isRuled) revert DisputeAlreadyRuled();
        if (disputeData.externalDisputeId != _externalDisputeId)
            revert IncorrectDisputeId();

        // Mark ruling
        disputeData.ruling = _ruling;
        disputeData.isRuled = true;

        Round[] storage rounds = appealRoundsMap[localDisputeId];

        // If only one ruling option was funded in the last round, it wins by default.
        Round storage lastRound = rounds[rounds.length - 1];
        if (lastRound.fundedRulings.length == 1) {
            disputeData.ruling = lastRound.fundedRulings[0];
        }

        // Distribute escrowed tokens according to ruling
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();

        (uint8 clientShare, uint8 providerShare) = _getRuling(_ruling);
        uint8 denom = clientShare + providerShare;
        uint256 providerAward = (balance * providerShare) / denom;
        uint256 clientAward = balance - providerAward;

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

        emit Rule(resolver, clientAward, providerAward, _ruling);
        emit Ruling(resolver, _externalDisputeId, _ruling);
    }

    /// @notice Number of ruling options for the single local dispute (id must be 0)
    function numberOfRulingOptions(
        uint256
    ) external pure override returns (uint256 count) {
        return NUM_RULING_OPTIONS;
    }

    // solhint-disable-next-line named-return-values
    function getMultipliers()
        external
        pure
        override
        returns (uint256, uint256, uint256, uint256)
    {
        return (
            WINNER_STAKE_MULTIPLIER,
            LOSER_STAKE_MULTIPLIER,
            LOSER_APPEAL_PERIOD_MULTIPLIER,
            BPS_DENOMINATOR
        );
    }

    /**
     * @dev Internal function to get the ruling distribution based on arbitrator decision
     * @param _ruling The ruling of the arbitrator (0=refused, 1=client wins, 2=provider wins)
     * @return clientShare The share of the total award allocated to the client
     * @return providerShare The share of the total award allocated to the provider
     */
    function _getRuling(
        uint256 _ruling
    ) internal pure returns (uint8 clientShare, uint8 providerShare) {
        if (_ruling == 1) return (1, 0); // client wins
        if (_ruling == 2) return (0, 1); // provider wins
        return (1, 1); // split / refused
    }

    /// @dev Kleros-style appeal period check: losers get shorter window
    function _checkAppealPeriod(
        uint256 _localDisputeId,
        uint256 _ruling,
        uint256 _currentRuling
    ) internal view {
        DisputeData storage disputeData = disputes[_localDisputeId];

        (uint256 originalStart, uint256 originalEnd) = resolver.appealPeriod(
            disputeData.externalDisputeId
        );
        if (block.timestamp < originalStart) {
            revert AppealPeriodNotStarted();
        }
        if (_currentRuling == _ruling) {
            if (block.timestamp >= originalEnd) {
                revert AppealPeriodEnded();
            }
        } else {
            uint256 loserEnd = originalStart +
                ((originalEnd - originalStart) *
                    LOSER_APPEAL_PERIOD_MULTIPLIER) /
                BPS_DENOMINATOR;
            if (block.timestamp >= loserEnd) {
                revert AppealPeriodEnded();
            }
        }
    }

    /// @dev Kleros-style appeal cost with stake multiplier
    function _appealCost(
        uint256 _localDisputeId,
        uint256 _ruling,
        uint256 _currentRuling
    ) internal view returns (uint256 originalCost, uint256 specificCost) {
        DisputeData storage disputeData = disputes[_localDisputeId];

        uint256 multiplier = (_ruling == _currentRuling)
            ? WINNER_STAKE_MULTIPLIER
            : LOSER_STAKE_MULTIPLIER;

        uint256 appealFee = resolver.appealCost(
            disputeData.externalDisputeId,
            arbitratorExtraData
        );
        return (
            appealFee,
            appealFee + ((appealFee * multiplier) / BPS_DENOMINATOR)
        );
    }

    /// @dev Compute withdrawable amount, used in both view and state-mutating paths
    function _previewWithdrawableAmount(
        Round storage _round,
        address _contributor,
        uint256 _ruling,
        uint256 _finalRuling
    ) internal view returns (uint256 amount) {
        if (!_round.hasPaid[_ruling]) {
            // Funding unsuccessful for this ruling option => reimburse contribution
            amount = _round.contributions[_contributor][_ruling];
        } else {
            // Funding was successful for this ruling option.
            if (_ruling == _finalRuling) {
                // Winner gets pro-rata share of the round pot
                uint256 paid = _round.paidFees[_ruling];
                amount = paid > 0
                    ? (_round.contributions[_contributor][_ruling] *
                        _round.feeRewards) / paid
                    : 0;
            } else if (!_round.hasPaid[_finalRuling]) {
                // The ultimate winner wasn't funded that round => funded side(s) win by default.
                // Prize is split among contributors of the funded side(s).
                uint256 denom = 0;
                if (_round.fundedRulings.length > 0) {
                    // Safe: length is either 1 or 2 by construction
                    denom += _round.paidFees[_round.fundedRulings[0]];
                    if (_round.fundedRulings.length > 1)
                        denom += _round.paidFees[_round.fundedRulings[1]];
                }
                if (denom > 0) {
                    amount =
                        (_round.contributions[_contributor][_ruling] *
                            _round.feeRewards) /
                        denom;
                }
            }
        }
    }
}
