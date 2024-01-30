import {
  Button,
  Divider,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { DepositFunds, WithdrawFunds } from '@smart-invoice/forms';
import { useInvoiceDetails } from '@smart-invoice/hooks';
import {
  Container,
  InvoiceMetaDetails,
  InvoiceNotFound,
  Loader,
  Modal,
} from '@smart-invoice/ui';
import { getDateString } from '@smart-invoice/utils';
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
  console.log(invoiceDetails);

  const {
    client,
    provider,
    total,
    tokenBalance,
    // totalDue,
    fulfilled,
    amountFulfilled,
    deadline,
    lateFee,
    lateFeeTimeInterval,
  } = _.pick(invoiceDetails, [
    'client',
    'provider',
    'total',
    // 'totalDue',
    'tokenBalance',
    'fulfilled',
    'amountFulfilled',
    'deadline',
    'lateFee',
    'lateFeeTimeInterval',
  ]);

  const leftMinW = useBreakpointValue({ base: '10rem', sm: '20rem' });
  const leftMaxW = useBreakpointValue({ base: '30rem', lg: '22rem' });
  const rightMaxW = useBreakpointValue({ base: '100%', md: '40rem' });
  const buttonSize = useBreakpointValue({ base: 'md', lg: 'lg' });
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
    setModals({ tip: true });
  };

  const onWithdraw = async () => {
    if (!isWithdrawable || !isProvider) {
      // eslint-disable-next-line no-console
      console.log('not withdrawable or provider');
      return;
    }

    setModals({ withdraw: true });
  };

  const daysPerInterval = lateFeeTimeInterval
    ? lateFeeTimeInterval / BigInt(1000 * 60 * 60 * 24)
    : undefined;

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
            bg="background"
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
                    {deadline
                      ? `${formatUnits(
                          lateFee,
                          tokenBalance?.decimals || 18,
                        )} ${tokenBalance?.symbol} every ${daysPerInterval} day${daysPerInterval && daysPerInterval > 1 ? 's' : ''} after ${getDateString(_.toNumber(deadline?.toString()))}`
                      : `Not applicable`}
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
            <SimpleGrid columns={fulfilled ? 2 : 1} spacing="1rem" w="100%">
              <Button
                size={buttonSize}
                _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                color="white"
                backgroundColor="blue.1"
                fontWeight="bold"
                fontFamily="mono"
                textTransform="uppercase"
                onClick={() => onDeposit()}
                isDisabled={fulfilled}
              >
                {fulfilled ? 'Paid' : 'Make Payment'}
              </Button>
              {isTippable && (
                <Button
                  size={buttonSize}
                  _hover={{
                    backgroundColor: 'rgba(61, 136, 248, 1)',
                    color: 'white',
                  }}
                  _active={{
                    backgroundColor: 'rgba(61, 136, 248, 1)',
                    color: 'white',
                  }}
                  color="blue.1"
                  backgroundColor="white"
                  borderWidth={1}
                  borderColor="blue.1"
                  fontWeight="bold"
                  fontFamily="mono"
                  textTransform="uppercase"
                  onClick={() => onTip()}
                >
                  Add Tip
                </Button>
              )}
            </SimpleGrid>
          )}
          {isProvider && (
            <SimpleGrid columns={1} spacing="1rem" w="100%">
              <Button
                size={buttonSize}
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
          <DepositFunds invoice={invoiceDetails} />
        </Modal>
        <Modal isOpen={modals?.withdraw} onClose={() => setModals?.({})}>
          <WithdrawFunds invoice={invoiceDetails} />
        </Modal>
      </Stack>
    </Container>
  );
}

export default ViewInstantInvoice;
