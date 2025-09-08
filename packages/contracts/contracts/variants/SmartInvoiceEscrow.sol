// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowBase
} from "contracts/base/SmartInvoiceEscrowBase.sol";

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SmartInvoiceEscrow
/// @notice A comprehensive escrow contract with milestone-based payments, dispute resolution, and updatable addresses
/// @dev Supports direct dispute resolution
contract SmartInvoiceEscrow is SmartInvoiceEscrowBase {
    using SafeERC20 for IERC20;

    error InvalidResolutionRate();
    error ResolutionMismatch();

    uint256 internal constant MAX_RESOLUTION_RATE_BPS = 2000;

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

    /// @notice Address of the dispute resolver
    address public resolver;
    /// @notice Resolution fee rate in basis points (BPS) charged by individual resolvers
    uint256 public resolutionRateBPS;

    constructor(
        address _wrappedETH,
        address _factory
    ) SmartInvoiceEscrowBase(_wrappedETH, _factory) {}

    function _handleResolverData(bytes memory _resolverData) internal override {
        if (_resolverData.length < 64) revert InvalidResolverData();

        (address _resolver, uint256 _maxRate) = abi.decode(
            _resolverData,
            (address, uint256)
        );
        if (_resolver == address(0)) revert InvalidResolver();

        uint256 _rate = FACTORY.resolutionRateOf(_resolver);
        // user sets max rate to disallow resolver frontrunning
        if (_rate > _maxRate) revert InvalidResolutionRate();
        // force a max of 20 %
        if (_rate > MAX_RESOLUTION_RATE_BPS) revert InvalidResolutionRate();

        resolver = _resolver;
        resolutionRateBPS = _rate;
    }

    /**
     * @notice External function to lock the contract and initiate dispute resolution
     *         Can only be called by client or provider before termination
     * @param _disputeURI Off-chain URI for extra evidence/details regarding dispute
     */
    function lock(
        string calldata _disputeURI
    ) external payable virtual override nonReentrant {
        if (locked) revert Locked();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();
        if (block.timestamp > terminationTime) revert Terminated();
        if (msg.sender != client && msg.sender != provider)
            revert NotParty(msg.sender);

        locked = true;

        emit Lock(msg.sender, _disputeURI);
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
    ) external virtual nonReentrant {
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

        // Set released state
        released += balance;

        emit Resolve(
            msg.sender,
            _clientAward,
            _providerAward,
            resolutionFee,
            _resolutionURI
        );
    }
}
