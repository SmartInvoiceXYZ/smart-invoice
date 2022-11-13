// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/ISmartInvoiceInstant.sol";
import "./interfaces/IWRAPPED.sol";

contract SmartInvoiceInstant is
    ISmartInvoiceInstant,
    Initializable,
    Context,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public wrappedNativeToken;

    address public client;
    address public provider;
    address public token;
    bytes32 public details;
    uint256 public deadline;

    uint256[] public amounts;
    uint256 public total = 0;
    uint256 public totalFulfilled = 0;
    bool public fulfilled;
    uint256 public constant MAX_DEADLINE = 63113904; // 2-year limit on locker

    event Deposit(address indexed sender, uint256 amount);
    event Withdraw(address indexed recipient, uint256 amount);

    // solhint-disable-next-line no-empty-blocks
    function initLock() external initializer {}

    function init(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external override initializer {
        require(_recipient != address(0), "invalid provider");

        _handleData(_data);

        provider = _recipient;

        uint256 _total = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            _total += _amounts[i];
        }
        total = _total;
    }

    /**
     * @dev calculates the total amount due. Extensible to include late fees, etc.
     */
    function getTotalDue() public view returns (uint256) {
        return total;
    }

    // withdraw locker remainder to client if termination time passes & no lock
    function withdraw() external override nonReentrant {
        return _withdraw();
    }

    // withdraw non-invoice tokens
    function withdrawTokens(address _token) external override nonReentrant {
        if (_token == token) {
            _withdraw();
        } else {
            uint256 balance = IERC20(_token).balanceOf(address(this));
            require(balance > 0, "balance is 0");

            IERC20(_token).safeTransfer(provider, balance);
        }
    }

    function _withdraw() internal {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "balance is 0");

        uint256 totalDue = getTotalDue();
        totalFulfilled = totalFulfilled + balance;
        if (totalFulfilled >= totalDue) {
            fulfilled = true;
        }

        IERC20(token).safeTransfer(provider, balance);

        emit Withdraw(provider, balance);
    }

    function _handleData(bytes calldata _data) internal {
        (
            address _client,
            address _token,
            uint256 _deadline, // exact termination date in seconds since epoch
            bytes32 _details,
            address _wrappedNativeToken
        ) = abi.decode(_data, (address, address, uint256, bytes32, address));

        require(_client != address(0), "invalid client");
        require(_token != address(0), "invalid token");
        require(
            _deadline > block.timestamp || _deadline == 0,
            "duration ended"
        );
        require(
            _deadline <= block.timestamp + MAX_DEADLINE,
            "duration too long"
        );
        require(
            _wrappedNativeToken != address(0),
            "invalid wrappedNativeToken"
        );

        client = _client;
        token = _token;
        deadline = _deadline;
        details = _details;
        wrappedNativeToken = _wrappedNativeToken;
    }

    // receive eth transfers
    receive() external payable {
        require(token == wrappedNativeToken, "!wrappedNativeToken");
        IWRAPPED(wrappedNativeToken).deposit{value: msg.value}();
        emit Deposit(_msgSender(), msg.value);
    }
}
