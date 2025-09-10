import {
  PublicClient,
  TestClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { viem } from 'hardhat';
import { ArtifactsMap, ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  Hex,
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
  SEPOLIA_CONTRACTS,
} from './constants';
import { awaitInvoiceAddress } from './create';
import { encodeInitData } from './init';
import { nextSalt } from './salt';
import { currentTimestamp } from './timestamp';

/* ---------------------------------- Types --------------------------------- */

export const VARIANT_PUSH_NAMES = [
  'SmartInvoiceEscrowPush',
  'SmartInvoiceEscrowArbitrablePush',
  'SmartInvoiceEscrowMinimalPush',
] as const satisfies readonly (keyof ArtifactsMap)[];

type PushVariantName = (typeof VARIANT_PUSH_NAMES)[number];

export const VARIANT_PULL_NAMES = [
  'SmartInvoiceEscrowPull',
  'SmartInvoiceEscrowArbitrablePull',
  'SmartInvoiceEscrowMinimalPull',
] as const satisfies readonly (keyof ArtifactsMap)[];

type PullVariantName = (typeof VARIANT_PULL_NAMES)[number];

export const VARIANT_NAMES = [
  ...VARIANT_PUSH_NAMES,
  ...VARIANT_PULL_NAMES,
] as const satisfies readonly (keyof ArtifactsMap)[];

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

type ContractOf<V extends VariantName> = ContractTypesMap[V];

export type SuiteCtx<V extends VariantName> = {
  // constants / params
  AMOUNTS: readonly bigint[];
  TOTAL: bigint;
  RESOLUTION_RATE_BPS: bigint; // e.g. 500n (5%)
  REQUIRE_VERIFICATION: boolean;

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

  // contracts / addresses
  factory: ContractTypesMap['SmartInvoiceFactory'];
  escrowImplementation: ContractOf<V>;
  escrow: ContractOf<V>;
  escrowAddress: Hex;

  mockToken: ContractTypesMap['MockToken'];
  mockWrappedETH: ContractTypesMap['MockWETH'];
  mockArbitrator: ContractTypesMap['MockArbitrator'];

  // init data
  resolverData: Hex;
  terminationTime: number;

  // chosen variant
  variant: VariantConfig<V>;
};

export async function getEscrowAt<V extends VariantName>(
  variantName: V,
  address: Hex,
): Promise<ContractOf<V>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = await viem.getContractAt(variantName as any, address);
  return c as unknown as ContractOf<V>;
}

export async function createPushImplementation<V extends PushVariantName>(
  variantName: V,
  deps: {
    mockWrappedETH: Hex;
    factory: ContractTypesMap['SmartInvoiceFactory'];
  },
): Promise<ContractOf<V>> {
  const { mockWrappedETH, factory } = deps;
  const impl = await viem.deployContract(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variantName as any,
    [mockWrappedETH, factory.address],
  );
  return impl as unknown as ContractOf<V>;
}

export async function createPullImplementation<V extends PullVariantName>(
  variantName: V,
  deps: {
    mockWrappedETH: Hex;
    factory: ContractTypesMap['SmartInvoiceFactory'];
  },
): Promise<ContractOf<V>> {
  const { mockWrappedETH, factory } = deps;
  const impl = await viem.deployContract(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variantName as any,
    [mockWrappedETH, factory.address, SEPOLIA_CONTRACTS.splitsWarehouse],
  );
  return impl as unknown as ContractOf<V>;
}

export async function createImplementation<V extends VariantName>(
  variantName: V,
  deps: {
    mockWrappedETH: Hex;
    factory: ContractTypesMap['SmartInvoiceFactory'];
  },
): Promise<ContractOf<V>> {
  if (
    variantName === 'SmartInvoiceEscrowPush' ||
    variantName === 'SmartInvoiceEscrowArbitrablePush' ||
    variantName === 'SmartInvoiceEscrowMinimalPush'
  ) {
    return createPushImplementation(variantName, deps) as Promise<
      ContractOf<V>
    >;
  }
  return createPullImplementation(variantName, deps) as Promise<ContractOf<V>>;
}

/* ------------------------------- Factory func ------------------------------ */

export async function createSuiteContext<V extends VariantName>(
  variant: VariantConfig<V>,
  options?: {
    amounts?: readonly bigint[];
    resolutionRateBps?: bigint;
    requireVerification?: boolean;
    details?: string;
  },
): Promise<SuiteCtx<V>> {
  const AMOUNTS = options?.amounts ?? ([10n, 10n] as const);
  const RESOLUTION_RATE_BPS = options?.resolutionRateBps ?? 500n;
  const REQUIRE_VERIFICATION = options?.requireVerification ?? true;

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

  const factory = await viem.deployContract('SmartInvoiceFactory', [
    mockWrappedETH,
  ]);

  // Deploy the variant implementation and register it
  const escrowImplementation = await createImplementation(variant.contract, {
    mockWrappedETH,
    factory,
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
      [resolver.account.address, RESOLUTION_RATE_BPS], // use same BPS as max rate
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
    requireVerification: REQUIRE_VERIFICATION,
    providerReceiver: zeroAddress,
    clientReceiver: zeroAddress,
    feeBPS: 0n,
    treasury: zeroAddress,
    details: options?.details ?? '',
  });

  const createHash = await factory.write.createDeterministic([
    getAddress(provider.account.address),
    AMOUNTS,
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
    AMOUNTS,
    TOTAL: AMOUNTS.reduce((t, v) => t + v, 0n),
    RESOLUTION_RATE_BPS,
    REQUIRE_VERIFICATION,

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
    escrowImplementation,
    escrow,
    escrowAddress: getAddress(address!),

    mockToken: mockTokenContract,
    mockWrappedETH: mockWrappedETHContract,
    mockArbitrator: mockArbitratorContract,

    resolverData,
    terminationTime,

    variant,
  };
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

export const VARIANTS = [
  VARIANT_PUSH,
  VARIANT_PULL,
  VARIANT_ARB_PUSH,
  VARIANT_ARB_PULL,
  VARIANT_MIN_PUSH,
  VARIANT_MIN_PULL,
] as const;
