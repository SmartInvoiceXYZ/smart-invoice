// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/ISmartInvoiceFactory.sol";
import "./interfaces/ISmartInvoice.sol";

contract SmartInvoiceFactory is ISmartInvoiceFactory {
  uint256 public invoiceCount = 0;
  mapping(uint256 => address) internal _invoices;
  mapping(address => uint256) public resolutionRates;

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

  address public immutable implementation;
  address public immutable wrappedNativeToken;

  constructor(address _implementation, address _wrappedNativeToken) {
    implementation = _implementation;
    wrappedNativeToken = _wrappedNativeToken;
  }

  function create(
    address _client,
    address _provider,
    uint8 _resolverType,
    address _resolver,
    address _token,
    uint256[] memory _amounts,
    uint256 _terminationTime,
    bytes32 _details
  ) external override returns (address) {
    uint256 resolutionRate = resolutionRates[_resolver];
    if (resolutionRate == 0) {
      resolutionRate = 20;
    }

    address invoiceAddress = Clones.clone(implementation);

    ISmartInvoice(invoiceAddress).init(
      _client,
      _provider,
      _resolverType,
      _resolver,
      _token,
      _amounts,
      _terminationTime,
      resolutionRate,
      _details,
      wrappedNativeToken
    );

    uint256 invoiceId = invoiceCount;
    _invoices[invoiceId] = invoiceAddress;
    invoiceCount = invoiceCount + 1;

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
