// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SmartInvoice.sol";

contract SmartInvoiceFactory {
  using SafeMath for uint256;

  uint256 public id = 0;
  mapping(uint256 => address) internal _invoices;

  event LogNewInvoice(uint256 indexed id, address invoice, uint256[] amounts);

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
    address invoiceAddress;
    SmartInvoice invoice =
      new SmartInvoice(
        _client,
        _provider,
        _resolverType,
        _resolver,
        _token,
        _amounts,
        _terminationTime,
        _details
      );
    invoiceAddress = address(invoice);

    uint256 invoiceId = id;
    _invoices[invoiceId] = invoiceAddress;
    id = id.add(1);

    emit LogNewInvoice(invoiceId, invoiceAddress, _amounts);
    return invoiceAddress;
  }

  function getInvoiceAddress(uint256 _id) public view returns (address) {
    return _invoices[_id];
  }
}
