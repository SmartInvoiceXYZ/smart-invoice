// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {
    SmartInvoiceEscrowCore
} from "contracts/core/SmartInvoiceEscrowCore.sol";

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SmartInvoiceEscrow
/// @notice A comprehensive escrow contract with milestone-based payments, basic dispute resolution, and updatable addresses
/// @dev Supports direct dispute resolution
abstract contract SmartInvoiceEscrow is SmartInvoiceEscrowCore {
    using SafeERC20 for IERC20;

    /// @notice Maximum resolution rate in BPS
    uint256 internal constant _MAX_RESOLUTION_RATE_BPS = 2000;

    /// @notice Address of the dispute resolver
    address public resolver;
    /// @notice Resolution fee rate in basis points (BPS) charged by individual resolvers
    uint256 public resolutionRateBPS;

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

    error InvalidResolutionRate();
    error ResolutionMismatch();
    error UnexpectedEther();

    /**
     * @notice External function to lock the contract and initiate dispute resolution
     *         Can only be called by client or provider before termination
     * @param _disputeURI Off-chain URI for extra evidence/details regarding dispute
     */
    function lock(
        string calldata _disputeURI
    ) external payable virtual override nonReentrant {
        if (msg.value > 0) revert UnexpectedEther();
        _lock(_disputeURI);
    }

    /**
     * @notice Resolves a dispute through individual resolver with specified award amounts
     * @param _refundBPS Percentage of total balance to refund to client
     * @param _resolutionURI URI containing details and reasoning for the resolution
     * @dev Only callable by individual resolver when contract is locked
     * @dev Total awards plus resolution fee must equal contract balance
     * @dev Resolution fee is calculated as (balance * resolutionRateBPS) / 10000
     */
    function resolve(
        uint256 _refundBPS,
        string calldata _resolutionURI
    ) external virtual nonReentrant {
        if (!locked) revert NotLocked();
        if (msg.sender != resolver) revert NotResolver(msg.sender);
        if (_refundBPS > _BPS_DENOMINATOR) revert InvalidRefundBPS();
        if (_refundBPS + resolutionRateBPS > _BPS_DENOMINATOR)
            revert ResolutionMismatch();

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert BalanceIsZero();

        uint256 resolutionFee = (balance * resolutionRateBPS) /
            _BPS_DENOMINATOR;
        uint256 clientAward = (balance * _refundBPS) / _BPS_DENOMINATOR;
        uint256 providerAward = balance - clientAward - resolutionFee;

        // Complete all milestones
        milestone = amounts.length;

        // Reset locked state
        locked = false;

        // Set released state
        released += balance;

        if (providerAward > 0) {
            _transferToProvider(token, providerAward);
        }
        if (clientAward > 0) {
            _transferToClient(token, clientAward);
        }
        if (resolutionFee > 0) {
            _transferToken(token, resolver, resolutionFee);
        }

        emit Resolve(
            msg.sender,
            clientAward,
            providerAward,
            resolutionFee,
            _resolutionURI
        );
    }

    /**
     * @notice Internal helper to handle resolver data
     * @dev Decodes and sets the resolver and its fee cap using a fixed-size payload.
     *      Expects exactly 64 bytes: ABI-encoded `(address resolver, uint256 maxRateBps)`.
     *      Fetches the resolver's actual rate from the factory and enforces:
     *      (1) `actualRate <= maxRateBps` to prevent frontrunning, and
     *      (2) `actualRate <= _MAX_RESOLUTION_RATE_BPS` (global hard cap, e.g. 20%).
     * @param _resolverData ABI-encoded `(address, uint256)`; MUST be exactly 64 bytes.
     */
    function _handleResolverData(bytes memory _resolverData) internal override {
        if (_resolverData.length != 64) revert InvalidResolverData();

        (address _resolver, uint256 _maxRate) = abi.decode(
            _resolverData,
            (address, uint256)
        );
        if (_resolver == address(0)) revert InvalidResolver();

        uint256 _rate = FACTORY.resolutionRateOf(_resolver);
        // user sets max rate to disallow resolver frontrunning
        if (_rate > _maxRate) revert InvalidResolutionRate();
        // force a max of 20 %
        if (_rate > _MAX_RESOLUTION_RATE_BPS) revert InvalidResolutionRate();

        resolver = _resolver;
        resolutionRateBPS = _rate;
    }
}
