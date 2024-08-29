import {
  PublicClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, Hex, toBytes, toHex, zeroAddress } from 'viem';

import { currentTimestamp } from './utils';

const formatBytes32String = (str: string) => toHex(toBytes(str, { size: 32 }));

describe('SpoilsManagerFactory', function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;
  let receiver: WalletClient;
  let factory: ContractTypesMap['SpoilsManagerFactory'];
  let implementation: ContractTypesMap['SpoilsManager'];
  let spoilsValues: {
    spoils: number;
    receiver: Hex;
    newOwner: Hex;
    percentageScale: number;
  };

  beforeEach(async function () {
    publicClient = await viem.getPublicClient();
    [deployer, receiver] = await viem.getWalletClients();

    implementation = (await viem.deployContract(
      'SpoilsManager',
    )) as ContractTypesMap['SpoilsManager'];
    expect(implementation.address).to.not.equal(zeroAddress);

    factory = (await viem.deployContract('SpoilsManagerFactory', [
      implementation.address,
    ])) as ContractTypesMap['SpoilsManagerFactory'];
    expect(factory.address).to.not.equal(zeroAddress);

    spoilsValues = {
      spoils: 10, // out of 100
      receiver: getAddress(receiver.account.address),
      newOwner: getAddress(receiver.account.address),
      percentageScale: 1e4,
    };
  });

  it('Should deploy new SpoilsManager', async function () {
    const receipt = await factory.write.createSpoilsManager([
      spoilsValues.spoils,
      spoilsValues.percentageScale,
      spoilsValues.receiver,
      spoilsValues.newOwner,
      formatBytes32String(String(currentTimestamp())),
    ]);
    const spoilsManagerAddress = (
      await publicClient.waitForTransactionReceipt({ hash: receipt })
    ).logs[0].address;
    const spoilsManager = (await viem.getContractAt(
      'SpoilsManager',
      spoilsManagerAddress,
    )) as ContractTypesMap['SpoilsManager'];

    expect(spoilsManager.address).to.not.equal(zeroAddress);
    expect(await spoilsManager.read.spoils()).to.equal(spoilsValues.spoils);
    expect(await spoilsManager.read.receiver()).to.equal(spoilsValues.receiver);
    expect(await spoilsManager.read.owner()).to.equal(spoilsValues.newOwner);
  });

  it('Should revert if spoils is 0', async function () {
    await expect(
      factory.write.createSpoilsManager([
        0,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        spoilsValues.newOwner,
        formatBytes32String(String(currentTimestamp())),
      ]),
    ).to.be.revertedWithCustomError(factory, 'InvalidSpoilsAmount');
  });

  it('Should revert if receiver is 0', async function () {
    await expect(
      factory.write.createSpoilsManager([
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        zeroAddress,
        spoilsValues.newOwner,
        formatBytes32String(String(currentTimestamp())),
      ]),
    ).to.be.revertedWithCustomError(factory, 'InvalidReceiverAddress');
  });

  it('Should not revert if newOwner is 0', async function () {
    await expect(
      factory.write.createSpoilsManager([
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        zeroAddress,
        formatBytes32String(String(currentTimestamp())),
      ]),
    ).to.not.be.reverted;
  });

  it('Should stay with deployer if newOwner not set', async function () {
    const receipt = await factory.write.createSpoilsManager([
      spoilsValues.spoils,
      spoilsValues.percentageScale,
      spoilsValues.receiver,
      zeroAddress,
      formatBytes32String(String(currentTimestamp())),
    ]);
    const spoilsManagerAddress = (
      await publicClient.waitForTransactionReceipt({ hash: receipt })
    ).logs[0].address;
    const spoilsManager = (await viem.getContractAt(
      'SpoilsManager',
      spoilsManagerAddress,
    )) as ContractTypesMap['SpoilsManager'];

    expect(await spoilsManager.read.owner()).to.equal(
      getAddress(deployer.account.address),
    );
  });

  it('Should not be initialized again', async function () {
    const receipt = await factory.write.createSpoilsManager([
      spoilsValues.spoils,
      spoilsValues.percentageScale,
      spoilsValues.receiver,
      zeroAddress,
      formatBytes32String(String(currentTimestamp())),
    ]);
    const spoilsManagerAddress = (
      await publicClient.waitForTransactionReceipt({ hash: receipt })
    ).logs[0].address;
    const spoilsManager = (await viem.getContractAt(
      'SpoilsManager',
      spoilsManagerAddress,
    )) as ContractTypesMap['SpoilsManager'];

    await expect(
      spoilsManager.write.init([
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        spoilsValues.newOwner,
      ]),
    ).to.be.revertedWith('Initializable: contract is already initialized');
  });
});
