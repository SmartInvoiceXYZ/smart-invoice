// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SmartInvoice.sol";

contract SmartInvoiceFactory {
  using SafeMath for uint256;

  uint256 public invoiceCount = 0;
  mapping(uint256 => address) internal _invoices;
  mapping(address => uint256) public resolutionRates;
  uint256 public constant MAX_DURATION = 63113904; // 2-year limit on locker

  event LogNewInvoice(
    uint256 indexed index,
    address invoice,
    uint256[] amounts
  );
  event UpdateResolutionRate(
    address indexed resolver,
    uint256 indexed resolutionRate,
    bytes32 details
  );

  function create(
    address _client,
    address _provider,
    uint8 _resolverType,
    address _resolver,
    address _token,
    uint256[] memory _amounts,
    uint256 _terminationTime,
    bytes32 _details
  ) public returns (address) {
    require(_terminationTime > block.timestamp, "duration ended");
    require(
      _terminationTime <= block.timestamp.add(MAX_DURATION),
      "duration too long"
    );

    uint256 resolutionRate = resolutionRates[_resolver];
    if (resolutionRate == 0) {
      resolutionRate = 20;
    }

    SmartInvoice invoice =
      new SmartInvoice(
        _client,
        _provider,
        _resolverType,
        _resolver,
        _token,
        _amounts,
        _terminationTime,
        resolutionRate,
        _details
      );

    address invoiceAddress = address(invoice);

    uint256 invoiceId = invoiceCount;
    _invoices[invoiceId] = invoiceAddress;
    invoiceCount = invoiceCount.add(1);

    emit LogNewInvoice(invoiceId, invoiceAddress, _amounts);
    return invoiceAddress;
  }

  function getInvoiceAddress(uint256 _index) public view returns (address) {
    return _invoices[_index];
  }

  function updateResolutionRate(uint256 _resolutionRate, bytes32 _details)
    external
  {
    resolutionRates[msg.sender] = _resolutionRate;
    emit UpdateResolutionRate(msg.sender, _resolutionRate, _details);
  }
}
