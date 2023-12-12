// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ISmartInvoice} from "./ISmartInvoice.sol";

interface ISmartInvoiceInstant is ISmartInvoice {
    function deadline() external view returns (uint256);

    function depositTokens(address _token, uint256 _amount) external;

    function fulfilled() external view returns (bool);

    function getTotalDue() external view returns (uint256);

    function lateFee() external view returns (uint256);

    function lateFeeTimeInterval() external view returns (uint256);

    function tip(address _token, uint256 _amount) external;

    function totalFulfilled() external view returns (uint256);

    function withdraw() external;

    function withdrawTokens(address _token) external;
}
