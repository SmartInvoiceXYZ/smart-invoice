// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, max-states-count

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SmartInvoiceEscrow.sol";

// splittable digital deal lockers w/ embedded arbitration tailored for guild work
contract SmartInvoiceSplitEscrow is SmartInvoiceEscrow {
    using SafeERC20 for IERC20;

    address public dao;
    uint256 public daoFee;

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

        if (_daoFee > 0) require(_dao != address(0), "invalid dao");

        require(_client != address(0), "invalid client");
        require(_resolverType <= uint8(ADR.ARBITRATOR), "invalid resolverType");
        require(_resolver != address(0), "invalid resolver");
        require(_token != address(0), "invalid token");
        require(_terminationTime > block.timestamp, "duration ended");
        require(
            _terminationTime <= block.timestamp + MAX_TERMINATION_TIME,
            "duration too long"
        );
        require(
            _wrappedNativeToken != address(0),
            "invalid wrappedNativeToken"
        );
        uint256 _resolutionRate = ISmartInvoiceFactory(_factory)
            .resolutionRateOf(_resolver);
        if (_resolutionRate == 0) {
            _resolutionRate = 20;
        }

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

    function _transferPayment(address _token, uint256 _amount)
        internal
        virtual
        override
    {
        uint256 daoAmount;
        unchecked {
            daoAmount = (_amount * daoFee) / 10000;
        }
        IERC20(_token).safeTransfer(dao, daoAmount);
        IERC20(_token).safeTransfer(provider, _amount - daoAmount);
    }
}
