import React, { useEffect, useMemo, useState } from 'react';
import { Address, formatUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import {
  Button,
  Divider,
  Flex,
  Heading,
  Link,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
  useBreakpointValue,
} from '@chakra-ui/react';

import {
  GenerateInvoicePDF,
  Loader,
  CopyIcon,
  QuestionIcon,
  AccountLink,
  Container,
  InvoiceNotFound,
} from '@smart-invoice/ui';
import { DepositFunds, WithdrawFunds } from '@smart-invoice/forms';
import { ChainId } from '@smart-invoice/constants';
import { Invoice, fetchInvoice } from '@smart-invoice/graphql';
import { useFetchTokensViaIPFS } from '@smart-invoice/hooks';
import {
  balanceOf,
  copyToClipboard,
  getAccountString,
  getAddressLink,
  getAgreementLink,
  getDateString,
  getTokenInfo,
  isAddress,
  logError,
  getDeadline,
  getLateFee,
  getTotalDue,
  getTotalFulfilled,
} from '@smart-invoice/utils';
import { useParams } from 'next/navigation';

function ViewInstantInvoice() {
  const { hexChainId, invoiceId } = useParams<{
    hexChainId: string;
    invoiceId: Address;
  }>();
  const invoiceChainId = parseInt(hexChainId, 16) as ChainId;
  const { data: walletClient } = useWalletClient();
  const account = walletClient?.account?.address;
  const chain = walletClient?.chain;
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const [invoice, setInvoice] = useState<Invoice>();
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balance, setBalance] = useState(BigInt(0));
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(0);
  const [totalDue, setTotalDue] = useState(BigInt(0));
  const [totalFulfilled, setTotalFulfilled] = useState(BigInt(0));
  const [fulfilled, setFulfilled] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [lateFeeAmount, setLateFeeAmount] = useState(BigInt(0));
  const [lateFeeTimeInterval, setLateFeeTimeInterval] = useState(0);
  const [lateFeeTotal, setLateFeeTotal] = useState(BigInt(0));
  const validToken = useMemo(() => isAddress(invoice?.token), [invoice]);
  const validAddress = useMemo(() => isAddress(invoice?.address), [invoice]);
  const {
    client,
    provider,
    total,
    token,
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
  } = invoice || {};
  const validClient = isAddress(client);
  const validProvider = isAddress(provider);

  useEffect(() => {
    if (isAddress(invoiceId) && !Number.isNaN(invoiceChainId)) {
      fetchInvoice(invoiceChainId, invoiceId).then(setInvoice);
    }
  }, [invoiceChainId, invoiceId]);

  useEffect(() => {
    const getValues = async () => {
      if (!validAddress || !validToken || !chain || !total) return;

      // Get Balance
      try {
        setBalanceLoading(true);
        // const b = await balanceOf(chain, validToken, validAddress);
        // setBalance(b);
        setBalanceLoading(false);
      } catch (balanceError) {
        logError({ balanceError });
      }

      // Get Total Due
      try {
        // const t = await getTotalDue(chain, validAddress);
        // setTotalDue(t);
      } catch (totalDueError) {
        logError({ totalDueError });
        setTotalDue(total);
      }

      // Get Deadline, Late Fee and its time interval
      try {
        // const d = await getDeadline(chain, validAddress);
        setDeadline(0); // Number(d));
        // const { amount, timeInterval } = await getLateFee(chain, validAddress);
        // setLateFeeAmount(amount);
        // setLateFeeTimeInterval(Number(timeInterval));
      } catch (lateFeeError) {
        logError({ lateFeeError });
      }

      // Get Total Fulfilled
      try {
        // const tf = await getTotalFulfilled(chain, validAddress);
        // setTotalFulfilled(tf.amount);
        // setFulfilled(tf.isFulfilled);
      } catch (totalFulfilledError) {
        logError({ totalFulfilledError });
      }
    };

    getValues();
  }, [chain, total, validAddress, validToken]);

  useEffect(() => {
    if (invoice && totalDue !== BigInt(0) && deadline) {
      setLateFeeTotal(totalDue - BigInt(invoice.total));
    }
  }, [invoice, deadline, totalDue]);

  const leftMinW = useBreakpointValue({ base: '10rem', sm: '20rem' });
  const leftMaxW = useBreakpointValue({ base: '30rem', lg: '22rem' });
  const rightMaxW = useBreakpointValue({ base: '100%', md: '40rem' });
  const buttonSize = useBreakpointValue({ base: 'md', lg: 'lg' });
  // const smallScreen = useBreakpointValue({ base: true, sm: false });

  if (!isAddress(invoiceId) || invoice === null) {
    return <InvoiceNotFound />;
  }

  if (invoice && chain?.id !== invoiceChainId) {
    return (
      <InvoiceNotFound chainId={invoiceChainId} heading="Incorrect Network" />
    );
  }

  if (!invoice || balanceLoading) {
    return (
      <Container overlay>
        <Loader size="80" />
      </Container>
    );
  }

  const isClient = account?.toLowerCase() === client;
  const isProvider = account?.toLowerCase() === walletClient;
  const { decimals, symbol } = getTokenInfo(invoiceChainId, token, tokenData);

  const due =
    totalFulfilled >= totalDue || fulfilled
      ? BigInt(0)
      : totalDue - totalFulfilled;

  const isTippable = fulfilled;
  const isWithdrawable = balance > 0;

  const onDeposit = () => {
    setSelected(1);
    setModal(true);
  };

  const onTip = async () => {
    if (isTippable) {
      setSelected(1);
      setModal(true);
    }
  };

  const onWithdraw = async () => {
    if (isWithdrawable && isProvider) {
      setSelected(2);
      setModal(true);
    }
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
          <VStack align="stretch" justify="center">
            <Heading fontWeight="normal" fontSize="2xl">
              {projectName}
            </Heading>

            <Flex align="center" color="black">
              <Link
                href={getAddressLink(invoiceChainId, invoiceId.toLowerCase())}
                isExternal
              >
                {getAccountString(invoiceId)}
              </Link>
              {document.queryCommandSupported('copy') && (
                <Button
                  ml={4}
                  onClick={() => copyToClipboard(invoiceId.toLowerCase())}
                  variant="ghost"
                  colorScheme="blue"
                  h="auto"
                  w="auto"
                  minW="2"
                  p={2}
                >
                  <CopyIcon boxSize={4} />
                </Button>
              )}
            </Flex>
            {projectDescription && (
              <Text color="black">{projectDescription}</Text>
            )}

            <Link
              href={getAgreementLink(projectAgreement)}
              isExternal
              textDecor="underline"
              color="black"
            >
              Details of Agreement
            </Link>
          </VStack>

          <VStack fontSize="sm" color="grey" align="stretch" justify="center">
            {startDate ? (
              <Wrap>
                <WrapItem>
                  <Text>{'Project Start Date: '}</Text>
                </WrapItem>

                <WrapItem>
                  <Text fontWeight="bold">{getDateString(startDate)}</Text>
                </WrapItem>
              </Wrap>
            ) : null}
            {endDate ? (
              <Wrap>
                <WrapItem>
                  <Text>{'Project End Date: '}</Text>
                </WrapItem>

                <WrapItem>
                  <Text fontWeight="bold">{getDateString(endDate)}</Text>
                </WrapItem>
              </Wrap>
            ) : null}

            <Wrap>
              <WrapItem>
                <Text>{'Payment Deadline: '}</Text>
              </WrapItem>

              <WrapItem>
                <Text fontWeight="bold">{getDateString(deadline)}</Text>

                <Tooltip
                  label={`Late fees start accumulating after ${new Date(
                    deadline * 1000,
                  ).toUTCString()} until total amount is paid.`}
                  placement="auto-start"
                >
                  <QuestionIcon ml="1rem" boxSize="0.75rem" color="gray" />
                </Tooltip>
              </WrapItem>
            </Wrap>

            <Wrap>
              <WrapItem>
                <Text>{'Client Account: '}</Text>
              </WrapItem>

              <WrapItem fontWeight="bold">
                {validClient ? (
                  <AccountLink address={validClient} chainId={invoiceChainId} />
                ) : (
                  client
                )}
              </WrapItem>
            </Wrap>

            <Wrap>
              <WrapItem>
                <Text>{'Provider Account: '}</Text>
              </WrapItem>

              <WrapItem fontWeight="bold">
                {validProvider ? (
                  <AccountLink
                    address={validProvider}
                    chainId={invoiceChainId}
                  />
                ) : (
                  provider
                )}
              </WrapItem>
            </Wrap>

            <Wrap>
              <GenerateInvoicePDF
                invoice={invoice}
                symbol={symbol}
                buttonText="Preview & Download Invoice PDF"
                buttonProps={{ textColor: 'blue.dark' }}
              />
            </Wrap>
          </VStack>
        </Stack>

        <VStack
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

                <Text>{`${formatUnits(total, decimals)} ${symbol}`}</Text>
              </Flex>
            ) : null}

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
                  {deadline && lateFeeAmount
                    ? `${formatUnits(
                        lateFeeAmount,
                        decimals,
                      )} ${symbol} every ${
                        lateFeeTimeInterval / (1000 * 60 * 60 * 24)
                      } days after ${getDateString(deadline)}`
                    : `Not applicable`}
                </Text>
              </Flex>

              <Text>{`${formatUnits(lateFeeTotal, decimals)} ${symbol}`}</Text>
            </Flex>

            <Flex
              justify="space-between"
              align="center"
              fontWeight="bold"
              fontSize="lg"
              mb="1rem"
            >
              <Text>Deposited</Text>

              <Text>{`(${formatUnits(
                totalFulfilled,
                decimals,
              )} ${symbol})`}</Text>
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
              <Text>{totalFulfilled > 0 ? 'Remaining' : 'Total'} Due</Text>
              <Text textAlign="right">{`${formatUnits(
                due,
                decimals,
              )} ${symbol}`}</Text>{' '}
            </Flex>
          </Flex>
          {isClient && (
            <VStack>
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
            </VStack>
          )}
          {isProvider && (
            <VStack>
              <SimpleGrid columns={1} spacing="1rem" w="100%">
                <Button
                  size={buttonSize}
                  _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  color="white"
                  backgroundColor="blue.1"
                  fontWeight="bold"
                  fontFamily="mono"
                  textTransform="uppercase"
                  onClick={() => onWithdraw()}
                  isDisabled={balance <= 0}
                >
                  {balance === BigInt(0) && fulfilled ? 'Received' : 'Receive'}
                </Button>
              </SimpleGrid>
            </VStack>
          )}
        </VStack>

        <Modal isOpen={modal} onClose={() => setModal(false)} isCentered>
          <ModalOverlay>
            <ModalContent
              p="2rem"
              maxW="40rem"
              background="background"
              borderRadius="0.5rem"
              color="white"
            >
              <ModalCloseButton
                _hover={{ bgColor: 'white20' }}
                top="0.5rem"
                right="0.5rem"
                color="gray"
              />
              {/* {modal && selected === 1 && (
                <DepositFunds
                  invoice={invoice}
                  deposited={totalFulfilled}
                  due={
                    totalDue >= totalFulfilled
                      ? totalDue - totalFulfilled
                      : BigInt(0)
                  }
                  total={total ?? BigInt(0)}
                  fulfilled={fulfilled}
                  tokenData={tokenData}
                  close={() => setModal(false)}
                />
              )}
              {modal && selected === 2 && (
                <WithdrawFunds
                  invoice={invoice}
                  balance={balance}
                  tokenData={tokenData}
                  close={() => setModal(false)}
                />
              )} */}
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </Stack>
    </Container>
  );
}

export default ViewInstantInvoice;
