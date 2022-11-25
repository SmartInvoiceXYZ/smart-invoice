// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ISmartInvoice.sol";

interface ISmartInvoiceInstant is ISmartInvoice {
    function withdraw() external;

    function withdrawTokens(address _token) external;

    function depositTokens(address _token, uint256 _amount) external;

    function getTotalDue() external view returns (uint256);
}
