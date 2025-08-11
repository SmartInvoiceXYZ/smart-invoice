import {
  PublicClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  Hex,
  toBytes,
  toHex,
  zeroAddress,
} from 'viem';

import { awaitInvoiceAddress } from './utils';

const escrowData = {
  client: '' as Hex,
  clientReceiver: '' as Hex,
  resolver: '' as Hex,
  token: '' as Hex,
  terminationTime: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
  details: toHex(toBytes('ipfs://', { size: 32 })),
  provider: '' as Hex,
  providerReceiver: '' as Hex,
};

const resolverType = 0;
const requireVerification = true;
const escrowTypeV2 = toHex(toBytes('updatable-v2', { size: 32 }));

describe('SmartInvoiceFactoryBundler', function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;
  let client: WalletClient;
  let clientReceiver: WalletClient;
  let resolver: WalletClient;
  let provider: WalletClient;
  let providerReceiver: WalletClient;
  let bundler: ContractTypesMap['SmartInvoiceFactoryBundler'];
  let factory: ContractTypesMap['SmartInvoiceFactory'];
  let token: ContractTypesMap['MockToken'];
  let wrappedNativeToken: ContractTypesMap['MockWETH'];
  let milestoneAmounts: bigint[];

  before(async function () {
    publicClient = await viem.getPublicClient();
    [deployer, client, clientReceiver, resolver, provider, providerReceiver] =
      await viem.getWalletClients();

    // Deploy mock ERC20 token (WETH)
    token = await viem.deployContract('MockToken');
    escrowData.token = token.address;

    wrappedNativeToken = await viem.deployContract('MockWETH');

    // Deploy mock SmartInvoiceFactory
    factory = await viem.deployContract('SmartInvoiceFactory', [
      wrappedNativeToken.address,
    ]);

    const invoiceImplv2 = await viem.deployContract('SmartInvoiceEscrow');
    await factory.write.addImplementation(
      [escrowTypeV2, invoiceImplv2.address],
      {
        account: deployer.account,
      },
    );

    // Deploy SmartInvoiceFactoryBundler
    bundler = await viem.deployContract('SmartInvoiceFactoryBundler', [
      factory.address,
      wrappedNativeToken.address,
    ]);

    // Set addresses in escrowData
    escrowData.client = getAddress(client.account.address);
    escrowData.clientReceiver = getAddress(clientReceiver.account.address);
    escrowData.resolver = getAddress(resolver.account.address);
    escrowData.provider = getAddress(provider.account.address);
    escrowData.providerReceiver = getAddress(providerReceiver.account.address);

    milestoneAmounts = [
      BigInt(10) * BigInt(10) ** BigInt(18), // 10 MTK
      BigInt(10) * BigInt(10) ** BigInt(18), // 10 MTK
    ];
  });

  it('Should deploy an escrow v2 successfully', async function () {
    const fundAmount = milestoneAmounts.reduce(
      (sum, value) => sum + value,
      BigInt(0),
    );

    // mock ERC20 token balance for client
    await token.write.setBalanceOf([client.account.address, fundAmount]);

    // Approve the bundler contract to transfer tokens
    await token.write.approve([bundler.address, fundAmount], {
      account: client.account,
    });

    const allowance = await token.read.allowance([
      client.account.address,
      bundler.address,
    ]);

    expect(allowance).to.be.greaterThanOrEqual(fundAmount);

    const encodedEscrowData = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
        'address',
        'address',
        'address',
      ].map(v => ({ type: v })),
      [
        escrowData.client,
        resolverType,
        escrowData.resolver,
        escrowData.token,
        escrowData.terminationTime,
        escrowData.details,
        wrappedNativeToken.address,
        requireVerification,
        factory.address,
        escrowData.providerReceiver,
        escrowData.clientReceiver,
      ],
    );

    const txHash = await bundler.write.deployEscrow(
      [
        escrowData.provider,
        milestoneAmounts,
        encodedEscrowData,
        escrowTypeV2,
        fundAmount,
      ],
      { account: client.account },
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const escrowAddress = await awaitInvoiceAddress(receipt);

    expect(escrowAddress).to.not.equal(undefined);
    expect(escrowAddress).to.not.equal(zeroAddress);

    if (!escrowAddress) {
      throw new Error('Escrow address is undefined');
    }

    expect(txHash)
      .to.emit(bundler, 'EscrowCreated')
      .withArgs(escrowAddress, getAddress(escrowData.token), fundAmount);

    // Verify escrow contract has the correct token balance
    const escrowBalance = await token.read.balanceOf([escrowAddress]);
    expect(escrowBalance).to.equal(fundAmount);

    const invoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      escrowAddress,
    );

    expect(await invoice.read.client()).to.equal(
      getAddress(client.account.address),
    );
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider.account.address),
    );
    expect(await invoice.read.resolverType()).to.equal(0);
    expect(await invoice.read.resolver()).to.equal(
      getAddress(resolver.account.address),
    );
    expect(await invoice.read.token()).to.equal(getAddress(token.address));

    for (let i = 0; i < milestoneAmounts.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(
        milestoneAmounts[i],
      );
    }
    expect(await invoice.read.terminationTime()).to.equal(
      escrowData.terminationTime,
    );
    expect(await invoice.read.resolutionRate()).to.equal(20n);
    expect(await invoice.read.milestone()).to.equal(0n);
    expect(await invoice.read.total()).to.equal(fundAmount);
    expect(await invoice.read.locked()).to.equal(false);
    expect(await invoice.read.disputeId()).to.equal(0n);
    expect(await invoice.read.wrappedNativeToken()).to.equal(
      getAddress(wrappedNativeToken.address),
    );
    expect(await invoice.read.providerReceiver()).to.equal(
      getAddress(escrowData.providerReceiver),
    );
    expect(await invoice.read.clientReceiver()).to.equal(
      getAddress(escrowData.clientReceiver),
    );
  });

  it('Should deploy an escrow v2 with native ETH', async function () {
    const fundAmount = milestoneAmounts.reduce(
      (sum, value) => sum + value,
      BigInt(0),
    );

    const encodedEscrowData = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
        'address',
        'address',
        'address',
      ].map(v => ({ type: v })),
      [
        escrowData.client,
        resolverType,
        escrowData.resolver,
        wrappedNativeToken.address,
        escrowData.terminationTime,
        escrowData.details,
        wrappedNativeToken.address,
        requireVerification,
        factory.address,
        escrowData.providerReceiver,
        escrowData.clientReceiver,
      ],
    );

    const txHash = await bundler.write.deployEscrow(
      [
        escrowData.provider,
        milestoneAmounts,
        encodedEscrowData,
        escrowTypeV2,
        fundAmount,
      ],
      { account: client.account, value: fundAmount },
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const escrowAddress = await awaitInvoiceAddress(receipt);

    expect(escrowAddress).to.not.equal(undefined);
    expect(escrowAddress).to.not.equal(zeroAddress);

    if (!escrowAddress) {
      throw new Error('Escrow address is undefined');
    }

    expect(txHash)
      .to.emit(bundler, 'EscrowCreated')
      .withArgs(
        escrowAddress,
        getAddress(wrappedNativeToken.address),
        fundAmount,
      );

    // Verify escrow contract has the correct token balance
    const escrowBalance = await wrappedNativeToken.read.balanceOf([
      escrowAddress,
    ]);
    expect(escrowBalance).to.equal(fundAmount);

    const invoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      escrowAddress,
    );

    expect(await invoice.read.client()).to.equal(
      getAddress(client.account.address),
    );
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider.account.address),
    );
    expect(await invoice.read.resolverType()).to.equal(0);
    expect(await invoice.read.resolver()).to.equal(
      getAddress(resolver.account.address),
    );
    expect(await invoice.read.token()).to.equal(
      getAddress(wrappedNativeToken.address),
    );

    for (let i = 0; i < milestoneAmounts.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(
        milestoneAmounts[i],
      );
    }
    expect(await invoice.read.terminationTime()).to.equal(
      escrowData.terminationTime,
    );
    expect(await invoice.read.resolutionRate()).to.equal(20n);
    expect(await invoice.read.milestone()).to.equal(0n);
    expect(await invoice.read.total()).to.equal(fundAmount);
    expect(await invoice.read.locked()).to.equal(false);
    expect(await invoice.read.disputeId()).to.equal(0n);
    expect(await invoice.read.wrappedNativeToken()).to.equal(
      getAddress(wrappedNativeToken.address),
    );
    expect(await invoice.read.providerReceiver()).to.equal(
      getAddress(escrowData.providerReceiver),
    );
    expect(await invoice.read.clientReceiver()).to.equal(
      getAddress(escrowData.clientReceiver),
    );
  });
});
