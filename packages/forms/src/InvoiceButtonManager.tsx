/* eslint-disable no-console */
import { Button, SimpleGrid } from '@chakra-ui/react';
import { Invoice } from '@smart-invoice/graphql';
import { Modals } from '@smart-invoice/types';
import { Modal } from '@smart-invoice/ui';
import _ from 'lodash';
import { Hex } from 'viem';
import { useAccount, useBalance } from 'wagmi';

import { DepositFunds } from './DepositFunds';
import { LockFunds } from './LockFunds';
import { ReleaseFunds } from './ReleaseFunds';
import { ResolveFunds } from './ResolveFunds';
import { WithdrawFunds } from './WithdrawFunds';

// here to prevent circular dependency with smart-invoice/ui

export function InvoiceButtonManager({
  invoice,
  modals,
  setModals,
}: {
  invoice: Invoice;
  modals: Modals;
  setModals: (m: Partial<Modals>) => void;
}) {
  const { address } = useAccount();

  const {
    client,
    isLocked,
    // disputes,
    // resolutions,
    terminationTime,
    currentMilestone: invoiceCurrentMilestone,
    amounts,
    released,
    total,
    resolver,
  } = _.pick(invoice, [
    'client',
    'isLocked',
    // 'disputes',
    // 'resolutions',
    'resolver',
    'terminationTime',
    'currentMilestone',
    'amounts',
    'released',
    'total',
  ]);

  const { data: invoiceTokenBalance } = useBalance({
    address: invoice?.address as Hex,
    token: invoice?.token as Hex,
    enabled: !!invoice?.address && !!invoice?.token,
  });
  console.log(invoiceTokenBalance?.value?.toString());

  const isRaidParty = _.toLower(address) === _.toLower(invoice?.provider);
  const isClient = _.toLower(address) === _.toLower(client);
  const isResolver = _.toLower(address) === _.toLower(resolver);

  const currentMilestone = _.toNumber(invoiceCurrentMilestone?.toString());
  const balance = _.get(invoiceTokenBalance, 'value', BigInt(0));
  // const dispute =
  //   isLocked && !_.isEmpty(disputes) ? _.last(disputes) : undefined;
  const deposited = released && BigInt(released) + BigInt(balance);
  const due =
    deposited &&
    total &&
    (deposited > total ? BigInt(0) : BigInt(total) - deposited);
  // const resolution =
  //  b !isLocked && !_.isEmpty(resolutions) ? _.last(resolutions) : undefined;
  const amount =
    currentMilestone &&
    amounts &&
    BigInt(
      currentMilestone < _.size(amounts) ? amounts?.[currentMilestone] : 0,
    );
  const isExpired = terminationTime
    ? terminationTime <= new Date().getTime() / 1000
    : undefined;
  const isLockable = !isExpired && !isLocked && balance > 0;
  const isReleasable = amount && !isLocked && balance >= amount && balance > 0;

  const onLock = () => {
    setModals({ lock: true });
  };

  const onDeposit = () => {
    setModals({ deposit: true });
  };

  const onRelease = async () => {
    if (!isReleasable || !isClient) {
      console.log('not releasable or client');
      return;
    }

    setModals({ release: true });
  };

  const onResolve = async () => {
    if (!isResolver) {
      console.log('not resolver');
      return;
    }

    setModals({ resolve: true });
  };

  const onWithdraw = async () => {
    if (!isExpired || !isClient) {
      console.log('not expired or client');
      return;
    }

    setModals({ withdraw: true });
  };

  const columnsCheck = [
    isResolver && invoice?.isLocked,
    true, // hide in some cases?
    isLockable && (isClient || isRaidParty),
    isExpired && balance > 0 && isClient,
  ];
  const columns = _.size(_.filter(columnsCheck, v => v === true));

  return (
    <>
      <SimpleGrid columns={columns} spacing="1rem" w="100%" mt="1rem">
        {isResolver && invoice?.isLocked && (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={onResolve}
            isDisabled={!isResolver}
          >
            Resolve
          </Button>
        )}
        {isReleasable ? (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={onRelease}
            isDisabled={!isClient}
          >
            Release
          </Button>
        ) : (
          <Button variant="solid" textTransform="uppercase" onClick={onDeposit}>
            Deposit Due
          </Button>
        )}
        {isLockable && (isClient || isRaidParty) && (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={onLock}
            isDisabled={!isClient && !isRaidParty}
          >
            Lock
          </Button>
        )}
        {isExpired && balance > 0 && isClient && (
          <Button
            variant="solid"
            textTransform="uppercase"
            isDisabled={!isExpired}
            onClick={onWithdraw}
          >
            Withdraw
          </Button>
        )}
      </SimpleGrid>

      <Modal isOpen={modals?.lock} onClose={() => setModals({})}>
        <LockFunds invoice={invoice} balance={balance} />
      </Modal>
      <Modal isOpen={modals?.deposit} onClose={() => setModals({})}>
        <DepositFunds invoice={invoice} deposited={deposited} due={due} />
      </Modal>
      <Modal isOpen={modals?.release} onClose={() => setModals({})}>
        <ReleaseFunds invoice={invoice} balance={balance} />
      </Modal>
      <Modal isOpen={modals?.resolve} onClose={() => setModals({})}>
        <ResolveFunds
          invoice={invoice}
          balance={balance}
          close={() => setModals({})}
        />
      </Modal>
      <Modal isOpen={modals?.withdraw} onClose={() => setModals({})}>
        <WithdrawFunds invoice={invoice} balance={balance} />
      </Modal>
    </>
  );
}
