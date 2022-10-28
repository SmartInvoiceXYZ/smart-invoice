// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ISmartInvoiceFactoryV2.sol";
import "./interfaces/ISmartInvoiceV2.sol";

contract SmartInvoiceFactory is ISmartInvoiceFactoryV2, AccessControl {
    uint256 public invoiceCount = 0;
    mapping(uint256 => address) internal _invoices;
    mapping(address => uint256) public resolutionRates;

    bytes32 public constant ADMIN = keccak256("ADMIN");

    address public implementation =
        address(0x34d0A4B1265619F3cAa97608B621a17531c5626f); //placeholder only

    // access an existing implementation
    // implementation types by (index of different implemenentations i.e. pay now, escrow etc => (index of sequential implementations => address of implemenation))
    mapping(uint256 => mapping(uint256 => address)) public implementations;

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

    address public immutable wrappedNativeToken;

    constructor(address _wrappedNativeToken) {
        require(
            _wrappedNativeToken != address(0),
            "invalid wrappedNativeToken"
        );
        wrappedNativeToken = _wrappedNativeToken;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _init(
        address _invoiceAddress, // *
        address _client, // *
        address _provider, // *
        address _resolver,
        uint256[] calldata _amounts, // *
        bytes calldata _implementationData,
        uint8 _implementationType, // *
        uint8 _implementationSelector // *
    ) internal {
        uint256 resolutionRate = resolutionRates[_resolver];
        if (resolutionRate == 0) {
            resolutionRate = 20;
        }

        ISmartInvoiceV2(_invoiceAddress).init(
            _client,
            _provider,
            _resolver,
            _amounts,
            resolutionRate,
            wrappedNativeToken,
            _implementationData,
            _implementationType,
            _implementationSelector
        );

        uint256 invoiceId = invoiceCount;
        _invoices[invoiceId] = _invoiceAddress;
        invoiceCount = invoiceCount + 1;

        emit LogNewInvoice(invoiceId, _invoiceAddress, _amounts);
    }

    // not sure about _resolver
    // can use internal function to decode https://soliditydeveloper.com/stacktoodeep
    function create(
        address _client,
        address _provider,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        uint8 _implementationType, //combine or make uint8
        uint8 _implementationSelector
    ) external override returns (address) {
        require(
            implementations[_implementationSelector][_implementationType] !=
                address(0),
            "Invoice implemenation does not exist"
        );
        require(_implementationData.length != 0, "No invoice data");

        address invoiceAddress = Clones.clone(
            implementations[_implementationSelector][_implementationType]
        );

        _init(
            invoiceAddress,
            _client,
            _provider,
            _resolver,
            _amounts,
            _implementationData,
            _implementationType,
            _implementationSelector
        );

        return invoiceAddress;
    }

    function predictDeterministicAddress(
        uint8 _implementationType,
        uint8 _implemenationSelector,
        bytes32 _salt
    ) external view override returns (address) {
        return
            Clones.predictDeterministicAddress(
                implementations[_implementationType][_implemenationSelector],
                _salt
            );
    }

    function createDeterministic(
        address _client,
        address _provider,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        uint8 _implementationType,
        uint8 _implementationSelector,
        bytes32 _salt
    ) external override returns (address) {
        address invoiceAddress = Clones.cloneDeterministic(
            implementations[_implementationSelector][_implementationType],
            _salt
        );

        _init(
            invoiceAddress,
            _client,
            _provider,
            _resolver,
            _amounts,
            _implementationData,
            _implementationType,
            _implementationSelector
        );

        return invoiceAddress;
    }

    function addAdmin() public {}

    /**
     * @dev marks a deployed contract as a suitable implementation for additional escrow invoices formats
     */

    // function addImplementation(uint implementationType, address implementation) external onlyRole(ADMIN) {
    //     iid++;
    //     implementations[iid] = implementation;
    // }

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
