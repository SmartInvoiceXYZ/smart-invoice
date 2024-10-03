import { Button, SimpleGrid, Stack } from '@chakra-ui/react';
import {
  InvoiceDetails,
  ModalTypes,
  OverlayContextType,
} from '@smartinvoicexyz/types';
import { Modal } from '@smartinvoicexyz/ui';
import _ from 'lodash';
import { useAccount, useChainId } from 'wagmi';

import { DepositFunds } from './DepositFunds';
import { WithdrawFunds } from './WithdrawFunds';

export const InstantButtonManager: React.FC<
  { invoice: InvoiceDetails } & OverlayContextType
> = ({ invoice, modals, closeModals, openModal }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { client, provider, tokenBalance, fulfilled } = _.pick(invoice, [
    'client',
    'provider',
    'total',
    'tokenBalance',
    'fulfilled',
    'amountFulfilled',
    'deadline',
    'deadlineLabel',
    'lateFee',
    'totalDue',
  ]);

  const isClient = _.toLower(address) === client;
  const isProvider = _.toLower(address) === provider;
  const isTippable = fulfilled;
  const isWithdrawable = tokenBalance?.value
    ? tokenBalance.value > BigInt(0)
    : false;

  if (!invoice || !isConnected || chainId !== invoice?.chainId) return null;

  return (
    <>
      <Stack w="100%">
        {isClient && (
          <SimpleGrid columns={isTippable ? 2 : 1} spacing="1rem" w="100%">
            <Button
              textTransform="uppercase"
              onClick={() => openModal(ModalTypes.DEPOSIT)}
              isDisabled={fulfilled}
            >
              {fulfilled ? 'Paid' : 'Make Payment'}
            </Button>
            {isTippable && (
              <Button
                variant="outline"
                textTransform="uppercase"
                onClick={() => openModal(ModalTypes.DEPOSIT)}
              >
                Add Tip
              </Button>
            )}
          </SimpleGrid>
        )}
        {isProvider && (
          <SimpleGrid columns={1} spacing="1rem" w="100%">
            <Button
              textTransform="uppercase"
              onClick={() => openModal(ModalTypes.WITHDRAW)}
              isDisabled={!isWithdrawable}
            >
              {tokenBalance?.value === BigInt(0) && fulfilled
                ? 'Received'
                : 'Receive'}
            </Button>
          </SimpleGrid>
        )}
      </Stack>

      <Modal isOpen={modals?.deposit} onClose={closeModals}>
        <DepositFunds invoice={invoice} onClose={closeModals} />
      </Modal>
      <Modal isOpen={modals?.withdraw} onClose={closeModals}>
        <WithdrawFunds invoice={invoice} onClose={closeModals} />
      </Modal>
    </>
  );
};
