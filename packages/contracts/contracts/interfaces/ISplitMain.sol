// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ISplitMain
 * @notice Interface for SplitMain, managing the creation, updating, and distribution of ETH and ERC20 tokens via splits.
 * @dev This interface provides functions for creating, updating, and distributing funds via splits, with event emissions for tracking.
 */
interface ISplitMain {
    /**
     * @notice Returns the address of the wallet implementation used in splits.
     * @return The address of the wallet implementation.
     */
    function walletImplementation() external returns (address);

    /**
     * @notice Creates a new split with specified accounts and allocations.
     * @param accounts The list of accounts to be included in the split.
     * @param percentAllocations The list of percentage allocations corresponding to each account.
     * @param distributorFee The fee for the distributor.
     * @param controller The address of the controller for the split.
     * @return The address of the created split.
     */
    function createSplit(
        address[] calldata accounts,
        uint32[] calldata percentAllocations,
        uint32 distributorFee,
        address controller
    ) external returns (address);

    /**
     * @notice Predicts the address of an immutable split given the parameters.
     * @param accounts The list of accounts to be included in the split.
     * @param percentAllocations The list of percentage allocations corresponding to each account.
     * @param distributorFee The fee for the distributor.
     * @return The predicted address of the split.
     */
    function predictImmutableSplitAddress(
        address[] calldata accounts,
        uint32[] calldata percentAllocations,
        uint32 distributorFee
    ) external view returns (address);

    /**
     * @notice Updates an existing split with new accounts and allocations.
     * @param split The address of the split to be updated.
     * @param accounts The new list of accounts for the split.
     * @param percentAllocations The new list of percentage allocations.
     * @param distributorFee The new distributor fee.
     */
    function updateSplit(
        address split,
        address[] calldata accounts,
        uint32[] calldata percentAllocations,
        uint32 distributorFee
    ) external;

    /**
     * @notice Initiates a control transfer of a split to a new controller.
     * @param split The address of the split.
     * @param newController The address of the new controller.
     */
    function transferControl(address split, address newController) external;

    /**
     * @notice Cancels a pending control transfer of a split.
     * @param split The address of the split.
     */
    function cancelControlTransfer(address split) external;

    /**
     * @notice Accepts a pending control transfer of a split.
     * @param split The address of the split.
     */
    function acceptControl(address split) external;

    /**
     * @notice Makes a split immutable, preventing further updates.
     * @param split The address of the split to be made immutable.
     */
    function makeSplitImmutable(address split) external;

    /**
     * @notice Distributes ETH from a split according to the specified allocations.
     * @param split The address of the split.
     * @param accounts The list of accounts to receive ETH.
     * @param percentAllocations The list of percentage allocations corresponding to each account.
     * @param distributorFee The fee for the distributor.
     * @param distributorAddress The address to receive the distributor fee.
     */
    function distributeETH(
        address split,
        address[] calldata accounts,
        uint32[] calldata percentAllocations,
        uint32 distributorFee,
        address distributorAddress
    ) external;

    /**
     * @notice Updates and distributes ETH from a split according to new allocations.
     * @param split The address of the split.
     * @param accounts The list of accounts to receive ETH.
     * @param percentAllocations The new list of percentage allocations.
     * @param distributorFee The new distributor fee.
     * @param distributorAddress The address to receive the distributor fee.
     */
    function updateAndDistributeETH(
        address split,
        address[] calldata accounts,
        uint32[] calldata percentAllocations,
        uint32 distributorFee,
        address distributorAddress
    ) external;

    /**
     * @notice Distributes ERC20 tokens from a split according to the specified allocations.
     * @param split The address of the split.
     * @param token The ERC20 token to distribute.
     * @param accounts The list of accounts to receive the tokens.
     * @param percentAllocations The list of percentage allocations corresponding to each account.
     * @param distributorFee The fee for the distributor.
     * @param distributorAddress The address to receive the distributor fee.
     */
    function distributeERC20(
        address split,
        IERC20 token,
        address[] calldata accounts,
        uint32[] calldata percentAllocations,
        uint32 distributorFee,
        address distributorAddress
    ) external;

    /**
     * @notice Updates and distributes ERC20 tokens from a split according to new allocations.
     * @param split The address of the split.
     * @param token The ERC20 token to distribute.
     * @param accounts The list of accounts to receive the tokens.
     * @param percentAllocations The new list of percentage allocations.
     * @param distributorFee The new distributor fee.
     * @param distributorAddress The address to receive the distributor fee.
     */
    function updateAndDistributeERC20(
        address split,
        IERC20 token,
        address[] calldata accounts,
        uint32[] calldata percentAllocations,
        uint32 distributorFee,
        address distributorAddress
    ) external;

    /**
     * @notice Withdraws ETH and ERC20 tokens to a specified account.
     * @param account The address to withdraw funds to.
     * @param withdrawETH The amount of ETH to withdraw.
     * @param tokens The list of ERC20 tokens to withdraw.
     */
    function withdraw(
        address account,
        uint256 withdrawETH,
        IERC20[] calldata tokens
    ) external;

    /**
     * EVENTS
     */

    /**
     * @notice Emitted after each successful split creation.
     * @param split Address of the created split.
     */
    event CreateSplit(address indexed split);

    /**
     * @notice Emitted after each successful split update.
     * @param split Address of the updated split.
     */
    event UpdateSplit(address indexed split);

    /**
     * @notice Emitted after each initiated split control transfer.
     * @param split Address of the split for which control transfer was initiated.
     * @param newPotentialController Address of the split's new potential controller.
     */
    event InitiateControlTransfer(
        address indexed split,
        address indexed newPotentialController
    );

    /**
     * @notice Emitted after each canceled split control transfer.
     * @param split Address of the split for which control transfer was canceled.
     */
    event CancelControlTransfer(address indexed split);

    /**
     * @notice Emitted after each successful split control transfer.
     * @param split Address of the split for which control was transferred.
     * @param previousController Address of the split's previous controller.
     * @param newController Address of the split's new controller.
     */
    event ControlTransfer(
        address indexed split,
        address indexed previousController,
        address indexed newController
    );

    /**
     * @notice Emitted after each successful ETH balance distribution.
     * @param split Address of the split that distributed its balance.
     * @param amount Amount of ETH distributed.
     * @param distributorAddress Address credited with the distributor fee.
     */
    event DistributeETH(
        address indexed split,
        uint256 amount,
        address indexed distributorAddress
    );

    /**
     * @notice Emitted after each successful ERC20 balance distribution.
     * @param split Address of the split that distributed its balance.
     * @param token Address of the ERC20 token distributed.
     * @param amount Amount of ERC20 tokens distributed.
     * @param distributorAddress Address credited with the distributor fee.
     */
    event DistributeERC20(
        address indexed split,
        IERC20 indexed token,
        uint256 amount,
        address indexed distributorAddress
    );

    /**
     * @notice Emitted after each successful withdrawal.
     * @param account Address that funds were withdrawn to.
     * @param ethAmount Amount of ETH withdrawn.
     * @param tokens Addresses of ERC20 tokens withdrawn.
     * @param tokenAmounts Amounts of corresponding ERC20 tokens withdrawn.
     */
    event Withdrawal(
        address indexed account,
        uint256 ethAmount,
        IERC20[] tokens,
        uint256[] tokenAmounts
    );
}
