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
  useBreakpointValue,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';
import { useFetchTokensViaIPFS } from '../../hooks/useFetchTokensViaIPFS';

import { DepositFunds } from '../../components/instant/DepositFunds';
import { Loader } from '../../components/Loader';
import { WithdrawFunds } from '../../components/instant/WithdrawFunds';
import { GenerateInvoicePDF } from '../../components/GenerateInvoicePDF';
import { Web3Context } from '../../context/Web3Context';
import { getInvoice } from '../../graphql/getInvoice';
import { CopyIcon } from '../../icons/CopyIcon';
import { QuestionIcon } from '../../icons/QuestionIcon';
import { AccountLink } from '../../shared/AccountLink';
import { Container } from '../../shared/Container';
import { InvoiceNotFound } from '../../shared/InvoiceNotFound';
import { balanceOf } from '../../utils/erc20';
import {
  copyToClipboard,
  getAccountString,
  getAddressLink,
  getDateString,
  getTokenInfo,
  logError,
  getAgreementLink,
} from '../../utils/helpers';
import {
  getDeadline,
  getLateFee,
  getTotalDue,
  getTotalFulfilled,
} from '../../utils/invoice';

export const ViewInstantInvoice = ({
  match: {
    params: { hexChainId, invoiceId },
  },
}) => {
  const {
    chainId,
    account,
    provider: ethersProvider,
  } = useContext(Web3Context);
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const [invoice, setInvoice] = useState();
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balance, setBalance] = useState(BigNumber.from(0));
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(0);
  const invoiceChainId = parseInt(hexChainId, 16);
  const [totalDue, setTotalDue] = useState(BigNumber.from(0));
  const [totalFulfilled, setTotalFulfilled] = useState(BigNumber.from(0));
  const [fulfilled, setFulfilled] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [lateFeeAmount, setLateFeeAmount] = useState(BigNumber.from(0));
  const [lateFeeTimeInterval, setLateFeeTimeInterval] = useState(0);
  const [lateFeeTotal, setLateFeeTotal] = useState(BigNumber.from(0));

  useEffect(() => {
    if (utils.isAddress(invoiceId) && !Number.isNaN(invoiceChainId)) {
      getInvoice(invoiceChainId, invoiceId).then(i => setInvoice(i));
    }
  }, [invoiceChainId, invoiceId]);

  useEffect(() => {
    if (invoice && ethersProvider && chainId === invoiceChainId) {
      getValues(ethersProvider, invoice);
      // setBalanceLoading(true);
      // balanceOf(ethersProvider, invoice.token, invoice.address)
      //   .then(b => {
      //     setBalance(b);
      //     setBalanceLoading(false);
      //   })
      //   .catch(balanceError => logError({ balanceError }));
    }
  }, [invoice, ethersProvider, chainId, invoiceChainId]);

  useEffect(() => {
    if (invoice && totalDue !== BigNumber.from(0) && deadline) {
      setLateFeeTotal(totalDue - BigNumber.from(invoice.total));
    }
  }, [invoice, deadline, totalDue]);

  const getValues = async (provider, invoice) => {
    // Get Balance
    try {
      setBalanceLoading(true);
      const b = await balanceOf(provider, invoice.token, invoice.address);
      setBalance(b);
      setBalanceLoading(false);
    } catch (balanceError) {
      logError({ balanceError });
    }

    // Get Total Due
    try {
      const t = await getTotalDue(provider, invoice.address);
      setTotalDue(BigNumber.from(t));
    } catch (totalDueError) {
      logError({ totalDueError });
      setTotalDue(BigNumber.from(invoice.total));
    }

    // Get Deadline, Late Fee and its time interval
    try {
      const d = await getDeadline(provider, invoice.address);
      setDeadline(BigNumber.from(d).toNumber());
      const { amount, timeInterval } = await getLateFee(
        provider,
        invoice.address,
      );
      setLateFeeAmount(BigNumber.from(amount));
      setLateFeeTimeInterval(BigNumber.from(timeInterval).toNumber());
    } catch (lateFeeError) {
      logError({ lateFeeError });
    }

    // Get Total Fulfilled
    try {
      const tf = await getTotalFulfilled(provider, invoice.address);
      setTotalFulfilled(tf.amount);
      setFulfilled(tf.isFulfilled);
    } catch (totalFulfilledError) {
      logError({ totalFulfilledError });
    }
  };

  const leftMinW = useBreakpointValue({ base: '10rem', sm: '20rem' });
  const leftMaxW = useBreakpointValue({ base: '30rem', lg: '22rem' });
  const rightMaxW = useBreakpointValue({ base: '100%', md: '40rem' });
  const buttonSize = useBreakpointValue({ base: 'md', lg: 'lg' });
  const smallScreen = useBreakpointValue({ base: true, sm: false });

  if (!utils.isAddress(invoiceId) || invoice === null) {
    return <InvoiceNotFound />;
  }

  if (invoice && chainId !== invoiceChainId) {
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

  const {
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    client,
    provider,
    total,
    token,
    released,
    // deadline,
    // fulfilled,
    // lateFee,
    // lateFeeTimeInterval
  } = invoice;

  const isClient = account.toLowerCase() === client;
  const isProvider = account.toLowerCase() === provider;
  const { decimals, symbol } = getTokenInfo(invoiceChainId, token, tokenData);

  const due =
    totalFulfilled.gte(totalDue) || fulfilled
      ? BigNumber.from(0)
      : BigNumber.from(totalDue).sub(totalFulfilled);

  const isTippable = fulfilled;
  const isWithdrawable = balance.gt(0);

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
            {startDate && (
              <Wrap>
                <WrapItem>
                  <Text>{'Project Start Date: '}</Text>
                </WrapItem>
                <WrapItem>
                  <Text fontWeight="bold">{getDateString(startDate)}</Text>
                </WrapItem>
              </Wrap>
            )}
            {endDate && (
              <Wrap>
                <WrapItem>
                  <Text>{'Project End Date: '}</Text>
                </WrapItem>
                <WrapItem>
                  <Text fontWeight="bold">{getDateString(endDate)}</Text>
                </WrapItem>
              </Wrap>
            )}
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
                <AccountLink address={client} chainId={invoiceChainId} />
              </WrapItem>
            </Wrap>
            <Wrap>
              <WrapItem>
                <Text>{'Provider Account: '}</Text>
              </WrapItem>
              <WrapItem fontWeight="bold">
                <AccountLink address={provider} chainId={invoiceChainId} />
              </WrapItem>
            </Wrap>
            <Wrap>
              <GenerateInvoicePDF
                invoice={invoice}
                symbol={symbol}
                buttonText="Preview & Download Invoice PDF"
                buttonTextColor={'blue.dark'}
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
            <Flex
              justify="space-between"
              align="center"
              fontWeight="bold"
              fontSize="lg"
              mb="1rem"
            >
              <Text>Amount</Text>
              <Text>{`${utils.formatUnits(total, decimals)} ${symbol}`}</Text>
            </Flex>
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
                    ? `${utils.formatUnits(
                        lateFeeAmount,
                        decimals,
                      )} ${symbol} every ${
                        lateFeeTimeInterval / (1000 * 60 * 60 * 24)
                      } days after ${getDateString(deadline)}`
                    : `Not applicable`}
                </Text>
              </Flex>
              <Text>{`${utils.formatUnits(
                lateFeeTotal,
                decimals,
              )} ${symbol}`}</Text>
            </Flex>
            <Flex
              justify="space-between"
              align="center"
              fontWeight="bold"
              fontSize="lg"
              mb="1rem"
            >
              <Text>Deposited</Text>
              <Text>{`(${utils.formatUnits(
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
              <Text>{totalFulfilled.gt(0) ? 'Remaining' : 'Total'} Due</Text>
              <Text textAlign="right">{`${utils.formatUnits(
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
                  isDisabled={!balance.gt(0)}
                >
                  {balance.eq(0) && fulfilled ? 'Received' : 'Receive'}
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
              {modal && selected === 1 && (
                <DepositFunds
                  invoice={invoice}
                  deposited={totalFulfilled}
                  due={
                    totalDue.gte(totalFulfilled)
                      ? totalDue.sub(totalFulfilled)
                      : 0
                  }
                  total={total}
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
              )}
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </Stack>
    </Container>
  );
};
