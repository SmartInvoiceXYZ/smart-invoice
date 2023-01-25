// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/ISmartInvoiceInstant.sol";
import "./interfaces/IWRAPPED.sol";

import "hardhat/console.sol";

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
    uint256 public fulfillTime = 0;
    uint256 public constant MAX_DEADLINE = 63113904; // 2-year limit on locker

    uint256 public lateFee = 0;
    uint256 public lateFeeTimeInterval = 0;

    event Deposit(address indexed sender, uint256 amount);
    event Fulfilled(address indexed sender);
    event Tip(address indexed sender, uint256 amount);
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
    function getTotalDue() public view override returns (uint256) {
        uint256 totalLateFee = 0;
        if (block.timestamp > deadline && deadline > 0) {
            uint256 timeAfterDeadline = 0;
            if (fulfilled && fulfillTime > 0) {
                if (fulfillTime >= deadline) {
                    timeAfterDeadline = fulfillTime - deadline;
                }
            } else {
                timeAfterDeadline = block.timestamp - deadline;
            }
            if (
                timeAfterDeadline >= lateFeeTimeInterval &&
                lateFeeTimeInterval != 0
            ) {
                totalLateFee =
                    lateFee *
                    (timeAfterDeadline / lateFeeTimeInterval);
            } else {
                totalLateFee = 0;
            }
        }
        return total + totalLateFee;
    }

    function depositTokens(address _token, uint256 _amount)
        external
        override
        nonReentrant
    {
        require(_token == token, "!token");
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        _deposit(_amount);
    }

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

    function tip(address _token, uint256 _amount) external nonReentrant {
        require(fulfilled, "!fulfilled");
        require(_token == token, "!token");
        totalFulfilled += _amount;
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        emit Tip(_msgSender(), _amount);
    }

    function _deposit(uint256 _amount) internal {
        uint256 totalDue = getTotalDue();
        totalFulfilled += _amount;
        if (totalFulfilled >= totalDue) {
            fulfilled = true;
            fulfillTime = block.timestamp;
            emit Fulfilled(_msgSender());
            if (totalFulfilled > totalDue)
                emit Tip(_msgSender(), totalFulfilled - totalDue);
        }
        emit Deposit(_msgSender(), _amount);
    }

    function _withdraw() internal {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "balance is 0");
        IERC20(token).safeTransfer(provider, balance);
        emit Withdraw(provider, balance);
    }

    function _handleData(bytes calldata _data) internal {
        (
            address _client,
            address _token,
            uint256 _deadline, // exact termination date in seconds since epoch
            bytes32 _details,
            address _wrappedNativeToken,
            uint256 _lateFee,
            uint256 _lateFeeTimeInterval
        ) = abi.decode(
                _data,
                (address, address, uint256, bytes32, address, uint256, uint256)
            );

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
        lateFee = _lateFee;
        lateFeeTimeInterval = _lateFeeTimeInterval;
    }

    // receive native token transfers
    receive() external payable {
        require(token == wrappedNativeToken, "!wrappedNativeToken");
        IWRAPPED(wrappedNativeToken).deposit{value: msg.value}();
        _deposit(msg.value);
    }
}
