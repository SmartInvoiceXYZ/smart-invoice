// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ISmartInvoiceFactoryV2.sol";
import "./interfaces/ISmartInvoiceV2.sol";
import "hardhat/console.sol";

contract SmartInvoiceFactoryV2 is ISmartInvoiceFactoryV2, AccessControl {
    uint256 public totalInvoiceCount = 0;

    /** @dev mapping(implementationType => mapping(implementation address => invoiceCount)) */
    mapping(uint256 => mapping(address => uint256)) public invoiceCount;

    /** @dev mapping(implementationType => mapping(implementationVersion => mapping(invoiceId => invoiceAddress))) */
    mapping(uint256 => mapping(uint256 => mapping(uint256 => address)))
        internal _invoices;

    mapping(address => uint256) public resolutionRates;

    bytes32 public constant ADMIN = keccak256("ADMIN");

    /** @dev marks a deployed contract as a suitable implementation for additional escrow invoices formats */
    /** @dev mapping(implementationType => mapping(implementationVersion => address)) */
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
        address _invoiceAddress,
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        uint8 _implementationType,
        uint8 _implementationVersion,
        address _implementationAddress
    ) internal {
        uint256 resolutionRate = resolutionRates[_resolver];
        if (resolutionRate == 0) {
            resolutionRate = 20;
        }

        ISmartInvoiceV2(_invoiceAddress).init(
            _client,
            _provider,
            _encodeResolutionData(_resolverType, _resolver, resolutionRate),
            _amounts,
            wrappedNativeToken,
            _implementationData,
            _implementationType,
            _implementationVersion
        );

        uint256 invoiceId = invoiceCount[_implementationType][
            _implementationAddress
        ];

        _invoices[_implementationType][_implementationVersion][
            invoiceId
        ] = _invoiceAddress;
        invoiceCount[_implementationType][_implementationAddress] =
            invoiceCount[_implementationType][_implementationAddress] +
            1;
        totalInvoiceCount = totalInvoiceCount + 1;

        emit LogNewInvoice(invoiceId, _invoiceAddress, _amounts);
    }

    function _encodeResolutionData(
        uint8 _resolverType,
        address _resolver,
        uint256 _resolutionRate
    ) internal pure returns (bytes memory) {
        return abi.encode(_resolverType, _resolver, _resolutionRate);
    }

    function create(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        uint8 _implementationType,
        uint8 _implementationVersion
    ) external override returns (address) {
        require(
            implementations[_implementationType][_implementationVersion] !=
                address(0),
            "Invoice implemenation does not exist"
        );
        require(_implementationData.length != 0, "No invoice data");

        address _implementationAddress = implementations[_implementationType][
            _implementationVersion
        ];
        require(
            _implementationAddress != address(0),
            "Invoice implementation does not exist"
        );

        address invoiceAddress = Clones.clone(_implementationAddress);

        _init(
            invoiceAddress,
            _client,
            _provider,
            _resolverType,
            _resolver,
            _amounts,
            _implementationData,
            _implementationType,
            _implementationVersion,
            _implementationAddress
        );

        return invoiceAddress;
    }

    function predictDeterministicAddress(
        uint8 _implementationType,
        uint8 _implemenationVersion,
        bytes32 _salt
    ) external view override returns (address) {
        return
            Clones.predictDeterministicAddress(
                implementations[_implementationType][_implemenationVersion],
                _salt
            );
    }

    function createDeterministic(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        uint8 _implementationType,
        uint8 _implementationVersion,
        bytes32 _salt
    ) external override returns (address) {
        address _implementationAddress = implementations[_implementationType][
            _implementationVersion
        ];
        require(
            _implementationAddress != address(0),
            "Invoice implementation does not exist"
        );
        address invoiceAddress = Clones.cloneDeterministic(
            _implementationAddress,
            _salt
        );

        _init(
            invoiceAddress,
            _client,
            _provider,
            _resolverType,
            _resolver,
            _amounts,
            _implementationData,
            _implementationType,
            _implementationVersion,
            _implementationAddress
        );

        return invoiceAddress;
    }

    function addAdmin() public {}

    /**
     * @dev marks a deployed contract as a suitable implementation for additional escrow invoices formats
     */

    // function addImplementation(uint implementationType, uint implementationVersion, address implementation) external onlyRole(ADMIN) {
    //     require(implementations[implementationType][implementationVersion] == address(0), "implementation already exists");
    //     implementations[implementationType][implementationVersion] = implementation;
    // }
    // needs admin controls
    function addImplementation(
        uint256 implementationType,
        uint256 implementationVersion,
        address implementation
    ) external {
        require(
            implementations[implementationType][implementationVersion] ==
                address(0),
            "implementation already exists"
        );
        implementations[implementationType][
            implementationVersion
        ] = implementation;
    }

    function getImplementation(
        uint256 _implementationType,
        uint256 _implementationVersion
    ) public view returns (address) {
        return implementations[_implementationType][_implementationVersion];
    }

    function getInvoiceAddress(
        uint256 _implementationType,
        uint256 _implementationVersion,
        uint256 _index
    ) public view returns (address) {
        return _invoices[_implementationType][_implementationVersion][_index];
    }

    function updateResolutionRate(uint256 _resolutionRate, bytes32 _details)
        external
    {
        resolutionRates[msg.sender] = _resolutionRate;
        emit UpdateResolutionRate(msg.sender, _resolutionRate, _details);
    }
}
