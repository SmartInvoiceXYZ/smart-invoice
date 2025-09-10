import {
  PublicClient,
  TestClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  GetTransactionReceiptReturnType,
  Hex,
  parseAbi,
  parseEventLogs,
  zeroAddress,
  zeroHash,
} from 'viem';

import {
  ARBITRABLE_PULL_TYPE,
  ARBITRABLE_PUSH_TYPE,
  ESCROW_PULL_TYPE,
  ESCROW_PUSH_TYPE,
  MINIMAL_PULL_TYPE,
  MINIMAL_PUSH_TYPE,
} from './constants';
import { awaitInvoiceAddress } from './create';
import { setBalanceOf } from './erc20';
import { encodeInitData, InitData } from './init';
import { nextSalt } from './salt';
import { currentTimestamp } from './timestamp';

/* ---------------------------------- Types --------------------------------- */

export const VARIANT_PUSH_NAMES = [
  'SmartInvoiceEscrowPush',
  'SmartInvoiceEscrowArbitrablePush',
  'SmartInvoiceEscrowMinimalPush',
] as const;

type PushVariantName = (typeof VARIANT_PUSH_NAMES)[number];

export const VARIANT_PULL_NAMES = [
  'SmartInvoiceEscrowPull',
  'SmartInvoiceEscrowArbitrablePull',
  'SmartInvoiceEscrowMinimalPull',
] as const;

type PullVariantName = (typeof VARIANT_PULL_NAMES)[number];

export const VARIANT_NAMES = [
  ...VARIANT_PUSH_NAMES,
  ...VARIANT_PULL_NAMES,
] as const;

// The union type of exactly those 6 strings
export type VariantName = (typeof VARIANT_NAMES)[number];

type PushCapabilities = { push: true; pull: false };
type PullCapabilities = { pull: true; push: false };
type ArbitrableCapabilities = { arbitrable: true; resolvable: false };
type ResolvableCapabilities = { resolvable: true; arbitrable: false };
type MinimalCapabilities = { resolvable: false; arbitrable: false };

export type Capabilities = {
  lock: boolean; // lock/unlock functions
} & (PushCapabilities | PullCapabilities) &
  (ArbitrableCapabilities | ResolvableCapabilities | MinimalCapabilities);

export type VariantConfig<V extends VariantName> = {
  label: string;
  contract: V;
  typeId: Hex;
  capabilities: Capabilities;
};

export type SuiteCtx<V extends VariantName> = {
  // constants / params
  amounts: readonly bigint[];
  total: bigint;
  resolutionRateBps: bigint; // e.g. 500n (5%)
  requireVerification: boolean;

  // init data
  resolverData: Hex;
  terminationTime: number;

  // chain clients
  publicClient: PublicClient;
  testClient: TestClient;

  // signers
  client: WalletClient;
  provider: WalletClient;
  resolver: WalletClient;
  randomSigner: WalletClient;
  providerReceiver: WalletClient;
  clientReceiver: WalletClient;
  client2: WalletClient;
  provider2: WalletClient;
  providerReceiver2: WalletClient;
  clientReceiver2: WalletClient;

  // contracts
  factory: ContractTypesMap['SmartInvoiceFactory'];
  escrowImplementation: ContractTypesMap['SmartInvoiceEscrowCore'];
  escrow: ContractTypesMap['SmartInvoiceEscrowCore'];

  // mock contracts
  mockToken: ContractTypesMap['MockToken'];
  mockWrappedETH: ContractTypesMap['MockWETH'];
  mockArbitrator: ContractTypesMap['MockArbitrator'];
  mockSplitsWarehouse: ContractTypesMap['MockSplitsWarehouse'];

  // chosen variant
  variant: VariantConfig<V>;
};

export async function getEscrowAt<const V extends VariantName>(
  variantName: V,
  address: Hex,
): Promise<ContractTypesMap[V]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = await viem.getContractAt(variantName as any, address);
  return c as unknown as ContractTypesMap[V];
}

export async function createPushImplementation<const V extends PushVariantName>(
  variantName: V,
  deps: {
    mockWrappedETH: Hex;
    factory: Hex;
  },
): Promise<ContractTypesMap[V]> {
  const { mockWrappedETH, factory } = deps;
  const impl = await viem.deployContract(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variantName as any,
    [mockWrappedETH, factory],
  );
  return impl as unknown as ContractTypesMap[V];
}

export async function createPullImplementation<const V extends PullVariantName>(
  variantName: V,
  deps: {
    mockWrappedETH: Hex;
    factory: Hex;
    splitsWarehouse: Hex;
  },
): Promise<ContractTypesMap[V]> {
  const { mockWrappedETH, factory, splitsWarehouse } = deps;
  const impl = await viem.deployContract(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variantName as any,
    [mockWrappedETH, factory, splitsWarehouse],
  );
  return impl as unknown as ContractTypesMap[V];
}

