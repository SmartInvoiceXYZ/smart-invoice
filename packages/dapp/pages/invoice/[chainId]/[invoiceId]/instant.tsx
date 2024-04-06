import {
  Button,
  Divider,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { DepositFunds, TipForm, WithdrawFunds } from '@smart-invoice/forms';
import { useInvoiceDetails } from '@smart-invoice/hooks';
import {
  Container,
  InvoiceMetaDetails,
  InvoiceNotFound,
  Loader,
  Modal,
  useMediaStyles,
} from '@smart-invoice/ui';
import _ from 'lodash';
import { useParams } from 'next/navigation';
import { Address, formatUnits, Hex, hexToNumber, isAddress } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import { useOverlay } from '../../../../contexts/OverlayContext';

function ViewInstantInvoice() {
  const { chainId: hexChainId, invoiceId } = useParams<{
    chainId: Hex;
    invoiceId: Address;
  }>();
  const invoiceChainId = hexChainId && hexToNumber(hexChainId);
  const { modals, setModals } = useOverlay();
  const chainId = useChainId();
  const { address } = useAccount();

  const { invoiceDetails, isLoading } = useInvoiceDetails({
    address: invoiceId,
    chainId: invoiceChainId,
  });

  const {
    client,
    provider,
    total,
    tokenBalance,
    fulfilled,
    amountFulfilled,
    deadline,
    deadlineLabel,
    lateFee,
  } = _.pick(invoiceDetails, [
    'client',
    'provider',
    'total',
    'tokenBalance',
    'fulfilled',
    'amountFulfilled',
    'deadline',
    'deadlineLabel',
    'lateFee',
  ]);

  const leftMinW = useBreakpointValue({ base: '10rem', sm: '20rem' });
  const leftMaxW = useBreakpointValue({ base: '30rem', lg: '22rem' });
  const rightMaxW = useBreakpointValue({ base: '100%', md: '40rem' });
  const { primaryButtonSize } = useMediaStyles();
  // const smallScreen = useBreakpointValue({ base: true, sm: false });

  if (!isAddress(invoiceId) || (invoiceDetails === null && !isLoading)) {
    return <InvoiceNotFound />;
  }

  if (invoiceDetails && chainId !== invoiceChainId) {
    return (
      <InvoiceNotFound chainId={invoiceChainId} heading="Incorrect Network" />
    );
  }

  if (!invoiceDetails || isLoading) {
    return (
      <Container overlay>
        <Loader size="80" />
      </Container>
    );
  }

  const isClient = _.toLower(address) === client;
  const isProvider = _.toLower(address) === provider;

  // TODO fix due
  const due = BigInt(0);
  //   amountFulfilled && amountFulfilled >= (totalDue || fulfilled)
  //     ? BigInt(0)
  //     : totalDue - amountFulfilled;

  const isTippable = fulfilled;
  const isWithdrawable = tokenBalance?.value
    ? tokenBalance.value > BigInt(0)
    : undefined;

  const onDeposit = () => {
    setModals({ deposit: true });
  };

  const onTip = async () => {
    if (!isTippable) {
      // eslint-disable-next-line no-console
      console.log('not tippable');
      return;
    }
    setModals({ deposit: true });
  };

  const onWithdraw = async () => {
    if (!isWithdrawable || !isProvider) {
      // eslint-disable-next-line no-console
      console.log('not withdrawable or provider');
      return;
    }

    setModals({ withdraw: true });
  };

  return (
    <Container overlay>
      <Stack
        spacing="2rem"
        justify="center"
        align="center"
        direction={{ base: 'column', lg: 'row' }}
        w="100%"
        px="1rem"
        py="8rem"
      >
        <Stack
          spacing="1rem"
          minW={leftMinW}
          w="100%"
          maxW={leftMaxW}
          justify="center"
          align="stretch"
          direction="column"
        >
          <InvoiceMetaDetails invoice={invoiceDetails} />
        </Stack>

        <Stack
          spacing={{ base: '2rem', lg: '1.5rem' }}
          w="100%"
          align="stretch"
          maxW={rightMaxW}
        >
          <Flex
            bg="white"
            direction="column"
            justify="space-between"
            px={{ base: '1rem', md: '2rem' }}
            py="1.5rem"
            borderRadius="0.5rem"
            w="100%"
            color="black"
          >
            {total ? (
              <Flex
                justify="space-between"
                align="center"
                fontWeight="bold"
                fontSize="lg"
                mb="1rem"
              >
                <Text>Amount</Text>

                <Text>{`${formatUnits(total, tokenBalance?.decimals || 18)} ${tokenBalance?.symbol}`}</Text>
              </Flex>
            ) : null}

            {!!lateFee && (
              <Flex
                justify="space-between"
                align="center"
                fontWeight="bold"
                fontSize="lg"
                mb="1rem"
              >
                <Flex direction="column">
                  <Text>Late Fee</Text>

                  <Text
                    fontSize="x-small"
                    fontWeight="normal"
                    fontStyle="italic"
                    color="grey"
                  >
                    {deadline ? deadlineLabel : `Not applicable`}
                  </Text>
                </Flex>

                <Text>{`${formatUnits(lateFee, tokenBalance?.decimals || 18)} ${tokenBalance?.symbol}`}</Text>
              </Flex>
            )}

            <Flex
              justify="space-between"
              align="center"
              fontWeight="bold"
              fontSize="lg"
              mb="1rem"
            >
              <Text>Deposited</Text>

              <Text>{`(${formatUnits(
                amountFulfilled || BigInt(0),
                tokenBalance?.decimals || 18,
              )} ${tokenBalance?.symbol})`}</Text>
            </Flex>

            <Divider
              w={{ base: 'calc(100% + 2rem)', md: 'calc(100% + 4rem)' }}
              ml={{ base: '-1rem', md: '-2rem' }}
              my="1rem"
            />

            <Flex
              justify="space-between"
              align="center"
              color="black"
              fontWeight="bold"
              fontSize="lg"
            >
              <Text>
                {amountFulfilled && amountFulfilled > BigInt(0)
                  ? 'Remaining'
                  : 'Total'}{' '}
                Due
              </Text>
              <Text textAlign="right">{`${formatUnits(
                due,
                tokenBalance?.decimals || 18,
              )} ${tokenBalance?.symbol}`}</Text>{' '}
            </Flex>
          </Flex>
          {isClient && (
            <SimpleGrid columns={isTippable ? 2 : 1} spacing="1rem" w="100%">
              <Button
                size={primaryButtonSize}
                textTransform="uppercase"
                onClick={onDeposit}
                isDisabled={fulfilled}
              >
                {fulfilled ? 'Paid' : 'Make Payment'}
              </Button>
              {isTippable && (
                <Button
                  size={primaryButtonSize}
                  variant="outline"
                  fontWeight="bold"
                  textTransform="uppercase"
                  onClick={onTip}
                >
                  Add Tip
                </Button>
              )}
            </SimpleGrid>
          )}
          {isProvider && (
            <SimpleGrid columns={1} spacing="1rem" w="100%">
              <Button
                size={primaryButtonSize}
                textTransform="uppercase"
                onClick={() => onWithdraw()}
                isDisabled={
                  !!tokenBalance?.value && tokenBalance.value <= BigInt(0)
                }
              >
                {tokenBalance?.value === BigInt(0) && fulfilled
                  ? 'Received'
                  : 'Receive'}
              </Button>
            </SimpleGrid>
          )}
        </Stack>

        <Modal isOpen={modals?.deposit} onClose={() => setModals?.({})}>
          <DepositFunds
            invoice={invoiceDetails}
            onClose={() => setModals?.({})}
          />
        </Modal>
        <Modal isOpen={modals?.withdraw} onClose={() => setModals?.({})}>
          <WithdrawFunds
            invoice={invoiceDetails}
            onClose={() => setModals?.({})}
          />
        </Modal>
        <Modal isOpen={modals?.tip} onClose={() => setModals?.({})}>
          <TipForm invoice={invoiceDetails} />
        </Modal>
      </Stack>
    </Container>
  );
}

export default ViewInstantInvoice;
