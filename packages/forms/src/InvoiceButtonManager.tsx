import { Button, SimpleGrid } from '@chakra-ui/react';
import {
  InvoiceDetails,
  ModalTypes,
  OverlayContextType,
} from '@smartinvoicexyz/types';
import { Modal } from '@smartinvoicexyz/ui';
import _ from 'lodash';
import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { DepositFunds } from './DepositFunds';
import { LockFunds } from './LockFunds';
import { ReleaseFunds } from './ReleaseFunds';
import { ResolveFunds } from './ResolveFunds';
import { WithdrawFunds } from './WithdrawFunds';

type ButtonEnabled = {
  deposit: boolean;
  lock: boolean;
  release: boolean;
  resolve: boolean;
  withdraw: boolean;
};

export function InvoiceButtonManager({
  invoice,
  modals,
  openModal,
  closeModals,
}: {
  invoice: Partial<InvoiceDetails> | undefined;
} & OverlayContextType) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { buttonEnabled, numColumns } = useMemo(() => {
    const {
      client,
      provider,
      resolver,
      isReleasable: isInvoiceReleasable,
      isExpired: isInvoiceExpired,
      isLockable: isInvoiceLockable,
      isLocked: isInvoiceLocked,
      isWithdrawable: isInvoiceWithdrawable,
      dispute,
      resolution,
    } = _.pick(invoice, [
      'client',
      'provider',
      'resolver',
      'isReleasable',
      'isExpired',
      'isLockable',
      'isLocked',
      'isWithdrawable',
      'tokenBalance',
      'dispute',
      'resolution',
    ]);

    const isProvider = _.toLower(address) === _.toLower(provider);
    const isClient = _.toLower(address) === _.toLower(client);
    const isResolver = _.toLower(address) === _.toLower(resolver);
    const isDisputed = (!!dispute || !!resolution) ?? false;
    const isLockable = isInvoiceLockable ?? false;
    const isLocked = isInvoiceLocked ?? false;
    const isReleasable = isInvoiceReleasable ?? false;
    const isWithdrawable = isInvoiceWithdrawable ?? false;
    const isExpired = isInvoiceExpired ?? false;

    const bEnabled: ButtonEnabled = {
      deposit: !isDisputed,
      lock: (isProvider || isClient) && isLockable && !isDisputed,
      release: isReleasable && isClient && !isDisputed,
      resolve: isResolver && isLocked && isDisputed,
      withdraw: isClient && isWithdrawable && isExpired && !isDisputed,
    };

    const nColumns = _.size(_.pickBy(bEnabled, value => value === true));

    return { buttonEnabled: bEnabled, numColumns: nColumns };
  }, [invoice, address]);

  if (!invoice || !isConnected || chainId !== invoice?.chainId) return null;

  return (
    <>
      <SimpleGrid columns={numColumns} spacing="1rem" w="100%" mt="1rem">
        {buttonEnabled.resolve && (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={() => openModal(ModalTypes.RESOLVE)}
          >
            Resolve
          </Button>
        )}
        {buttonEnabled.lock && (
          <Button
            variant="solid"
            backgroundColor="red.500"
            _hover={{ backgroundColor: 'red.400' }}
            textTransform="uppercase"
            onClick={() => openModal(ModalTypes.LOCK)}
          >
            Lock
          </Button>
        )}
        {buttonEnabled.deposit && (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={() => openModal(ModalTypes.DEPOSIT)}
          >
            Deposit
          </Button>
        )}
        {buttonEnabled.release && (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={() => openModal(ModalTypes.RELEASE)}
          >
            Release
          </Button>
        )}

        {buttonEnabled.withdraw && (
          <Button
            variant="solid"
            textTransform="uppercase"
            onClick={() => openModal(ModalTypes.WITHDRAW)}
          >
            Withdraw
          </Button>
        )}
      </SimpleGrid>

      <Modal isOpen={modals?.lock} onClose={closeModals}>
        <LockFunds invoice={invoice} onClose={closeModals} />
      </Modal>
      <Modal isOpen={modals?.deposit} onClose={closeModals}>
        <DepositFunds invoice={invoice} onClose={closeModals} />
      </Modal>
      <Modal isOpen={modals?.release} onClose={closeModals}>
        <ReleaseFunds invoice={invoice} onClose={closeModals} />
      </Modal>
      <Modal isOpen={modals?.resolve} onClose={closeModals}>
        <ResolveFunds invoice={invoice} onClose={closeModals} />
      </Modal>
      <Modal isOpen={modals?.withdraw} onClose={closeModals}>
        <WithdrawFunds invoice={invoice} onClose={closeModals} />
      </Modal>
    </>
  );
}
