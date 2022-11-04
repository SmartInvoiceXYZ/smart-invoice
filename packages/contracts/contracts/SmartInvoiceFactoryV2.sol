// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ISmartInvoiceFactoryV2.sol";
import "./interfaces/ISmartInvoiceV2.sol";
import "hardhat/console.sol";

contract SmartInvoiceFactoryV2 is ISmartInvoiceFactoryV2, AccessControl {
    uint256 public invoiceCount = 0;
    mapping(uint256 => address) internal _invoices;

    mapping(address => uint256) public resolutionRates;

    bytes32 public constant ADMIN = keccak256("ADMIN");

    /** @dev marks a deployed contract as a suitable implementation for additional escrow invoices formats */
    /** @dev mapping(implementationType => mapping(implementationVersion => address)) */
    mapping(bytes32 => mapping(uint256 => address)) public implementations;
    mapping(bytes32 => uint256) public implementationsVersions;
    mapping(address => bool) internal implementationExists;

    event LogNewInvoice(
        uint256 indexed index,
        address invoice,
        uint256[] amounts,
        bytes32 _implementationType,
        uint256 _implementationVersion,
        address _implementationAddress,
        uint256 invoiceCount
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
        _grantRole(ADMIN, msg.sender);
    }

    function _init(
        address _invoiceAddress,
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] memory _amounts,
        bytes memory _implementationData,
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

        ISmartInvoiceV2(_invoiceAddress).init(
            _client,
            _provider,
            _encodeResolutionData(_resolverType, _resolver, resolutionRate),
            _amounts,
            wrappedNativeToken,
            _implementationData,
            invoiceId
            // _encodeImplementationData(
            //     _implementationType,
            //     _implementationVersion,
            //     _implementationAddress,
            //     invoiceCount
            // )
        );

        emit LogNewInvoice(
            invoiceId,
            _invoiceAddress,
            _amounts,
            _implementationType,
            _implementationVersion,
            _implementationAddress,
            invoiceCount
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

    // function _encodeImplementationData(
    //     bytes32 _implementationType,
    //     uint256 _implementationVersion,
    //     address _implementationAddress,
    //     uint256 _invoiceId
    // ) internal pure returns (bytes memory) {
    //     return
    //         abi.encode(
    //             _implementationType,
    //             _implementationVersion,
    //             _implementationAddress,
    //             _invoiceId
    //         );
    // }

    // ******************
    // Create
    // ******************

    function create(
        address _client,
        address _provider,
        uint8 _resolverType,
        address _resolver,
        uint256[] calldata _amounts,
        bytes calldata _implementationData,
        bytes32 _implementationType
    ) external override returns (address) {
        require(_implementationData.length != 0, "No invoice data");
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
            _implementationData,
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
        bytes calldata _implementationData,
        bytes32 _implementationType,
        bytes32 _salt
    ) external override returns (address) {
        // can combine this and above create into single check function maybe instead of dupes
        require(_implementationData.length != 0, "No invoice data");

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
            _implementationData,
            _implementationType,
            _implementationVersion,
            _implementationAddress
        );

        return invoiceAddress;
    }

    /** @dev marks a deployed contract as a suitable implementation for additional escrow invoices formats */

    function addImplementation(
        bytes32 implementationType,
        address implementation
    ) external {
        require(
            implementation != address(0),
            "implemenation address is zero address"
        );
        require(
            hasRole(ADMIN, msg.sender),
            "Non-admin cannot add invoice implementation"
        );
        require(
            implementationExists[implementation] != true,
            "implementation already added"
        );

        uint256 version = getCurrentImplementationVersion(implementationType);
        address currentImplementation = getCurrentImplementation(
            implementationType
        );

        if (version == 0 && currentImplementation == address(0)) {
            implementations[implementationType][version] = implementation;
        } else {
            implementations[implementationType][version + 1] = implementation;

            implementationsVersions[implementationType] += 1;
        }
        implementationExists[implementation] = true;
    }

    // ******************
    // Getters
    // ******************

    function getCurrentImplementationVersion(bytes32 _implementationType)
        public
        view
        returns (uint256 version)
    {
        version = implementationsVersions[_implementationType];
        return version;
    }

    // this should take the place of manually inputting new version
    function getCurrentImplementation(bytes32 _implementationType)
        public
        view
        returns (address latestImplementation)
    {
        uint256 version = implementationsVersions[_implementationType];
        latestImplementation = implementations[_implementationType][version];
        return latestImplementation;
    }

    function getImplementation(
        bytes32 _implementationType,
        uint256 _implementationVersion
    ) public view returns (address) {
        return implementations[_implementationType][_implementationVersion];
    }

    function getInvoiceAddress(uint256 _index) public view returns (address) {
        return _invoices[_index];
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

    function addAdmin(address account) public virtual {
        require(hasRole(ADMIN, msg.sender), "Caller is not an admin");
        grantRole(ADMIN, account);
    }

    function revokeAdmin(address account) public virtual {
        require(hasRole(ADMIN, msg.sender), "Caller is not an admin");
        revokeRole(ADMIN, account);
    }
}