export async function createImplementation<const V extends VariantName>(
  variantName: V,
  deps: {
    mockWrappedETH: Hex;
    factory: Hex;
    splitsWarehouse: Hex;
  },
): Promise<ContractTypesMap[V]> {
  if (
    variantName === 'SmartInvoiceEscrowPush' ||
    variantName === 'SmartInvoiceEscrowArbitrablePush' ||
    variantName === 'SmartInvoiceEscrowMinimalPush'
  ) {
    return createPushImplementation(variantName, deps) as Promise<
      ContractTypesMap[V]
    >;
  }
  return createPullImplementation(variantName, deps) as Promise<
    ContractTypesMap[V]
  >;
}

export async function deployEscrow<const V extends VariantName>(
  variant: VariantConfig<V>,
  factory: ContractTypesMap['SmartInvoiceFactory'],
  provider: Hex,
  amounts: readonly bigint[],
  initData: InitData,
): Promise<GetTransactionReceiptReturnType> {
  const data = encodeInitData(initData);

  const version = await factory.read.currentVersions([variant.typeId]);

  const hash = await factory.write.createDeterministic([
    provider,
    amounts,
    data,
    variant.typeId,
    version,
    nextSalt(),
  ]);

  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
}

/* ------------------------------- Factory func ------------------------------ */

export async function createSuiteContext<const V extends VariantName>(
  variant: VariantConfig<V>,
  options?: {
    amounts?: readonly bigint[];
    resolutionRateBps?: bigint;
    requireVerification?: boolean;
    details?: string;
  },
): Promise<SuiteCtx<V>> {
  const amounts = options?.amounts ?? ([10n, 10n] as const);
  const resolutionRateBps = options?.resolutionRateBps ?? 500n;
  const requireVerification = options?.requireVerification ?? true;

  const walletClients = await viem.getWalletClients();
  const [
    client,
    provider,
    resolver,
    randomSigner,
    providerReceiver,
    clientReceiver,
    client2,
    provider2,
    providerReceiver2,
    clientReceiver2,
  ] = walletClients;

  const publicClient = await viem.getPublicClient();
  const testClient = await viem.getTestClient();

  const mockTokenContract = await viem.deployContract('MockToken');
  const mockToken = getAddress(mockTokenContract.address);

  const mockWrappedETHContract = await viem.deployContract('MockWETH');
  const mockWrappedETH = getAddress(mockWrappedETHContract.address);

  const mockArbitratorContract = await viem.deployContract('MockArbitrator', [
    10n,
  ]);
  const mockArbitrator = getAddress(mockArbitratorContract.address);

  const mockSplitsWarehouseContract = await viem.deployContract(
    'MockSplitsWarehouse',
    ['ETH', 'ETH'],
  );
  const mockSplitsWarehouse = getAddress(mockSplitsWarehouseContract.address);

  const factory = await viem.deployContract('SmartInvoiceFactory', [
    mockWrappedETH,
  ]);

  // Deploy the variant implementation and register it
  const escrowImplementation = await createImplementation(variant.contract, {
    mockWrappedETH,
    factory: factory.address,
    splitsWarehouse: mockSplitsWarehouse,
  });
  await factory.write.addImplementation([
    variant.typeId,
    escrowImplementation.address,
  ]);

  let resolverData: Hex = '0x';

  if (variant.capabilities.resolvable) {
    // resolverData = address + max rate
    resolverData = encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [resolver.account.address, resolutionRateBps], // use same BPS as max rate
    );
  } else if (variant.capabilities.arbitrable) {
    // resolverData = address + arbitrator extra data
    const extraData: Hex = `${zeroHash}${zeroHash.slice(2)}`; // empty 64 bytes
    resolverData = encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes' }],
      [mockArbitrator, extraData], // empty extra data for testing
    );
  }

  const terminationTime = (await currentTimestamp()) + 30 * 24 * 60 * 60;

  // Encode InitData tuple (shared shape across variants)
  const data = encodeInitData({
    client: client.account.address,
    resolverData,
    token: mockToken,
    terminationTime: BigInt(terminationTime),
    requireVerification,
    providerReceiver: providerReceiver.account.address,
    clientReceiver: clientReceiver.account.address,
    feeBPS: 0n,
    treasury: zeroAddress,
    details: options?.details ?? '',
  });

  const createHash = await factory.write.createDeterministic([
    getAddress(provider.account.address),
    amounts,
    data,
    variant.typeId,
    0n,
    nextSalt(),
  ]);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: createHash,
  });
  const address = await awaitInvoiceAddress(receipt);
  const escrow = await getEscrowAt(variant.contract, address!);

  return {
    amounts,
    total: amounts.reduce((t, v) => t + v, 0n),
    resolutionRateBps,
    requireVerification,

    publicClient,
    testClient,

    client,
    provider,
    resolver,
    randomSigner,
    providerReceiver,
    clientReceiver,
    client2,
    provider2,
    providerReceiver2,
    clientReceiver2,

    factory,
    escrowImplementation:
      escrowImplementation as unknown as ContractTypesMap['SmartInvoiceEscrowCore'],
    escrow: escrow as unknown as ContractTypesMap['SmartInvoiceEscrowCore'],

    mockToken: mockTokenContract,
    mockWrappedETH: mockWrappedETHContract,
    mockArbitrator: mockArbitratorContract,
    mockSplitsWarehouse: mockSplitsWarehouseContract,

    resolverData,
    terminationTime,

    variant,
  };
}

