// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/// @title MockWETH
/// @notice A mock contract simulating the behavior of Wrapped Ether (WETH) for testing purposes.
contract MockWETH {
    /// @notice The name of the token.
    string public constant name = "Wrapped Ether";

    /// @notice The symbol of the token.
    string public constant symbol = "WETH";

    /// @notice The number of decimals the token uses.
    uint8 public constant decimals = 18;

    /// @dev Error indicating that the sender has insufficient balance for a withdrawal or transfer.
    error NotEnoughBalance();

    /// @dev Error indicating that the sender has insufficient allowance for a transfer.
    error NotEnoughAllowance();

    /// @notice Emitted when a successful approval is made.
    /// @param src The address of the owner of the funds.
    /// @param guy The address of the spender.
    /// @param wad The amount of tokens approved for spending.
    event Approval(address indexed src, address indexed guy, uint256 wad);

    /// @notice Emitted when a successful transfer is made.
    /// @param src The address of the sender.
    /// @param dst The address of the recipient.
    /// @param wad The amount of tokens transferred.
    event Transfer(address indexed src, address indexed dst, uint256 wad);

    /// @notice Emitted when a deposit is made to the contract.
    /// @param dst The address of the account receiving the deposit.
    /// @param wad The amount of Ether deposited.
    event Deposit(address indexed dst, uint256 wad);

    /// @notice Emitted when a withdrawal is made from the contract.
    /// @param src The address of the account making the withdrawal.
    /// @param wad The amount of Ether withdrawn.
    event Withdrawal(address indexed src, uint256 wad);

    /// @notice Mapping to track the balance of each address.
    mapping(address => uint256) public balanceOf;

    /// @notice Mapping to track the allowance for each address and spender.
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Fallback function to handle incoming Ether deposits.
    receive() external payable {
        deposit();
    }

    /**
     * @notice Deposits Ether into the contract and credits it to the sender's balance.
     */
    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraws Ether from the contract.
     * @param wad The amount of Ether to withdraw.
     */
    function withdraw(uint256 wad) public {
        if (balanceOf[msg.sender] < wad) {
            revert NotEnoughBalance();
        }
        balanceOf[msg.sender] -= wad;
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }

    /**
     * @notice Returns the total supply of wrapped Ether in the contract.
     * @return The total supply of wrapped Ether.
     */
    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Approves a spender to transfer up to a specified amount of tokens on behalf of the sender.
     * @param guy The address of the spender.
     * @param wad The amount of tokens to approve for spending.
     * @return A boolean value indicating whether the operation succeeded.
     */
    function approve(address guy, uint256 wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    /**
     * @notice Transfers tokens from the sender's address to a specified recipient.
     * @param dst The address of the recipient.
     * @param wad The amount of tokens to transfer.
     * @return A boolean value indicating whether the operation succeeded.
     */
    function transfer(address dst, uint256 wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    /**
     * @notice Transfers tokens from a specified address to a recipient using an allowance mechanism.
     * @param src The address from which the tokens are to be transferred.
     * @param dst The address of the recipient.
     * @param wad The amount of tokens to transfer.
     * @return A boolean value indicating whether the operation succeeded.
     */
    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) public returns (bool) {
        if (balanceOf[src] < wad) {
            revert NotEnoughBalance();
        }

        if (
            src != msg.sender && allowance[src][msg.sender] != type(uint256).max
        ) {
            if (allowance[src][msg.sender] < wad) {
                revert NotEnoughAllowance();
            }
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }
}
