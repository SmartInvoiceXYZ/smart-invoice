// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ISmartInvoiceFactory.sol";
import "./interfaces/ISmartInvoice.sol";

// import "hardhat/console.sol";

contract SmartInvoiceFactory is ISmartInvoiceFactory, AccessControl {
    uint256 public invoiceCount = 0;
    // store invoice as struct by address? struct would be imp info;
    mapping(uint256 => address) internal _invoices;

    mapping(address => uint256) public resolutionRates;

    bytes32 public constant ADMIN = keccak256("ADMIN");

    /// @dev marks a deployed contract as a suitable implementation for additional escrow invoices formats

    // Implementation Storage
    mapping(bytes32 => mapping(uint256 => address)) public implementations;

    /** @dev mapping(implementationType => mapping(implementationVersion => address)) */
    mapping(bytes32 => uint256) public currentVersions;
    mapping(address => bool) internal implementationExists;

    address public immutable wrappedNativeToken;

    event LogNewInvoice(
        uint256 indexed index,
        address invoice,
        uint256[] amounts,
        bytes32 implementationType,
        uint256 implementationVersion,
        address implementationAddress
    );
    event UpdateResolutionRate(
        address indexed resolver,
        uint256 indexed resolutionRate,
        bytes32 details
    );

    event InvoiceImplementationAdded(
        bytes32 indexed implementationType,
        uint256 indexed version,
        address implementationAddress
    );

    constructor(address _wrappedNativeToken) {
        require(
            _wrappedNativeToken != address(0),
            "invalid wrappedNativeToken"
        );
        wrappedNativeToken = _wrappedNativeToken;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN, msg.sender);
    }

    function _init(
        address _invoiceAddress,
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] memory _amounts,
        bytes memory _invoiceData,
        bytes32 _implementationType,
        uint256 _implementationVersion,
        address _implementationAddress
    ) internal {
        uint256 resolutionRate = resolutionRates[_resolver];
        if (resolutionRate == 0) {
            resolutionRate = 20;
        }

        uint256 invoiceId = invoiceCount;
        _invoices[invoiceId] = _invoiceAddress;
        invoiceCount += 1;

        ISmartInvoice(_invoiceAddress).init(
            _client,
            _provider,
            _encodeResolutionData(_resolverType, _resolver, resolutionRate),
            _amounts,
            wrappedNativeToken,
            _invoiceData,
            invoiceId
        );

        emit LogNewInvoice(
            invoiceId,
            _invoiceAddress,
            _amounts,
            _implementationType,
            _implementationVersion,
            _implementationAddress
        );
    }

    // ******************
    // Encoding
    // ******************

    function _encodeResolutionData(
        uint8 _resolverType,
        address _resolver,
        uint256 _resolutionRate
    ) internal pure returns (bytes memory) {
        return abi.encode(_resolverType, _resolver, _resolutionRate);
    }

    // ******************
    // Create
    // ******************

    function create(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _invoiceData,
        bytes32 _implementationType
    ) external override returns (address) {
        require(_invoiceData.length != 0, "No invoice data");
        uint256 _implemenationVersion = getCurrentImplementationVersion(
            _implementationType
        );

        address _implementationAddress = implementations[_implementationType][
            _implemenationVersion
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
            _invoiceData,
            _implementationType,
            _implemenationVersion,
            _implementationAddress
        );

        return invoiceAddress;
    }

    function predictDeterministicAddress(
        bytes32 _implementationType,
        bytes32 _salt
    ) external view override returns (address) {
        uint256 _implementationVersion = getCurrentImplementationVersion(
            _implementationType
        );
        return
            Clones.predictDeterministicAddress(
                implementations[_implementationType][_implementationVersion],
                _salt
            );
    }

    function createDeterministic(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _invoiceData,
        bytes32 _implementationType,
        bytes32 _salt
    ) external override returns (address) {
        // can combine this and above create into single check function maybe instead of dupes
        require(_invoiceData.length != 0, "No invoice data");

        uint256 _implementationVersion = getCurrentImplementationVersion(
            _implementationType
        );
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
            _invoiceData,
            _implementationType,
            _implementationVersion,
            _implementationAddress
        );

        return invoiceAddress;
    }

    /** @dev marks a deployed contract as a suitable implementation for additional escrow invoices formats */

    function addImplementation(
        bytes32 implementationType,
        address implementationAddress
    ) external onlyRole(ADMIN) {
        require(
            implementationAddress != address(0),
            "implemenation address is zero address"
        );
        require(
            implementationExists[implementationAddress] != true,
            "implementation already added"
        );

        uint256 version = getCurrentImplementationVersion(implementationType);
        address currentImplementation = getCurrentImplementation(
            implementationType
        );

        if (version == 0 && currentImplementation == address(0)) {
            implementations[implementationType][
                version
            ] = implementationAddress;
        } else {
            implementations[implementationType][
                version + 1
            ] = implementationAddress;

            currentVersions[implementationType] += 1;
        }
        implementationExists[implementationAddress] = true;
        emit InvoiceImplementationAdded(
            implementationType,
            version,
            implementationAddress
        );
    }

    // ******************
    // Getters
    // ******************

    function getCurrentImplementationVersion(bytes32 _implementationType)
        public
        view
        returns (uint256 version)
    {
        version = currentVersions[_implementationType];
        return version;
    }

    // this should take the place of manually inputting new version
    function getCurrentImplementation(bytes32 _implementationType)
        public
        view
        returns (address currentImplementation)
    {
        uint256 version = currentVersions[_implementationType];
        currentImplementation = implementations[_implementationType][version];
        return currentImplementation;
    }

    function getImplementation(
        bytes32 _implementationType,
        uint256 _implementationVersion
    ) external view returns (address) {
        return implementations[_implementationType][_implementationVersion];
    }

    function getInvoiceAddress(uint256 index) external view returns (address) {
        return _invoices[index];
    }

    // ******************
    // Arbitration
    // ******************

    function updateResolutionRate(uint256 _resolutionRate, bytes32 _details)
        external
    {
        resolutionRates[msg.sender] = _resolutionRate;
        emit UpdateResolutionRate(msg.sender, _resolutionRate, _details);
    }

    // ******************
    // Roles
    // ******************

    function addAdmin(address account) external virtual onlyRole(ADMIN) {
        grantRole(ADMIN, account);
    }

    function revokeAdmin(address account) external virtual onlyRole(ADMIN) {
        revokeRole(ADMIN, account);
    }
}
