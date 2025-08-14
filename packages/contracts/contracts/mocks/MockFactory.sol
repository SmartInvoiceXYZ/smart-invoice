// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ISmartInvoiceEscrow} from "../interfaces/ISmartInvoiceEscrow.sol";

/// @title Mock Factory Contract
/// @notice This contract simulates the behavior of a factory for testing purposes.
contract MockFactory {
    /// @notice Mapping to store resolution rates for addresses
    mapping(address => uint256) public resolutionRates;

    /// @notice Default resolution rate
    uint256 public defaultResolutionRate = 20;

    /// @notice Set resolution rate for a specific address
    /// @param _resolver The resolver address
    /// @param _resolutionRate The resolution rate to set
    function setResolutionRate(
        address _resolver,
        uint256 _resolutionRate
    ) external {
        resolutionRates[_resolver] = _resolutionRate;
    }

    /// @notice Get resolution rate for an address
    /// @param _resolver The resolver address
    /// @return The resolution rate for the resolver
    function resolutionRateOf(
        address _resolver
    ) external view returns (uint256) {
        uint256 rate = resolutionRates[_resolver];
        return rate == 0 ? defaultResolutionRate : rate;
    }

    /// @notice Call init on an escrow contract (for testing)
    /// @param _escrowImpl The escrow implementation contract address
    /// @param _provider The provider address
    /// @param _amounts The amounts array
    /// @param _data The init data
    function callInit(
        address _escrowImpl,
        address _provider,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external {
        address invoiceAddress = Clones.clone(_escrowImpl);
        ISmartInvoiceEscrow(invoiceAddress).init(_provider, _amounts, _data);
    }
}