/* ------------------------------ Locked Escrow Helper ------------------------------ */

export async function createVariantLockedEscrow<const V extends VariantName>(
  ctx: SuiteCtx<V>,
  initData: InitData,
  details: string,
  value = 0n,
): Promise<ContractTypesMap['SmartInvoiceEscrowCore']> {
  const { variant, factory, provider, amounts, mockArbitrator } = ctx;

  // Check if the variant supports locking
  if (!variant.capabilities.lock) {
    throw new Error(
      `Variant ${variant.label} does not support locking operations`,
    );
  }

  // Create the escrow
  const tx = await deployEscrow(
    variant,
    factory,
    getAddress(provider.account.address),
    amounts,
    initData,
  );

  const newInvoiceAddress = await awaitInvoiceAddress(tx);
  if (!newInvoiceAddress) {
    throw new Error('Failed to get invoice address');
  }

  const lockedInvoice = (await getEscrowAt(
    variant.contract,
    newInvoiceAddress,
  )) as unknown as ContractTypesMap['SmartInvoiceEscrowCore'];

  expect(await lockedInvoice.read.locked()).to.equal(false);

  // Fund the contract with tokens
  await setBalanceOf(initData.token, newInvoiceAddress, 10n);

  // Lock the contract
  let lockValue = value;

  // For arbitrable contracts, we need to pay arbitration costs
  if (variant.capabilities.arbitrable) {
    const extraData = (zeroHash + zeroHash.slice(2)) as Hex;
    lockValue = await mockArbitrator.read.arbitrationCost([extraData]);
  }

  const lockHash = await lockedInvoice.write.lock([details], {
    value: lockValue,
  });

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash: lockHash });

  // Verify lock event was emitted
  const events = parseEventLogs({
    abi: parseAbi(['event Lock(address indexed client, string id)']),
    logs: receipt.logs,
  });

  expect(events[0].eventName).to.equal('Lock');
  expect(events[0].args.client).to.equal(getAddress(initData.client));
  expect(events[0].args.id).to.equal(details);

  return lockedInvoice;
}

/* --------------------------- Strongly-typed variants ----------------------- */

export const VARIANT_PUSH = {
  label: 'Push',
  contract: 'SmartInvoiceEscrowPush',
  typeId: ESCROW_PUSH_TYPE,
  capabilities: {
    lock: true,
    resolvable: true,
    arbitrable: false,
    push: true,
    pull: false,
  },
} as const satisfies VariantConfig<'SmartInvoiceEscrowPush'>;

export const VARIANT_PULL = {
  label: 'Pull',
  contract: 'SmartInvoiceEscrowPull',
  typeId: ESCROW_PULL_TYPE,
  capabilities: {
    lock: true,
    resolvable: true,
    arbitrable: false,
    push: false,
    pull: true,
  },
} as const satisfies VariantConfig<'SmartInvoiceEscrowPull'>;

export const VARIANT_ARB_PUSH = {
  label: 'Arbitrable Push',
  contract: 'SmartInvoiceEscrowArbitrablePush',
  typeId: ARBITRABLE_PUSH_TYPE,
  capabilities: {
    lock: true,
    resolvable: false,
    arbitrable: true,
    push: true,
    pull: false,
  },
} as const satisfies VariantConfig<'SmartInvoiceEscrowArbitrablePush'>;

export const VARIANT_ARB_PULL = {
  label: 'Arbitrable Pull',
  contract: 'SmartInvoiceEscrowArbitrablePull',
  typeId: ARBITRABLE_PULL_TYPE,
  capabilities: {
    lock: true,
    resolvable: false,
    arbitrable: true,
    push: false,
    pull: true,
  },
} as const satisfies VariantConfig<'SmartInvoiceEscrowArbitrablePull'>;

export const VARIANT_MIN_PUSH = {
  label: 'Minimal Push',
  contract: 'SmartInvoiceEscrowMinimalPush',
  typeId: MINIMAL_PUSH_TYPE,
  capabilities: {
    lock: false,
    resolvable: false,
    arbitrable: false,
    push: true,
    pull: false,
  },
} as const satisfies VariantConfig<'SmartInvoiceEscrowMinimalPush'>;

export const VARIANT_MIN_PULL = {
  label: 'Minimal Pull',
  contract: 'SmartInvoiceEscrowMinimalPull',
  typeId: MINIMAL_PULL_TYPE,
  capabilities: {
    lock: false,
    resolvable: false,
    arbitrable: false,
    push: false,
    pull: true,
  },
} as const satisfies VariantConfig<'SmartInvoiceEscrowMinimalPull'>;
