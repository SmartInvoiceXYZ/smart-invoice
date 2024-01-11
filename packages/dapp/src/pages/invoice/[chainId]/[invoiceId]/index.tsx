import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useWalletClient } from 'wagmi';

/* eslint-disable react/no-array-index-key */
import {
  Button,
  Divider,
  Flex,
  HStack,
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

import { AddMilestones } from '../../../../components/AddMilestones';
import { DepositFunds } from '../../../../components/DepositFunds';
import { GenerateInvoicePDF } from '../../../../components/GenerateInvoicePDF';
import { Loader } from '../../../../components/Loader';
import { LockFunds } from '../../../../components/LockFunds';
import { ReleaseFunds } from '../../../../components/ReleaseFunds';
import { ResolveFunds } from '../../../../components/ResolveFunds';
import { VerifyInvoice } from '../../../../components/VerifyInvoice';
import { WithdrawFunds } from '../../../../components/WithdrawFunds';
import { Invoice, fetchInvoice } from '../../../../graphql/fetchInvoice';
import { useFetchTokensViaIPFS } from '../../../../hooks/useFetchTokensViaIPFS';
import { CopyIcon } from '../../../../icons/CopyIcon';
import { QuestionIcon } from '../../../../icons/QuestionIcon';
import { AccountLink } from '../../../../shared/AccountLink';
import { Container } from '../../../../shared/Container';
import { InvoiceNotFound } from '../../../../shared/InvoiceNotFound';
import { balanceOf } from '../../../../utils/erc20';
import {
  copyToClipboard,
  getAccountString,
  getAddressLink,
  getAgreementLink,
  getDateString,
  getIpfsLink,
  getTokenInfo,
  getTxLink,
  isAddress,
  logError,
} from '../../../../utils/helpers';

function ViewInvoice() {
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  const { invoiceId: invId, chain: hexChainId } = router.query;
  const invoiceId = String(invId) as `0x${string}`;
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const [invoice, setInvoice] = useState<Invoice>();
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balance, setBalance] = useState(BigInt(0));
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(0);
  const invoiceChainId = parseInt(String(hexChainId), 16);
  const [verifiedStatus, setVerifiedStatus] = useState(false);
  const validToken = useMemo(() => isAddress(invoice?.token), [invoice]);
  const validAddress = useMemo(() => isAddress(invoice?.address), [invoice]);

  useEffect(() => {
    if (isAddress(invoiceId) && !Number.isNaN(invoiceChainId)) {
      fetchInvoice(invoiceChainId, invoiceId).then(i => setInvoice(i));
    }
  }, [invoiceChainId, invoiceId]);

  useEffect(() => {
    if (
      invoice &&
      validToken &&
      validAddress &&
      walletClient?.chain?.id === invoiceChainId
    ) {
      setBalanceLoading(true);
      balanceOf(walletClient.chain, validToken, validAddress)
        .then(b => {
          setBalance(b);
          setBalanceLoading(false);
        })
        .catch(balanceError => {
          logError({ balanceError });
          setBalanceLoading(false);
        });
    }
  }, [invoice, walletClient?.chain, invoiceChainId, validToken, validAddress]);

  useEffect(() => {
    if (
      invoice &&
      validToken &&
      validAddress &&
      walletClient?.chain?.id === invoiceChainId
    ) {
      setBalanceLoading(true);
      balanceOf(walletClient.chain, validToken, validAddress)
        .then(b => {
          setBalance(b);
          setBalanceLoading(false);
        })
        .catch(balanceError => {
          logError({ balanceError });
          setBalanceLoading(false);
        });
    }
  }, [invoice, walletClient?.chain, invoiceChainId, validToken, validAddress]);

  const leftMinW = useBreakpointValue({ base: '10rem', sm: '20rem' });
  const leftMaxW = useBreakpointValue({ base: '30rem', lg: '22rem' });
  const rightMaxW = useBreakpointValue({ base: '100%', md: '40rem' });
  const buttonSize = useBreakpointValue({ base: 'md', lg: 'lg' });
  const smallScreen = useBreakpointValue({ base: true, sm: false });

  if (!isAddress(invoiceId) || invoice === null) {
    return <InvoiceNotFound />;
  }

  if (invoice && walletClient?.chain?.id !== invoiceChainId) {
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
  const validClient = isAddress(client);
  const validProvider = isAddress(provider);
  const validResolver = isAddress(resolver);

  const account = walletClient?.account?.address?.toLowerCase();
  const isClient = account === client;
  const isResolver = account === resolver.toLowerCase();
  const { decimals, symbol } = getTokenInfo(invoiceChainId, token, tokenData);

  const deposited = BigInt(released) + balance;
  const due = deposited >= total ? BigInt(0) : BigInt(total) - deposited;
  const isExpired = terminationTime <= new Date().getTime() / 1000;

  const amount = BigInt(
    currentMilestone < amounts.length ? amounts[Number(currentMilestone)] : 0,
  );
  const isReleasable = !isLocked && balance > amount && balance > 0;
  const isLockable = !isExpired && !isLocked && balance > 0;
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
    if (!isLocked && !isExpired) {
      setSelected(5);
      setModal(true);
    }
  };

  let gridColumns;
  if (isReleasable && (isLockable || (isExpired && balance > 0))) {
    gridColumns = { base: 2, sm: 3 };
  } else if (isLockable || isReleasable || (isExpired && balance > 0)) {
    gridColumns = 2;
  } else {
    gridColumns = 1;
  }

  let sum = BigInt(0);

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
                <Text>{'Safety Valve Withdrawal Date: '}</Text>
              </WrapItem>

              <WrapItem>
                <Text fontWeight="bold">{getDateString(terminationTime)}</Text>

                <Tooltip
                  label={`The Safety Valve gets activated on ${new Date(
                    Number(terminationTime) * 1000,
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
              <WrapItem>
                <Text>{'Arbitration Provider: '}</Text>
              </WrapItem>

              <WrapItem fontWeight="bold">
                {validResolver ? (
                  <AccountLink
                    address={validResolver}
                    chainId={invoiceChainId}
                  />
                ) : (
                  resolver
                )}
              </WrapItem>
            </Wrap>

            <Wrap>
              <WrapItem>
                <Text>{'Non-Client Deposits Enabled: '}</Text>
              </WrapItem>

              <WrapItem fontWeight="bold">
                {invoice && verifiedStatus ? (
                  <Text color="green">Enabled!</Text>
                ) : (
                  <Text color="red">Not enabled</Text>
                )}
              </WrapItem>

              <WrapItem fontWeight="bold">
                <VerifyInvoice
                  invoice={invoice}
                  client={client}
                  isClient={isClient}
                  verified={verified}
                  verifiedStatus={verifiedStatus}
                  setVerifiedStatus={setVerifiedStatus}
                />
              </WrapItem>
            </Wrap>

            <Wrap>
              <GenerateInvoicePDF
                invoice={invoice}
                symbol={symbol}
                buttonText="Preview & Download Invoice PDF"
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
          <Button
            maxW="fit-content"
            alignSelf="flex-end"
            _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            color="white"
            backgroundColor="blue.1"
            onClick={onAddMilestones}
            disabled={isLocked}
          >
            Add Milestones
          </Button>

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
              <Text>
                {smallScreen ? 'Total Amount' : 'Total Project Amount'}
              </Text>

              <Text>{`${formatUnits(total, decimals)} ${symbol}`}</Text>
            </Flex>

            <VStack
              pl={{ base: '0.5rem', md: '1rem' }}
              align="stretch"
              spacing="0.25rem"
            >
              {amounts.map((amt, index) => {
                const a = BigInt(amt);
                let tot = BigInt(0);
                let ind = -1;
                let full = false;
                if (deposits.length > 0) {
                  for (let i = 0; i < deposits.length; i += 1) {
                    tot += deposits[i].amount;
                    if (tot > sum) {
                      ind = i;
                      if (tot - sum >= a) {
                        full = true;
                        break;
                      }
                    }
                  }
                }
                sum += a;

                return (
                  <Flex
                    key={index.toString()}
                    justify="space-between"
                    align={{ base: 'stretch', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                  >
                    <Text>Payment Milestone #{index + 1}</Text>

                    <HStack
                      spacing={{ base: '0.5rem', md: '1rem' }}
                      align="center"
                      justify="flex-end"
                      ml={{ base: '0.5rem', md: '1rem' }}
                    >
                      {index < currentMilestone && releases.length > index && (
                        <Link
                          fontSize="xs"
                          isExternal
                          color="grey"
                          fontStyle="italic"
                          href={getTxLink(
                            invoiceChainId,
                            releases[index].txHash,
                          )}
                        >
                          Released{' '}
                          {new Date(
                            Number(releases[index].timestamp) * 1000,
                          ).toLocaleDateString()}
                        </Link>
                      )}
                      {!(index < currentMilestone && releases.length > index) &&
                        ind !== -1 && (
                          <Link
                            fontSize="xs"
                            isExternal
                            color="grey"
                            fontStyle="italic"
                            href={getTxLink(
                              invoiceChainId,
                              deposits[ind].txHash,
                            )}
                          >
                            {full ? '' : 'Partially '}Deposited{' '}
                            {new Date(
                              Number(deposits[ind].timestamp) * 1000,
                            ).toLocaleDateString()}
                          </Link>
                        )}

                      <Text textAlign="right" fontWeight="500">{`${formatUnits(
                        a,
                        decimals,
                      )} ${symbol}`}</Text>
                    </HStack>
                  </Flex>
                );
              })}
            </VStack>

            <Divider
              w={{ base: 'calc(100% + 2rem)', md: 'calc(100% + 4rem)' }}
              ml={{ base: '-1rem', md: '-2rem' }}
              my="1rem"
            />

            <VStack
              pl={{ base: '0.5rem', md: '1rem' }}
              align="stretch"
              spacing="0.25rem"
            >
              <Flex justify="space-between" align="center">
                <Text>{smallScreen ? '' : 'Total '}Deposited</Text>

                <Text fontWeight="500" textAlign="right">{`${formatUnits(
                  deposited,
                  decimals,
                )} ${symbol}`}</Text>
              </Flex>

              <Flex justify="space-between" align="center">
                <Text>{smallScreen ? '' : 'Total '}Released</Text>

                <Text fontWeight="500" textAlign="right">{`${formatUnits(
                  BigInt(released),
                  decimals,
                )} ${symbol}`}</Text>
              </Flex>

              <Flex
                justify="space-between"
                align="center"
                textDecor={
                  dispute || resolution || isExpired
                    ? 'line-through'
                    : undefined
                }
              >
                <Text>Remaining{smallScreen ? '' : ' Amount Due'}</Text>

                <Text fontWeight="500" textAlign="right">{`${formatUnits(
                  due,
                  decimals,
                )} ${symbol}`}</Text>
              </Flex>
            </VStack>

            <Divider
              w={{ base: 'calc(100% + 2rem)', md: 'calc(100% + 4rem)' }}
              ml={{ base: '-1rem', md: '-2rem' }}
              my="1rem"
            />
            {!dispute && !resolution && (
              <Flex
                justify="space-between"
                align="center"
                color="black"
                fontWeight="bold"
                fontSize="lg"
              >
                {isExpired || (due === BigInt(0) && !isReleasable) ? (
                  <>
                    <Text>Remaining Balance</Text>
                    <Text textAlign="right">{`${formatUnits(
                      balance,
                      decimals,
                    )} ${symbol}`}</Text>{' '}
                  </>
                ) : (
                  <>
                    <Text>
                      {isReleasable &&
                        (smallScreen
                          ? 'Next Release'
                          : 'Next Amount to Release')}
                      {!isReleasable &&
                        (smallScreen ? 'Due Today' : 'Total Due Today')}
                    </Text>

                    <Text textAlign="right">{`${formatUnits(
                      isReleasable ? amount : amount - balance,
                      decimals,
                    )} ${symbol}`}</Text>
                  </>
                )}
              </Flex>
            )}
            {dispute && (
              <VStack w="100%" align="stretch" spacing="1rem" color="red.500">
                <Flex
                  justify="space-between"
                  align="center"
                  fontWeight="bold"
                  fontSize="lg"
                >
                  <Text>Amount Locked</Text>

                  <Text textAlign="right">{`${formatUnits(
                    balance,
                    decimals,
                  )} ${symbol}`}</Text>
                </Flex>

                <Text>
                  {`A dispute is in progress with `}

                  {validResolver ? (
                    <AccountLink
                      address={validResolver}
                      chainId={invoiceChainId}
                    />
                  ) : (
                    resolver
                  )}
                  <br />

                  <Link href={getIpfsLink(dispute.ipfsHash)} isExternal>
                    <u>View details on IPFS</u>
                  </Link>
                  <br />

                  <Link
                    href={getTxLink(invoiceChainId, dispute.txHash)}
                    isExternal
                  >
                    <u>View transaction</u>
                  </Link>
                </Text>
              </VStack>
            )}
            {resolution && (
              <VStack w="100%" align="stretch" spacing="1rem" color="red.500">
                <Flex
                  justify="space-between"
                  align="center"
                  fontWeight="bold"
                  fontSize="lg"
                >
                  <Text>Amount Dispersed</Text>

                  <Text textAlign="right">{`${formatUnits(
                    BigInt(resolution.clientAward) +
                      resolution.providerAward +
                      (resolution.resolutionFee
                        ? resolution.resolutionFee
                        : BigInt(0)),
                    decimals,
                  )} ${symbol}`}</Text>
                </Flex>

                <Flex
                  justify="space-between"
                  direction={{ base: 'column', sm: 'row' }}
                >
                  <Flex flex={1}>
                    <Text textAlign={{ base: 'center', sm: 'left' }}>
                      {validResolver ? (
                        <AccountLink
                          address={validResolver}
                          chainId={invoiceChainId}
                        />
                      ) : (
                        resolver
                      )}
                      {
                        ' has resolved the dispute and dispersed remaining funds'
                      }
                      <br />

                      <Link href={getIpfsLink(resolution.ipfsHash)} isExternal>
                        <u>View details on IPFS</u>
                      </Link>
                      <br />

                      <Link
                        href={getTxLink(invoiceChainId, resolution.txHash)}
                        isExternal
                      >
                        <u>View transaction</u>
                      </Link>
                    </Text>
                  </Flex>

                  <VStack
                    spacing="0.5rem"
                    mt={{ base: '1rem', sm: '0' }}
                    align={{ base: 'center', sm: 'stretch' }}
                  >
                    {resolution.resolutionFee ? (
                      <Text textAlign="right">
                        {`${formatUnits(
                          BigInt(resolution.resolutionFee),
                          decimals,
                        )} ${symbol} to `}

                        {validResolver ? (
                          <AccountLink
                            address={validResolver}
                            chainId={invoiceChainId}
                          />
                        ) : (
                          resolver
                        )}
                      </Text>
                    ) : null}

                    <Text textAlign="right">
                      {`${formatUnits(
                        BigInt(resolution.clientAward),
                        decimals,
                      )} ${symbol} to `}

                      {validClient ? (
                        <AccountLink
                          address={validClient}
                          chainId={invoiceChainId}
                        />
                      ) : (
                        client
                      )}
                    </Text>

                    <Text textAlign="right">
                      {`${formatUnits(
                        BigInt(resolution.providerAward),
                        decimals,
                      )} ${symbol} to `}

                      {validProvider ? (
                        <AccountLink
                          address={validProvider}
                          chainId={invoiceChainId}
                        />
                      ) : (
                        provider
                      )}
                    </Text>
                  </VStack>
                </Flex>
              </VStack>
            )}
          </Flex>
          {isResolver && (
            <SimpleGrid columns={1} spacing="1rem" w="100%">
              {isLocked ? (
                <Button
                  size={buttonSize}
                  colorScheme="red"
                  fontWeight="bold"
                  fontFamily="mono"
                  textTransform="uppercase"
                  onClick={() => onResolve()}
                >
                  Resolve
                </Button>
              ) : (
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
                  disabled={!verifiedStatus}
                >
                  Deposit
                </Button>
              )}
            </SimpleGrid>
          )}
          {!dispute && !resolution && !isResolver && isClient && (
            <SimpleGrid columns={gridColumns} spacing="1rem" w="100%">
              {isLockable && (
                <Button
                  size={buttonSize}
                  colorScheme="red"
                  fontFamily="mono"
                  fontWeight="bold"
                  textTransform="uppercase"
                  onClick={() => onLock()}
                >
                  Lock
                </Button>
              )}
              {isExpired && balance > 0 && (
                <Button
                  size={buttonSize}
                  _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  color="white"
                  backgroundColor="blue.1"
                  fontFamily="mono"
                  fontWeight="bold"
                  textTransform="uppercase"
                  onClick={() => onWithdraw()}
                >
                  Withdraw
                </Button>
              )}
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
                  Deposit
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
          {!dispute && !resolution && !isResolver && !isClient && (
            <VStack>
              {verifiedStatus ? null : (
                <Text fontWeight="bold" margin="0 auto">
                  Client has not yet enabled non-client deposits
                </Text>
              )}

              <SimpleGrid columns={isLockable ? 2 : 1} spacing="1rem" w="100%">
                {isLockable && (
                  <Button
                    size={buttonSize}
                    colorScheme="red"
                    fontFamily="mono"
                    fontWeight="bold"
                    textTransform="uppercase"
                    onClick={() => onLock()}
                  >
                    Lock
                  </Button>
                )}

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
                  disabled={!verifiedStatus}
                >
                  Deposit
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
                />
              )}
              {modal && selected === 1 && (
                <DepositFunds
                  invoice={invoice}
                  deposited={deposited}
                  due={due}
                  tokenData={tokenData}
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
                  // deposited={deposited}
                  due={due}
                  tokenData={tokenData}
                  // close={() => setModal(false)}
                />
              )}
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </Stack>
    </Container>
  );
}

export default ViewInvoice;
