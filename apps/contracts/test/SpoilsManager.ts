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

describe('SpoilsManager', function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;
  let receiver: WalletClient;
  let receiver2: WalletClient;
  let factory: ContractTypesMap['SpoilsManagerFactory'];
  let implementation: ContractTypesMap['SpoilsManager'];
  let spoilsManager: ContractTypesMap['SpoilsManager'];
  let spoilsValues: {
    spoils: number;
    receiver: Hex;
    newOwner: Hex;
    percentageScale: number;
  };

  beforeEach(async function () {
    publicClient = await viem.getPublicClient();
    [deployer, receiver, receiver2] = await viem.getWalletClients();

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
    spoilsManager = (await viem.getContractAt(
      'SpoilsManager',
      spoilsManagerAddress,
    )) as ContractTypesMap['SpoilsManager'];
  });

  it('Should have initial values', async function () {
    const rawSpoils = await spoilsManager.read.spoils();
    expect(rawSpoils).to.equal(spoilsValues.spoils);
    expect(await spoilsManager.read.receiver()).to.equal(spoilsValues.receiver);
    expect(await spoilsManager.read.owner()).to.equal(spoilsValues.newOwner);
    const spoilsScale = await spoilsManager.read.SPLIT_PERCENTAGE_SCALE();
    expect(await spoilsManager.read.getSpoils()).to.equal(
      rawSpoils * spoilsScale,
    );
  });

  it('Should allow owner to update spoils', async function () {
    const newSpoils = 15;
    await spoilsManager.write.setSpoils([newSpoils], {
      account: receiver.account,
    });
    expect(await spoilsManager.read.spoils()).to.equal(newSpoils);
  });

  it('Should not allow non-owner to update spoils', async function () {
    const newSpoils = 15;
    await expect(
      spoilsManager.write.setSpoils([newSpoils], { account: deployer.account }),
    ).to.be.revertedWithCustomError(
      spoilsManager,
      'OwnableUnauthorizedAccount',
    );
  });

  it('Should allow owner to update receiver', async function () {
    const newReceiver = getAddress(receiver2.account.address);
    await spoilsManager.write.setReceiver([newReceiver], {
      account: receiver.account,
    });
    expect(await spoilsManager.read.receiver()).to.equal(newReceiver);
  });

  it('Should not allow non-owner to update receiver', async function () {
    const newReceiver = receiver2.account.address;
    await expect(
      spoilsManager.write.setReceiver([newReceiver], {
        account: deployer.account,
      }),
    ).to.be.revertedWithCustomError(
      spoilsManager,
      'OwnableUnauthorizedAccount',
    );
  });
});
