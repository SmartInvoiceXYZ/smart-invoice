import { Button, SimpleGrid } from '@chakra-ui/react';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { Modals } from '@smart-invoice/types';
import { Modal } from '@smart-invoice/ui';
import _ from 'lodash';
import { useAccount } from 'wagmi';

import { DepositFunds } from './DepositFunds';
import { LockFunds } from './LockFunds';
import { ReleaseFunds } from './ReleaseFunds';
import { ResolveFunds } from './ResolveFunds';
import { WithdrawFunds } from './WithdrawFunds';

// this component is here to prevent circular dependency with smart-invoice/ui

export function InvoiceButtonManager({
  invoice,
  modals,
  setModals,
}: {
  invoice: InvoiceDetails | undefined;
  modals: Modals;
  setModals: (m: Partial<Modals>) => void;
}) {
  const { address } = useAccount();

  const {
    client,
    resolver,
    isReleasable,
    isExpired,
    isLockable,
    isWithdrawable,
    tokenBalance,
  } = _.pick(invoice, [
    'client',
    'resolver',
    'isReleasable',
    'isExpired',
    'isLockable',
    'isWithdrawable',
    'tokenBalance',
  ]);

  const isRaidParty = _.toLower(address) === _.toLower(invoice?.provider);
  const isClient = _.toLower(address) === _.toLower(client);
  const isResolver = _.toLower(address) === _.toLower(resolver);

  const onLock = () => {
    setModals({ lock: true });
  };

  const onDeposit = () => {
    setModals({ deposit: true });
  };

  const onRelease = async () => {
    if (!isReleasable || !isClient) {
      // eslint-disable-next-line no-console
      console.log('not releasable or client');
      return;
    }

    setModals({ release: true });
  };

  const onResolve = async () => {
    if (!isResolver) {
      // eslint-disable-next-line no-console
      console.log('not resolver');
      return;
    }

    setModals({ resolve: true });
  };

  const onWithdraw = async () => {
    if (!isExpired || !isClient) {
      // eslint-disable-next-line no-console
      console.log('not expired or client');
      return;
    }

    setModals({ withdraw: true });
  };

  const columnsCheck = [
    isResolver && invoice?.isLocked, // resolve
    isLockable && (isClient || isRaidParty), // lock
    isReleasable && isClient, // release
    true, // deposit
    isExpired &&
      !!tokenBalance?.value &&
      tokenBalance?.value > BigInt(0) &&
      isClient, // withdraw
  ];
  const columns = _.size(_.filter(columnsCheck, v => v === true));

  if (!invoice) return null;

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
        {isLockable && (isClient || isRaidParty) && (
          <Button
            variant="solid"
            backgroundColor="red.500"
            _hover={{ backgroundColor: 'red.400' }}
            textTransform="uppercase"
            onClick={onLock}
            isDisabled={!isClient && !isRaidParty}
          >
            Lock
          </Button>
        )}
        <Button variant="solid" textTransform="uppercase" onClick={onDeposit}>
          Deposit
        </Button>
        {isReleasable && (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={onRelease}
            isDisabled={!isClient}
          >
            Release
          </Button>
        )}

        {isWithdrawable && isClient && (
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
        <LockFunds invoice={invoice} />
      </Modal>
      <Modal isOpen={modals?.deposit} onClose={() => setModals({})}>
        <DepositFunds invoice={invoice} onClose={() => setModals({})} />
      </Modal>
      <Modal isOpen={modals?.release} onClose={() => setModals({})}>
        <ReleaseFunds invoice={invoice} />
      </Modal>
      <Modal isOpen={modals?.resolve} onClose={() => setModals({})}>
        <ResolveFunds invoice={invoice} onClose={() => setModals({})} />
      </Modal>
      <Modal isOpen={modals?.withdraw} onClose={() => setModals({})}>
        <WithdrawFunds invoice={invoice} />
      </Modal>
    </>
  );
}
