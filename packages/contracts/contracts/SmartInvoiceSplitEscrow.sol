// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/ISmartInvoiceEscrow.sol";
import "./interfaces/ISmartInvoiceFactory.sol";
import "./interfaces/IArbitrable.sol";
import "./interfaces/IArbitrator.sol";
import "./interfaces/IWRAPPED.sol";

// splittable digital deal lockers w/ embedded arbitration tailored for guild work
contract SmartInvoiceSplitEscrow is
    ISmartInvoiceEscrow,
    IArbitrable,
    Initializable,
    Context,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    uint256 public constant NUM_RULING_OPTIONS = 5; // excludes options 0, 1 and 2
    // Note that Aragon Court treats the possible outcomes as arbitrary numbers, leaving the Arbitrable (us) to define how to understand them.
    // Some outcomes [0, 1, and 2] are reserved by Aragon Court: "missing", "leaked", and "refused", respectively.
    // Note that Aragon Court emits the LOWEST outcome in the event of a tie.

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

    enum ADR {
        INDIVIDUAL,
        ARBITRATOR
    }

    address public client;
    address public provider;
    address public dao;
    uint256 public daoFee;
    ADR public resolverType;
    address public resolver;
    address public token;
    uint256 public terminationTime;
    uint256 public resolutionRate;
    bytes32 public details;
    mapping(uint256 => bool) public milestoneReleased;
    uint256 internal _remaining;

    uint256[] public amounts; // milestones split into amounts
    uint256 public total = 0;
    bool public locked;
    uint256 public milestone = 0; // current milestone - starts from 0 to amounts.length
    uint256 public released = 0;
    uint256 public disputeId;

    event MilestonesAdded(
        address indexed sender,
        address indexed invoice,
        uint256[] milestones
    );
    event DetailsUpdated(address indexed sender, bytes32 details);
    event Deposit(address indexed sender, uint256 amount);
    event Release(uint256 milestone, uint256 amount);
    event Withdraw(uint256 balance);
    event Lock(address indexed sender, bytes32 details);
    event Resolve(
        address indexed resolver,
        uint256 clientAward,
        uint256 providerAward,
        uint256 resolutionFee,
        bytes32 details
    );
    event Rule(
        address indexed resolver,
        uint256 clientAward,
        uint256 providerAward,
        uint256 ruling
    );
    event Verified(address indexed client, address indexed invoice);

    // solhint-disable-next-line no-empty-blocks
    function initLock() external initializer {}

    /**
     * @dev Initializes the contract with the provided recipient, amounts, and data.
     * @param _recipient The address of the recipient
     * @param _amounts The array of amounts associated with the recipient
     * @param _data The additional data needed for initialization
     * #todo rename recipient parameter to provider for consistency
     */
    function init(
        address _recipient,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external override initializer {
        require(_recipient != address(0), "invalid provider");

        _handleData(_data);

        provider = _recipient;
        amounts = _amounts;
        uint256 _total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            _total += amounts[i];
        }
        total = _total;
        _remaining = amounts.length;
    }

    /**
     * @dev Handles the provided data, decodes it, and initializes necessary contract state variables.
     * @param _data The data to be handled and decoded
     */
    function _handleData(bytes calldata _data) internal {
        (
            address _client,
            uint8 _resolverType,
            address _resolver,
            address _token,
            uint256 _terminationTime, // exact termination date in seconds since epoch
            bytes32 _details,
            address _wrappedNativeToken,
            bool _requireVerification,
            address _factory,
            address _dao,
            uint256 _daoFee
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
                    uint256
                )
            );

        uint256 _resolutionRate = ISmartInvoiceFactory(_factory)
            .resolutionRateOf(_resolver);
        if (_resolutionRate == 0) {
            _resolutionRate = 20;
        }

        require(_client != address(0), "invalid client");
        require(_resolverType <= uint8(ADR.ARBITRATOR), "invalid resolverType");
        require(_resolver != address(0), "invalid resolver");
        require(_token != address(0), "invalid token");
        require(_terminationTime > block.timestamp, "duration ended");
        require(
            _terminationTime <= block.timestamp + MAX_TERMINATION_TIME,
            "duration too long"
        );
        require(_resolutionRate > 0, "invalid resolutionRate");
        require(
            _wrappedNativeToken != address(0),
            "invalid wrappedNativeToken"
        );
        if (_daoFee > 0) require(_dao != address(0), "invalid dao");

        client = _client;
        resolverType = ADR(_resolverType);
        resolver = _resolver;
        token = _token;
        terminationTime = _terminationTime;
        resolutionRate = _resolutionRate;
        details = _details;
        wrappedNativeToken = _wrappedNativeToken;
        dao = _dao;
        daoFee = _daoFee;

        if (!_requireVerification) emit Verified(client, address(this));
    }

    /**
     * @dev Verifies the client and contract are paired
     */
    function verify() external {
        require(msg.sender == client, "!client");
        emit Verified(client, address(this));
    }

    /**
     * @dev Adds milestones without extra details.
     * @param _milestones The array of new milestones to be added
     */
    function addMilestones(uint256[] calldata _milestones) external {
        _addMilestones(_milestones, bytes32(0));
    }

    /**
     * @dev Adds milestones with extra details.
     * @param _milestones The array of new milestones to be added
     * @param _details Additional details for the milestones
     */
    function addMilestones(uint256[] calldata _milestones, bytes32 _details)
        external
    {
        _addMilestones(_milestones, _details);
    }

    /**
     * @dev Internal function to add milestones and update the contract state.
     * @param _milestones The array of new milestones to be added
     * @param _details Additional details for the milestones
     */
    function _addMilestones(uint256[] calldata _milestones, bytes32 _details)
        internal
    {
        require(!locked, "locked");
        require(block.timestamp < terminationTime, "terminated");
        require(_msgSender() == client || _msgSender() == provider, "!party");
        require(_milestones.length > 0, "no milestones are being added");
        require(_milestones.length <= 10, "only 10 new milestones at a time");

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
    function _release(uint256 _milestone) internal {
        // client transfers locker milestone funds to provider and dao

        require(!locked, "locked");
        require(_msgSender() == client, "!client");
        require(_milestone < amounts.length, "invalid milestone");

        uint256 balance = IERC20(token).balanceOf(address(this));

        if (_remaining >= 1) {
            uint256 amount = amounts[_milestone];
            if (_remaining == 1 && amount < balance) {
                amount = balance;
            }
            require(balance >= amount, "insufficient balance");

            // milestone = milestone + 1;
            milestoneReleased[_milestone] = true;
            uint256 daoAmount = (amount * daoFee) / 10000;
            uint256 providerAmount = amount - daoAmount;
            IERC20(token).safeTransfer(dao, daoAmount);
            IERC20(token).safeTransfer(provider, providerAmount);
            released = released + amount;
            unchecked {
                _remaining = _remaining - 1;
            }
            emit Release(_milestone, amount);
        } else {
            require(balance > 0, "balance is 0");

            uint256 daoAmount = (balance * daoFee) / 10000;
            uint256 providerAmount = balance - daoAmount;
            IERC20(token).safeTransfer(dao, daoAmount);
            IERC20(token).safeTransfer(provider, providerAmount);
            released = released + balance;
            emit Release(_milestone, balance);
        }
    }

    /**
     * @dev Internal function to release funds from the contract to the provider.
     */
    function _release() internal {
        // client transfers locker milestone funds to provider and dao
        uint256 currentMilestone = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (milestoneReleased[i] == false) {
                currentMilestone = i;
                break;
            }
        }
        _release(currentMilestone);
    }

    /**
     * @dev External function to release funds from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     */
    function release() external override nonReentrant {
        return _release();
    }

    /** @dev External function to release funds from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     * @param _milestone The milestone to release funds to
     */
    function release(uint256 _milestone) external override nonReentrant {
        // client transfers locker funds upto certain milestone to provider and dao
        require(_milestone < amounts.length, "invalid milestone");
        _release(_milestone);
    }

    /** @dev External function to release funds from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     * @param _milestones The milestones to release funds
     */
    function release(uint256[] calldata _milestones) external nonReentrant {
        // client transfers locker funds upto certain milestone to provider and dao
        require(!locked, "locked");
        require(_msgSender() == client, "!client");
        // require(_milestones >= milestone, "milestone passed");
        for (uint256 i = 0; i < _milestones.length; i++) {
            require(_milestones[i] < amounts.length, "invalid milestone");
            require(
                !milestoneReleased[_milestones[i]],
                "milestone already released"
            );
        }

        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 amount = 0;
        uint256 index = 0;
        uint256 remaining = _remaining - _milestones.length;
        for (uint256 j = 0; j < _milestones.length; j++) {
            index = _milestones[j];
            if (milestoneReleased[index]) {
                for (uint256 x = 0; x < j; x++) {
                    milestoneReleased[_milestones[x]] = false;
                }
                revert("duplicate milestone");
            }
            if (remaining == 1 && amount + amounts[index] < balance) {
                emit Release(index, balance - amount);
                amount = balance;
            } else {
                emit Release(index, amounts[index]);
                amount = amount + amounts[index];
            }
            milestoneReleased[index] = true;
        }
        require(balance >= amount, "insufficient balance");

        uint256 daoAmount = (amount * daoFee) / 10000;
        uint256 providerAmount = amount - daoAmount;
        IERC20(token).safeTransfer(dao, daoAmount);
        IERC20(token).safeTransfer(provider, providerAmount);
        released = released + amount;
        _remaining = remaining;
    }

    /**
     * @dev External function to release funds from the contract to the provider.
     * Uses the internal `_release` function to perform the actual release.
     * @param _token The milestones to release funds to
     */
    function releaseTokens(address _token) external override nonReentrant {
        if (_token == token) {
            _release();
        } else {
            require(_msgSender() == client, "!client");
            uint256 balance = IERC20(_token).balanceOf(address(this));
            IERC20(_token).safeTransfer(provider, balance);
        }
    }

    /**
     * @dev Internal function to withdraw funds from the contract to the client.
     */
    function _withdraw() internal {
        require(!locked, "locked");
        require(block.timestamp > terminationTime, "!terminated");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "balance is 0");

        IERC20(token).safeTransfer(client, balance);
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
     * @dev External function to withdraw funds from the contract to the client.
     * Uses the internal `_withdraw` function to perform the actual withdrawal.
     * @param _token The token to withdraw
     */
    function withdrawTokens(address _token) external override nonReentrant {
        if (_token == token) {
            _withdraw();
        } else {
            require(block.timestamp > terminationTime, "!terminated");
            uint256 balance = IERC20(_token).balanceOf(address(this));
            require(balance > 0, "balance is 0");

            IERC20(_token).safeTransfer(client, balance);
        }
    }

    /**
     * @dev External function to lock the contract.
     * @param _details Details of the dispute
     */
    function lock(bytes32 _details) external payable override nonReentrant {
        require(!locked, "locked");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "balance is 0");
        require(block.timestamp < terminationTime, "terminated");
        require(_msgSender() == client || _msgSender() == provider, "!party");

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
     * @dev External function to unlock the contract.
     * @param _clientAward The amount to award the client
     * @param _providerAward The amount to award the provider
     * @param _details Details of the dispute
     */
    function resolve(
        uint256 _clientAward,
        uint256 _providerAward,
        bytes32 _details
    ) external override nonReentrant {
        // called by individual
        require(resolverType == ADR.INDIVIDUAL, "!individual resolver");
        require(locked, "!locked");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "balance is 0");
        require(_msgSender() == resolver, "!resolver");

        uint256 resolutionFee = balance / resolutionRate; // calculates dispute resolution fee (div(20) = 5% of remainder)

        require(
            _clientAward + _providerAward == balance - resolutionFee,
            "resolution != remainder"
        );

        if (_providerAward > 0) {
            uint256 fee = (_providerAward * daoFee) / 10000;
            IERC20(token).safeTransfer(dao, fee);
            IERC20(token).safeTransfer(provider, _providerAward - fee);
        }
        if (_clientAward > 0) {
            IERC20(token).safeTransfer(client, _clientAward);
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
     * @dev External function to unlock the contract.
     * @param _disputeId The ID of the dispute
     * @param _ruling The ruling of the arbitrator
     */
    function rule(uint256 _disputeId, uint256 _ruling)
        external
        override
        nonReentrant
    {
        // called by arbitrator
        require(resolverType == ADR.ARBITRATOR, "!arbitrator resolver");
        require(locked, "!locked");
        require(_msgSender() == resolver, "!resolver");
        require(_disputeId == disputeId, "incorrect disputeId");
        require(_ruling <= NUM_RULING_OPTIONS, "invalid ruling");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "balance is 0");

        uint8[2] memory ruling = _getRuling(_ruling);
        uint8 clientShare = ruling[0];
        uint8 providerShare = ruling[1];
        uint8 denom = clientShare + providerShare;
        uint256 providerAward = (balance * providerShare) / denom;
        uint256 clientAward = balance - providerAward;

        if (providerAward > 0) {
            uint256 fee = (providerAward * daoFee) / 10000;
            IERC20(token).safeTransfer(dao, fee);
            IERC20(token).safeTransfer(provider, providerAward - fee);
        }
        if (clientAward > 0) {
            IERC20(token).safeTransfer(client, clientAward);
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
    function _getRuling(uint256 _ruling)
        internal
        pure
        returns (uint8[2] memory ruling)
    {
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

    // receive eth transfers
    receive() external payable {
        require(!locked, "locked");
        require(token == wrappedNativeToken, "!wrappedNativeToken");
        IWRAPPED(wrappedNativeToken).deposit{value: msg.value}();
        emit Deposit(_msgSender(), msg.value);
    }
}
