export const ESCROW_ZAP_ABI = [
  { inputs: [], name: 'DaoSplitCreationFailed', type: 'error' },
  { inputs: [], name: 'EscrowNotCreated', type: 'error' },
  { inputs: [], name: 'InvalidAllocationsOwnersData', type: 'error' },
  { inputs: [], name: 'NotAuthorized', type: 'error' },
  { inputs: [], name: 'ProjectTeamSplitNotCreated', type: 'error' },
  { inputs: [], name: 'SafeNotCreated', type: 'error' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'version',
        type: 'uint8',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'safe',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'projectTeamSplit',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'daoSplit',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'escrow',
        type: 'address',
      },
    ],
    name: 'SafeSplitsDaoEscrowCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'safe',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'projectTeamSplit',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'escrow',
        type: 'address',
      },
    ],
    name: 'SafeSplitsEscrowCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'safeSingleton',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'safeFactory',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'splitMain',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'escrowFactory',
        type: 'address',
      },
    ],
    name: 'UpdatedAddresses',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint32',
        name: 'distributorFee',
        type: 'uint32',
      },
    ],
    name: 'UpdatedDistributorFee',
    type: 'event',
  },
  {
    inputs: [],
    name: 'ADMIN',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address[]', name: '_owners', type: 'address[]' },
      {
        internalType: 'uint32[]',
        name: '_percentAllocations',
        type: 'uint32[]',
      },
      {
        internalType: 'uint256[]',
        name: '_milestoneAmounts',
        type: 'uint256[]',
      },
      { internalType: 'bytes', name: '_safeData', type: 'bytes' },
      { internalType: 'address', name: '_safeAddress', type: 'address' },
      { internalType: 'bytes', name: '_splitsData', type: 'bytes' },
      { internalType: 'bytes', name: '_escrowData', type: 'bytes' },
    ],
    name: 'createSafeSplitEscrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'dao',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'distributorFee',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'escrowFactory',
    outputs: [
      {
        internalType: 'contract ISmartInvoiceFactory',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fallbackHandler',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes', name: '_data', type: 'bytes' }],
    name: 'init',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'initLock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'safeFactory',
    outputs: [
      {
        internalType: 'contract ISafeProxyFactory',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'safeSingleton',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'splitMain',
    outputs: [
      { internalType: 'contract ISplitMain', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'spoilsManager',
    outputs: [
      {
        internalType: 'contract ISpoilsManager',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes', name: '_data', type: 'bytes' }],
    name: 'updateAddresses',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint32', name: '_distributorFee', type: 'uint32' },
    ],
    name: 'updateDistributorFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'wrappedNativeToken',
    outputs: [{ internalType: 'contract IWRAPPED', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];
