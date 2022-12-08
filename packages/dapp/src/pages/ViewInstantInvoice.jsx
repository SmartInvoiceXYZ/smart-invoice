import {
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
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
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';

import { DepositFunds } from '../components/DepositFunds';
import { Loader } from '../components/Loader';
import { LockFunds } from '../components/LockFunds';
import { ReleaseFunds } from '../components/ReleaseFunds';
import { ResolveFunds } from '../components/ResolveFunds';
import { WithdrawFunds } from '../components/WithdrawFunds';
import { AddMilestones } from '../components/AddMilestones';
import { VerifyInvoice } from '../components/VerifyInvoice';
import { GenerateInvoicePDF } from '../components/GenerateInvoicePDF';
import { Web3Context } from '../context/Web3Context';
import { getInvoice } from '../graphql/getInvoice';
import { CopyIcon } from '../icons/CopyIcon';
import { QuestionIcon } from '../icons/QuestionIcon';
import { AccountLink } from '../shared/AccountLink';
import { Container } from '../shared/Container';
import { InvoiceNotFound } from '../shared/InvoiceNotFound';
import { balanceOf } from '../utils/erc20';
import {
  copyToClipboard,
  getAccountString,
  getAddressLink,
  getDateString,
  getIpfsLink,
  getTokenInfo,
  getTxLink,
  logError,
  getAgreementLink,
} from '../utils/helpers';

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
  const [verifiedStatus, setVerifiedStatus] = useState(false);

  useEffect(() => {
    if (utils.isAddress(invoiceId) && !Number.isNaN(invoiceChainId)) {
      getInvoice(invoiceChainId, invoiceId).then(i => setInvoice(i));
    }
  }, [invoiceChainId, invoiceId]);

  useEffect(() => {
    if (invoice && ethersProvider && chainId === invoiceChainId) {
      setBalanceLoading(true);
      balanceOf(ethersProvider, invoice.token, invoice.address)
        .then(b => {
          setBalance(b);
          setBalanceLoading(false);
        })
        .catch(balanceError => logError({ balanceError }));
    }
  }, [invoice, ethersProvider, chainId, invoiceChainId]);

  useEffect(() => {
    if (invoice && ethersProvider && chainId === invoiceChainId) {
      setBalanceLoading(true);
      balanceOf(ethersProvider, invoice.token, invoice.address)
        .then(b => {
          setBalance(b);
          setBalanceLoading(false);
        })
        .catch(balanceError => logError({ balanceError }));
    }
  }, [invoice, ethersProvider, chainId, invoiceChainId]);

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

  const lateFee = 10;
  const lateFeeTimeInterval = '7 days';

  const {
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    terminationTime,
    client,
    provider,
    resolver,
    currentMilestone,
    amounts,
    total,
    token,
    released,
    isLocked,
    deposits,
    releases,
    disputes,
    resolutions,
    verified,
  } = invoice;

  const isClient = account.toLowerCase() === client;
  const isResolver = account.toLowerCase() === resolver.toLowerCase();
  const { decimals, symbol, image } = getTokenInfo(
    invoiceChainId,
    token,
    tokenData,
  );

  const deposited = BigNumber.from(released).add(balance);
  const due = deposited.gte(total)
    ? BigNumber.from(0)
    : BigNumber.from(total).sub(deposited);
  const isExpired = terminationTime <= new Date().getTime() / 1000;

  const amount = BigNumber.from(
    currentMilestone < amounts.length ? amounts[currentMilestone] : 0,
  );
  const isReleasable = !isLocked && balance.gte(amount) && balance.gt(0);
  const isLockable = !isExpired && !isLocked && balance.gt(0);
  const dispute =
    isLocked && disputes.length > 0 ? disputes[disputes.length - 1] : undefined;
  const resolution =
    !isLocked && resolutions.length > 0
      ? resolutions[resolutions.length - 1]
      : undefined;

  const onLock = () => {
    setSelected(0);
    setModal(true);
  };

  const onDeposit = () => {
    setSelected(1);
    setModal(true);
  };

  const onRelease = async () => {
    if (isReleasable && isClient) {
      setSelected(2);
      setModal(true);
    }
  };

  const onResolve = async () => {
    if (isResolver) {
      setSelected(3);
      setModal(true);
    }
  };

  const onWithdraw = async () => {
    if (isExpired && isClient) {
      setSelected(4);
      setModal(true);
    }
  };

  const onAddMilestones = async () => {
    if (!isLocked & !isExpired) {
      setSelected(5);
      setModal(true);
    }
  };

  let gridColumns;
  if (isReleasable && (isLockable || (isExpired && balance.gt(0)))) {
    gridColumns = { base: 2, sm: 3 };
  } else if (isLockable || isReleasable || (isExpired && balance.gt(0))) {
    gridColumns = 2;
  } else {
    gridColumns = 1;
  }

  let sum = BigNumber.from(0);

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
                <Text fontWeight="bold">{getDateString(terminationTime)}</Text>
                <Tooltip
                  label={`The Safety Valve gets activated on ${new Date(
                    terminationTime * 1000,
                  ).toUTCString()}`}
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
                  10 WETH every 7 days after 12/25/2022
                </Text>
              </Flex>
              <Text>{`${utils.formatUnits(
                deposited,
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
              <Text>Paid</Text>
              <Text>{`(${utils.formatUnits(
                released,
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
              <Text>Total Due</Text>
              <Text textAlign="right">{`${utils.formatUnits(
                balance,
                decimals,
              )} ${symbol}`}</Text>{' '}
            </Flex>
          </Flex>
          {isClient && (
            <SimpleGrid columns={gridColumns} spacing="1rem" w="100%">
              {isReleasable && (
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
                >
                  Pay
                </Button>
              )}
              <Button
                size={buttonSize}
                gridArea={{
                  base: Number.isInteger(gridColumns)
                    ? 'auto/auto/auto/auto'
                    : '2/1/2/span 2',
                  sm: 'auto/auto/auto/auto',
                }}
                _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                color="white"
                backgroundColor="blue.1"
                fontWeight="bold"
                fontFamily="mono"
                textTransform="uppercase"
                onClick={() => (isReleasable ? onRelease() : onDeposit())}
              >
                {isReleasable ? 'Release' : 'Deposit'}
              </Button>
            </SimpleGrid>
          )}
          {!isClient && (
            <VStack>
              <SimpleGrid columns={isLockable ? 2 : 1} spacing="1rem" w="100%">
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
                >
                  Make Payment
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
              {modal && selected === 0 && (
                <LockFunds
                  invoice={invoice}
                  balance={balance}
                  tokenData={tokenData}
                  close={() => setModal(false)}
                />
              )}
              {modal && selected === 1 && (
                <DepositFunds
                  invoice={invoice}
                  deposited={deposited}
                  due={due}
                  tokenData={tokenData}
                  close={() => setModal(false)}
                />
              )}
              {modal && selected === 2 && (
                <ReleaseFunds
                  invoice={invoice}
                  balance={balance}
                  tokenData={tokenData}
                  close={() => setModal(false)}
                />
              )}
              {modal && selected === 3 && (
                <ResolveFunds
                  invoice={invoice}
                  balance={balance}
                  tokenData={tokenData}
                  close={() => setModal(false)}
                />
              )}
              {modal && selected === 4 && (
                <WithdrawFunds
                  invoice={invoice}
                  balance={balance}
                  tokenData={tokenData}
                  close={() => setModal(false)}
                />
              )}
              {modal && selected === 5 && (
                <AddMilestones
                  invoice={invoice}
                  deposited={deposited}
                  due={due}
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
