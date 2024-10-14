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
  resolver: '' as Hex,
  token: '' as Hex,
  terminationTime: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
  details: toHex(toBytes('ipfs://', { size: 32 })),
  provider: '' as Hex,
  providerReceiver: '' as Hex,
};

describe('SmartInvoiceFactoryBundler', function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;
  let client: WalletClient;
  let resolver: WalletClient;
  let provider: WalletClient;
  let bundler: ContractTypesMap['SmartInvoiceFactoryBundler'];
  let factory: ContractTypesMap['SmartInvoiceFactory'];
  let token: ContractTypesMap['MockToken'];
  let wrappedNativeToken: ContractTypesMap['MockWETH'];
  let milestoneAmounts: bigint[];

  before(async function () {
    publicClient = await viem.getPublicClient();
    [deployer, client, resolver, provider] = await viem.getWalletClients();

    // Deploy mock ERC20 token (WETH)
    token = await viem.deployContract('MockToken');
    escrowData.token = token.address;

    wrappedNativeToken = await viem.deployContract('MockWETH');

    // Deploy mock SmartInvoiceFactory
    factory = await viem.deployContract('SmartInvoiceFactory', [
      wrappedNativeToken.address,
    ]);

    const invoiceImpl = await viem.deployContract('SmartInvoiceUpdatable');
    const invoiceType = toHex(toBytes('updatable', { size: 32 }));
    await factory.write.addImplementation([invoiceType, invoiceImpl.address], {
      account: deployer.account,
    });

    // Deploy SmartInvoiceFactoryBundler
    bundler = await viem.deployContract('SmartInvoiceFactoryBundler', [
      factory.address,
      wrappedNativeToken.address,
    ]);

    // Set addresses in escrowData
    escrowData.client = getAddress(client.account.address);
    escrowData.resolver = getAddress(resolver.account.address);
    escrowData.provider = getAddress(provider.account.address);
    escrowData.providerReceiver = getAddress(provider.account.address);

    milestoneAmounts = [
      BigInt(10) * BigInt(10) ** BigInt(18), // 10 MTK
      BigInt(10) * BigInt(10) ** BigInt(18), // 10 MTK
    ];
  });

  it('Should deploy an escrow successfully', async function () {
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

    const encodedEscrowData = encodeAbiParameters(
      [
        'address',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'address',
      ].map(type => ({ type })),
      [
        escrowData.client,
        escrowData.resolver,
        escrowData.token,
        escrowData.terminationTime,
        escrowData.details,
        escrowData.provider,
        escrowData.providerReceiver,
      ],
    );

    const txHash = await bundler.write.deployEscrow(
      [milestoneAmounts, encodedEscrowData, fundAmount],
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
      'SmartInvoiceUpdatable',
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
    expect(await invoice.read.details()).to.equal(escrowData.details);
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
  });
});
