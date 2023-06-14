// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
// import "./interfaces/ISmartInvoiceEscrow.sol";
// import "./interfaces/ISmartInvoiceFactory.sol";
// import "./interfaces/IArbitrable.sol";
// import "./interfaces/IArbitrator.sol";
// import "./interfaces/IWRAPPED.sol";
import "./SmartInvoiceEscrow.sol";

// splittable digital deal lockers w/ embedded arbitration tailored for guild work
contract SmartInvoiceSplitEscrow is SmartInvoiceEscrow {
    using SafeERC20 for IERC20;

    address public dao;
    uint256 public daoFee;
    mapping(uint256 => bool) public milestoneReleased;
    uint256 internal _remaining;

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
    function _handleData(bytes calldata _data) internal override {
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
    function _release() internal override {
        // client transfers locker milestone funds to provider and dao
        uint256 currentMilestone = amounts.length - 1;
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
        require(!milestoneReleased[_milestone], "milestone already released");
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
}
