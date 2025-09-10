/* eslint-disable no-plusplus, no-await-in-loop */
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
  keccak256,
  toBytes,
  zeroAddress,
  zeroHash,
} from 'viem';

import {
  awaitInvoiceAddress,
  currentTimestamp,
  encodeInitData,
  ESCROW_PUSH_TYPE,
  nextSalt,
} from './helpers';

describe('SmartInvoiceFactory', function () {
  /* -------------------------------------------------------------------------- */
  /*                                   SETUP                                    */
  /* -------------------------------------------------------------------------- */
  let invoiceFactory: ContractTypesMap['SmartInvoiceFactory'];
  let escrowImpl: ContractTypesMap['SmartInvoiceEscrowPush'];
  let publicClient: PublicClient;
  let owner: WalletClient;
  let client: WalletClient;
  let clientReceiver: WalletClient;
  let resolver: WalletClient;
  let provider: WalletClient;
  let providerReceiver: WalletClient;

  let token: Hex;
  let tokenContract: ContractTypesMap['MockToken'];

  let wrappedETH: Hex;
  let wrappedETHContract: ContractTypesMap['MockWETH'];

  let milestoneAmounts: bigint[];
  let terminationTime: number;
  const requireVerification = true;

  let escrowInitData: {
    client: Hex;
    resolverData: Hex;
    token: Hex;
    terminationTime: bigint;
    requireVerification: boolean;
    providerReceiver: Hex;
    clientReceiver: Hex;
    feeBPS: bigint;
    treasury: Hex;
    details: string;
  };

  const addEscrowImplementation = async (): Promise<Hex> => {
    return invoiceFactory.write.addImplementation([
      ESCROW_PUSH_TYPE,
      escrowImpl.address,
    ]);
  };

  const predict = async (
    _recipient: Hex,
    _amounts: bigint[],
    _data: Hex,
    _type: Hex,
    _version: bigint,
    _salt: Hex,
    _deployer: Hex,
  ) =>
    invoiceFactory.read.predictDeterministicAddress([
      _recipient,
      _amounts,
      _data,
      _type,
      _version,
      _salt,
      _deployer,
    ]);

  beforeEach(async function () {
    [owner, client, clientReceiver, resolver, provider, providerReceiver] =
      await viem.getWalletClients();
    publicClient = await viem.getPublicClient();

    // tokens
    tokenContract = await viem.deployContract('MockToken');
    token = getAddress(tokenContract.address);

    wrappedETHContract = await viem.deployContract('MockWETH');
    wrappedETH = getAddress(wrappedETHContract.address);

    // factory and escrow implementation
    invoiceFactory = await viem.deployContract('SmartInvoiceFactory', [
      wrappedETH,
    ]);
    escrowImpl = await viem.deployContract('SmartInvoiceEscrowPush', [
      wrappedETH,
      invoiceFactory.address,
    ]);

    // data
    terminationTime = (await currentTimestamp()) + 30 * 24 * 60 * 60;

    const resolverData = encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [resolver.account.address, 500n],
    );

    escrowInitData = {
      client: getAddress(client.account.address),
      resolverData,
      token,
      terminationTime: BigInt(terminationTime),
      requireVerification,
      providerReceiver: getAddress(providerReceiver.account.address),
      clientReceiver: getAddress(clientReceiver.account.address),
      feeBPS: 0n,
      treasury: zeroAddress,
      details: '',
    };

    milestoneAmounts = [
      10n * 10n ** 18n, // 10 tokens with 18 decimals
      10n * 10n ** 18n,
    ];
  });

  /* -------------------------------------------------------------------------- */
  /*                           DEPLOYMENT & ACCESS CONTROL                      */
  /* -------------------------------------------------------------------------- */

  describe('Deployment & Roles', function () {
    it('deploys with invoiceCount = 0', async function () {
      expect(await invoiceFactory.read.invoiceCount()).to.equal(0n);
    });

    it('reverts if wrapped token = zero address', async function () {
      const tx = viem.deployContract('SmartInvoiceFactory', [zeroAddress]);
      await expect(tx).to.be.revertedWithCustomError(
        invoiceFactory,
        'InvalidWrappedETH',
      );
    });

    it('assigns DEFAULT_ADMIN and ADMIN to deployer', async function () {
      const adminRole = await invoiceFactory.read.ADMIN();
      const defaultAdminRole = await invoiceFactory.read.DEFAULT_ADMIN_ROLE();
      expect(
        await invoiceFactory.read.hasRole([adminRole, owner.account.address]),
      ).to.equal(true);
      expect(
        await invoiceFactory.read.hasRole([
          defaultAdminRole,
          owner.account.address,
        ]),
      ).to.equal(true);
    });

    it('exposes WRAPPED_ETH address', async function () {
      expect(await invoiceFactory.read.WRAPPED_ETH()).to.equal(
        getAddress(wrappedETHContract.address),
      );
    });

    it('receive() rejects ETH with ETHNotAccepted', async function () {
      const tx = owner.sendTransaction({
        to: invoiceFactory.address,
        value: 1n,
      });
      await expect(tx).to.be.revertedWithCustomError(
        invoiceFactory,
        'ETHNotAccepted',
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                              IMPLEMENTATIONS                               */
  /* -------------------------------------------------------------------------- */

  describe('Implementations registry', function () {
    it('admin can add first implementation (version 0)', async function () {
      await expect(addEscrowImplementation())
        .to.emit(invoiceFactory, 'AddImplementation')
        .withArgs(ESCROW_PUSH_TYPE, 0n, getAddress(escrowImpl.address));

      expect(
        await invoiceFactory.read.currentVersions([ESCROW_PUSH_TYPE]),
      ).to.equal(0n);
      expect(
        await invoiceFactory.read.getImplementation([ESCROW_PUSH_TYPE, 0n]),
      ).to.equal(getAddress(escrowImpl.address));

      // public mapping getter
      expect(
        await invoiceFactory.read.implementations([ESCROW_PUSH_TYPE, 0n]),
      ).to.equal(getAddress(escrowImpl.address));
    });

    it('non-admin addImplementation reverts', async function () {
      const tx = invoiceFactory.write.addImplementation(
        [ESCROW_PUSH_TYPE, escrowImpl.address],
        { account: client.account },
      );
      await expect(tx).to.be.reverted;
    });

    it('addImplementation with zero address reverts', async function () {
      const tx = invoiceFactory.write.addImplementation([
        ESCROW_PUSH_TYPE,
        zeroAddress,
      ]);
      await expect(tx).to.be.revertedWithCustomError(
        invoiceFactory,
        'ZeroAddressImplementation',
      );
    });

    it('adds multiple versions for a type, keeping currentVersions in sync', async function () {
      // v0
      await addEscrowImplementation();

      // Deploy a new implementation (v1)
      const escrowImpl2 = await viem.deployContract('SmartInvoiceEscrowPush', [
        wrappedETH,
        invoiceFactory.address,
      ]);

      await expect(
        invoiceFactory.write.addImplementation([
          ESCROW_PUSH_TYPE,
          escrowImpl2.address,
        ]),
      )
        .to.emit(invoiceFactory, 'AddImplementation')
        .withArgs(ESCROW_PUSH_TYPE, 1, getAddress(escrowImpl2.address));

      expect(
        await invoiceFactory.read.currentVersions([ESCROW_PUSH_TYPE]),
      ).to.equal(1n);
      expect(
        await invoiceFactory.read.getImplementation([ESCROW_PUSH_TYPE, 0n]),
      ).to.equal(getAddress(escrowImpl.address));
      expect(
        await invoiceFactory.read.getImplementation([ESCROW_PUSH_TYPE, 1n]),
      ).to.equal(getAddress(escrowImpl2.address));
    });

    it('setCurrentVersion: admin can point back to an older version; non-admin reverts; non-existent version reverts', async function () {
      // Add v0 and v1
      await addEscrowImplementation();
      const escrowImpl2 = await viem.deployContract('SmartInvoiceEscrowPush', [
        wrappedETH,
        invoiceFactory.address,
      ]);
      await invoiceFactory.write.addImplementation([
        ESCROW_PUSH_TYPE,
        escrowImpl2.address,
      ]);
      expect(
        await invoiceFactory.read.currentVersions([ESCROW_PUSH_TYPE]),
      ).to.equal(1n);

      // Non-admin revert
      await expect(
        invoiceFactory.write.setCurrentVersion([ESCROW_PUSH_TYPE, 0n], {
          account: client.account,
        }),
      ).to.be.reverted;

      // Non-existent version
      await expect(
        invoiceFactory.write.setCurrentVersion([ESCROW_PUSH_TYPE, 42n]),
      ).to.be.revertedWithCustomError(
        invoiceFactory,
        'ImplementationDoesNotExist',
      );

      // Admin success: back to v0
      await invoiceFactory.write.setCurrentVersion([ESCROW_PUSH_TYPE, 0n]);
      expect(
        await invoiceFactory.read.currentVersions([ESCROW_PUSH_TYPE]),
      ).to.equal(0n);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                         CREATE (DETERMINISTIC / CREATE2)                   */
  /* -------------------------------------------------------------------------- */

  describe('CreateDeterministic / predictDeterministicAddress', function () {
    it('predictDeterministicAddress reverts if implementation missing', async function () {
      const fakeType = keccak256(toBytes('fake-type'));
      const data = encodeInitData(escrowInitData);
      await expect(
        invoiceFactory.read.predictDeterministicAddress([
          provider.account.address,
          [10n, 10n],
          data,
          fakeType,
          0n,
          zeroHash,
          client.account.address,
        ]),
      ).to.be.revertedWithCustomError(
        invoiceFactory,
        'ImplementationDoesNotExist',
      );
    });

    it('predicts and deploys at same address; version taken from explicit param', async function () {
      await addEscrowImplementation();

      // Add v1 and change pointer to v1 to prove createDeterministic must use v1
      const escrowImpl2 = await viem.deployContract('SmartInvoiceEscrowPush', [
        wrappedETH,
        invoiceFactory.address,
      ]);
      await invoiceFactory.write.addImplementation([
        ESCROW_PUSH_TYPE,
        escrowImpl2.address,
      ]);

      const v1 = 1n;
      expect(
        await invoiceFactory.read.currentVersions([ESCROW_PUSH_TYPE]),
      ).to.equal(v1);

      const salt = keccak256(toBytes('salt-demo'));
      const data = encodeInitData(escrowInitData);
      const predicted = await predict(
        provider.account.address,
        [10n, 10n],
        data,
        ESCROW_PUSH_TYPE,
        v1,
        salt,
        owner.account.address,
      );
      const hash = await invoiceFactory.write.createDeterministic([
        provider.account.address,
        [10n, 10n],
        data,
        ESCROW_PUSH_TYPE,
        v1,
        salt,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const actual = await awaitInvoiceAddress(receipt);

      expect(actual).to.equal(predicted);

      await expect(hash)
        .to.emit(invoiceFactory, 'InvoiceCreated')
        .withArgs(0, actual, [10n, 10n], ESCROW_PUSH_TYPE, v1);
    });

    it('reverts createDeterministic with no implementation', async function () {
      const salt = keccak256(toBytes('x'));
      const data = encodeInitData(escrowInitData);
      const tx = invoiceFactory.write.createDeterministic([
        provider.account.address,
        [10n, 10n],
        data,
        keccak256(toBytes('fake')),
        0n,
        salt,
      ]);
      await expect(tx).to.be.revertedWithCustomError(
        invoiceFactory,
        'ImplementationDoesNotExist',
      );
    });

    it('getInvoiceAddress: out-of-bounds index reverts', async function () {
      await expect(
        invoiceFactory.read.getInvoiceAddress([0n]),
      ).to.be.revertedWithCustomError(invoiceFactory, 'InvalidInvoiceIndex');
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                   FUNDING                                  */
  /* -------------------------------------------------------------------------- */

  describe('Create + Deposit (funding paths)', function () {
    beforeEach(async function () {
      await addEscrowImplementation();
    });

    it('ERC20 path: creates & funds; emits InvoiceFunded', async function () {
      const fundAmount = milestoneAmounts.reduce((s, v) => s + v, 0n);

      // give client ERC20 and approve factory
      await tokenContract.write.setBalanceOf([
        client.account.address,
        fundAmount,
      ]);
      await tokenContract.write.approve([invoiceFactory.address, fundAmount], {
        account: client.account,
      });

      const data = encodeInitData(escrowInitData);
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const salt = keccak256(toBytes('fund-erc20'));

      const txHash = await invoiceFactory.write.createDeterministicAndDeposit(
        [
          getAddress(provider.account.address),
          milestoneAmounts,
          data,
          ESCROW_PUSH_TYPE,
          version,
          salt,
          fundAmount,
        ],
        { account: client.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const escrowAddress = await awaitInvoiceAddress(receipt);
      expect(escrowAddress).to.not.equal(undefined);

      await expect(txHash)
        .to.emit(invoiceFactory, 'InvoiceFunded')
        .withArgs(
          escrowAddress!,
          getAddress(tokenContract.address),
          fundAmount,
        );

      // escrow received funds
      expect(await tokenContract.read.balanceOf([escrowAddress!])).to.equal(
        fundAmount,
      );
    });

    it('ETH path (WETH): wraps and funds; emits InvoiceFunded', async function () {
      const fundAmount = milestoneAmounts.reduce((s, v) => s + v, 0n);
      const data = encodeInitData({
        ...escrowInitData,
        token: wrappedETH,
      });
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const salt = keccak256(toBytes('fund-erc20'));

      const txHash = await invoiceFactory.write.createDeterministicAndDeposit(
        [
          getAddress(provider.account.address),
          milestoneAmounts,
          data,
          ESCROW_PUSH_TYPE,
          version,
          salt,
          fundAmount,
        ],
        { account: client.account, value: fundAmount },
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const escrowAddress = await awaitInvoiceAddress(receipt);

      await expect(txHash)
        .to.emit(invoiceFactory, 'InvoiceFunded')
        .withArgs(escrowAddress!, getAddress(wrappedETH), fundAmount);

      expect(
        await wrappedETHContract.read.balanceOf([escrowAddress!]),
      ).to.equal(fundAmount);
    });

    it('reverts when ETH sent != fundAmount (FundingAmountMismatch)', async function () {
      const fundAmount = milestoneAmounts.reduce((s, v) => s + v, 0n);
      const data = encodeInitData({
        ...escrowInitData,
        token: wrappedETH,
      });
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const salt = keccak256(toBytes('fund-erc20'));

      const tx = invoiceFactory.write.createDeterministicAndDeposit(
        [
          getAddress(provider.account.address),
          milestoneAmounts,
          data,
          ESCROW_PUSH_TYPE,
          version,
          salt,
          fundAmount,
        ],
        { account: client.account, value: fundAmount / 2n },
      );
      await expect(tx).to.be.revertedWithCustomError(
        invoiceFactory,
        'FundingAmountMismatch',
      );
    });

    it('reverts when fundAmount == 0 (InvalidFundAmount)', async function () {
      const data = encodeInitData(escrowInitData);
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const salt = keccak256(toBytes('fund-erc20'));
      const tx = invoiceFactory.write.createDeterministicAndDeposit(
        [
          getAddress(provider.account.address),
          milestoneAmounts,
          data,
          ESCROW_PUSH_TYPE,
          version,
          salt,
          0n,
        ],
        { account: client.account },
      );
      await expect(tx).to.be.revertedWithCustomError(
        invoiceFactory,
        'InvalidFundAmount',
      );
    });

    it('reverts if ERC20 path is used but value > 0 (UnexpectedETH)', async function () {
      const fundAmount = milestoneAmounts.reduce((s, v) => s + v, 0n);
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const salt = keccak256(toBytes('fund-erc20'));
      const data = encodeInitData(escrowInitData);

      // fund client ERC20 and approve
      await tokenContract.write.setBalanceOf([
        client.account.address,
        fundAmount,
      ]);
      await tokenContract.write.approve([invoiceFactory.address, fundAmount], {
        account: client.account,
      });

      const tx = invoiceFactory.write.createDeterministicAndDeposit(
        [
          getAddress(provider.account.address),
          milestoneAmounts,
          data,
          ESCROW_PUSH_TYPE,
          version,
          salt,
          fundAmount,
        ],
        { account: client.account, value: 1n }, // stray ETH
      );
      await expect(tx).to.be.revertedWithCustomError(
        invoiceFactory,
        'UnexpectedETH',
      );
    });

    it('deterministic + ERC20 funding works and address matches prediction', async function () {
      const fundAmount = milestoneAmounts.reduce((s, v) => s + v, 0n);
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const salt = keccak256(toBytes('fund-erc20'));

      await tokenContract.write.setBalanceOf([
        client.account.address,
        fundAmount,
      ]);
      await tokenContract.write.approve([invoiceFactory.address, fundAmount], {
        account: client.account,
      });

      const data = encodeInitData(escrowInitData);
      const predicted = await predict(
        provider.account.address,
        milestoneAmounts,
        data,
        ESCROW_PUSH_TYPE,
        version,
        salt,
        client.account.address,
      );

      const txHash = await invoiceFactory.write.createDeterministicAndDeposit(
        [
          getAddress(provider.account.address),
          milestoneAmounts,
          data,
          ESCROW_PUSH_TYPE,
          version,
          salt,
          fundAmount,
        ],
        { account: client.account },
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const addr = await awaitInvoiceAddress(receipt);

      expect(addr).to.equal(predicted);
      expect(await tokenContract.read.balanceOf([addr!])).to.equal(fundAmount);
    });

    it('deterministic + ETH (WETH) funding works and address matches prediction', async function () {
      const fundAmount = milestoneAmounts.reduce((s, v) => s + v, 0n);
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const salt = keccak256(toBytes('fund-eth'));
      const data = encodeInitData({
        ...escrowInitData,
        token: wrappedETH,
      });
      const predicted = await predict(
        provider.account.address,
        milestoneAmounts,
        data,
        ESCROW_PUSH_TYPE,
        version,
        salt,
        client.account.address,
      );

      const txHash = await invoiceFactory.write.createDeterministicAndDeposit(
        [
          getAddress(provider.account.address),
          milestoneAmounts,
          data,
          ESCROW_PUSH_TYPE,
          version,
          salt,
          fundAmount,
        ],
        { account: client.account, value: fundAmount },
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const addr = await awaitInvoiceAddress(receipt);

      expect(addr).to.equal(predicted);
      expect(await wrappedETHContract.read.balanceOf([addr!])).to.equal(
        fundAmount,
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                             RESOLUTION RATES                               */
  /* -------------------------------------------------------------------------- */

  describe('Resolution rate management', function () {
    it('updates and reads back via mapping getter & dedicated view', async function () {
      const details = keccak256(toBytes('details-1'));
      await expect(
        invoiceFactory.write.updateResolutionRateBPS([15n, details], {
          account: resolver.account,
        }),
      )
        .to.emit(invoiceFactory, 'UpdateResolutionRate')
        .withArgs(getAddress(resolver.account.address), 15n, details);

      // resolutionRates mapping is now private, so we can't test it directly
      expect(
        await invoiceFactory.read.resolutionRateOf([resolver.account.address]),
      ).to.equal(15n);
    });

    it('handles distinct resolvers independently', async function () {
      const [, , , , , , , , otherResolver] = await viem.getWalletClients();
      await invoiceFactory.write.updateResolutionRateBPS([10n, zeroHash], {
        account: resolver.account,
      });
      await invoiceFactory.write.updateResolutionRateBPS([30n, zeroHash], {
        account: otherResolver.account,
      });

      expect(
        await invoiceFactory.read.resolutionRateOf([resolver.account.address]),
      ).to.equal(10n);
      expect(
        await invoiceFactory.read.resolutionRateOf([
          otherResolver.account.address,
        ]),
      ).to.equal(30n);
    });

    it('enforces bounds: [1, 1000] allowed; 0 and above 1000 revert', async function () {
      await expect(
        invoiceFactory.write.updateResolutionRateBPS([0n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(invoiceFactory, 'InvalidResolutionRate');

      await expect(
        invoiceFactory.write.updateResolutionRateBPS([1001n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(invoiceFactory, 'InvalidResolutionRate');

      // edges ok
      await expect(
        invoiceFactory.write.updateResolutionRateBPS([1n, zeroHash], {
          account: resolver.account,
        }),
      ).to.emit(invoiceFactory, 'UpdateResolutionRate');

      await expect(
        invoiceFactory.write.updateResolutionRateBPS([1000n, zeroHash], {
          account: resolver.account,
        }),
      ).to.emit(invoiceFactory, 'UpdateResolutionRate');
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                               GETTERS & MISC                               */
  /* -------------------------------------------------------------------------- */

  describe('Getters & indexing', function () {
    it('returns correct invoice addresses for multiple invoices', async function () {
      await addEscrowImplementation();
      const version = await invoiceFactory.read.currentVersions([
        ESCROW_PUSH_TYPE,
      ]);
      const data = encodeInitData(escrowInitData);

      const addrs: Hex[] = [];
      const N = 3;

      for (let i = 0; i < N; i++) {
        const hash = await invoiceFactory.write.createDeterministic([
          provider.account.address,
          [10n, 10n],
          data,
          ESCROW_PUSH_TYPE,
          version,
          nextSalt(),
        ]);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const addr = await awaitInvoiceAddress(receipt);
        addrs.push(addr!);
      }

      for (let i = 0; i < N; i++) {
        expect(
          await invoiceFactory.read.getInvoiceAddress([BigInt(i)]),
        ).to.equal(addrs[i]);
      }
      expect(await invoiceFactory.read.invoiceCount()).to.equal(BigInt(N));
    });

    it('predictDeterministicAddress yields distinct addresses for distinct salts', async function () {
      await addEscrowImplementation();
      const v = await invoiceFactory.read.currentVersions([ESCROW_PUSH_TYPE]);
      const s1 = keccak256(toBytes('s1'));
      const s2 = keccak256(toBytes('s2'));
      const data = encodeInitData(escrowInitData);

      const p1 = await predict(
        provider.account.address,
        [10n, 10n],
        data,
        ESCROW_PUSH_TYPE,
        v,
        s1,
        client.account.address,
      );
      const p2 = await predict(
        provider.account.address,
        [10n, 10n],
        data,
        ESCROW_PUSH_TYPE,
        v,
        s2,
        client.account.address,
      );
      expect(p1).to.not.equal(p2);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                   SWEEPERS                                 */
  /* -------------------------------------------------------------------------- */

  describe('Sweepers & admin-only ops', function () {
    it('sweepERC20: admin can rescue tokens; non-admin reverts', async function () {
      // Give factory 100 tokens
      await tokenContract.write.setBalanceOf([invoiceFactory.address, 100n]);

      // Non-admin cannot sweep
      await expect(
        invoiceFactory.write.sweepERC20(
          [tokenContract.address, client.account.address, 50n],
          {
            account: client.account,
          },
        ),
      ).to.be.reverted;

      // Admin can sweep
      await expect(
        invoiceFactory.write.sweepERC20([
          tokenContract.address,
          client.account.address,
          50n,
        ]),
      ).not.to.be.reverted;

      expect(
        await tokenContract.read.balanceOf([client.account.address]),
      ).to.equal(50n);
      expect(
        await tokenContract.read.balanceOf([invoiceFactory.address]),
      ).to.equal(50n);
    });

    it('sweepETH: admin callable (even with 0 balance); non-admin reverts', async function () {
      // Non-admin
      await expect(
        invoiceFactory.write.sweepETH([client.account.address], {
          account: client.account,
        }),
      ).to.be.reverted;

      // With zero balance this should still not revert for admin
      await expect(invoiceFactory.write.sweepETH([client.account.address])).not
        .to.be.reverted;
    });
  });
});
