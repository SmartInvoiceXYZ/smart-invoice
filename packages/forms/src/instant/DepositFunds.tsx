import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
  InputRightElement,
  Link,
  Select,
  Text,
  Tooltip,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { ChainId } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { TokenData } from '@smart-invoice/types';
import { QuestionIcon } from '@smart-invoice/ui';
import {
  approve,
  balanceOf,
  getAllowance,
  getNativeTokenSymbol,
  getTokenInfo,
  getTxLink,
  getWrappedNativeToken,
  logError,
  // waitForTransaction,
  // depositTokens,
  // tipTokens,
} from '@smart-invoice/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits, Hash, Hex, isAddress, parseUnits } from 'viem';
import { useWalletClient } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

const getCheckedStatus = (deposited: bigint, amounts: bigint[]) => {
  let sum = BigInt(0);
  return amounts.map(a => {
    sum += a;
    return deposited > sum;
  });
};

export type DepositFundsProps = {
  invoice: Invoice;
  deposited: bigint;
  due: bigint;
  total: bigint;
  tokenData: Record<ChainId, Record<string, TokenData>>;
  fulfilled: boolean;
  close?: () => void;
};

export function DepositFunds({
  invoice,
  deposited,
  due,
  total,
  tokenData,
  fulfilled,
  // eslint-disable-next-line no-unused-vars
  close, // TODO: use this?
}: DepositFundsProps) {
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const NATIVE_TOKEN_SYMBOL = getNativeTokenSymbol(chainId);
  const WRAPPED_NATIVE_TOKEN = getWrappedNativeToken(chainId);
  const { address, token, amounts: rawAmounts } = invoice ?? {};
  const validAddress = address && isAddress(address) && address;
  const validToken = token && isAddress(token) && token;
  const amounts = useMemo(
    () => (rawAmounts ?? []).map((a: any) => BigInt(a)),
    [rawAmounts],
  );
  const [paymentType, setPaymentType] = useState(0);
  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [amount, setAmount] = useState(BigInt(0));
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash>();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const [depositError, setDepositError] = useState(false);
  const [openTipPanel, setOpenTipPanel] = useState(false);
  const [tipPerc, setTipPerc] = useState<number | 'custom'>(0);
  const [customTip, setCustomTip] = useState('');
  const [tipAmount, setTipAmount] = useState(BigInt(0));
  const [totalPayment, setTotalPayment] = useState(BigInt(0));
  const [allowance, setAllowance] = useState(BigInt(0));
  const isWRAPPED = token?.toLowerCase() === WRAPPED_NATIVE_TOKEN;
  const initialStatus = getCheckedStatus(deposited, amounts);
  // eslint-disable-next-line no-unused-vars
  const [checked, setChecked] = useState(initialStatus);
  const [balance, setBalance] = useState<bigint>();

  const defaultTipPercs = [10, 15, 18];

  const deposit = async () => {
    setTxHash(undefined);
    if (
      !validAddress ||
      !validToken ||
      !totalPayment ||
      !walletClient ||
      !balance
    )
      return;
    if (formatUnits(totalPayment, decimals) > formatUnits(balance, decimals)) {
      setDepositError(true);
      return;
    }

    try {
      setLoading(true);
      let hash;
      if (paymentType === 1) {
        hash = await walletClient.sendTransaction({
          to: validAddress,
          value: totalPayment,
        });
      } else if (fulfilled) {
        hash = '0x'; // await tipTokens(
        //   walletClient,
        //   validAddress,
        //   validToken,
        //   totalPayment,
        // );
      } else {
        hash = '0x'; // await depositTokens(
        //   walletClient,
        //   validAddress,
        //   validToken,
        //   totalPayment,
        // );
      }
      setTxHash(hash as Hex);
      const { chain } = walletClient;
      window.location.href = `/invoice/${chain.id.toString(
        16,
      )}/${address}/instant`;
    } catch (e) {
      setLoading(false);
      logError('error during deposit: ', depositError);
    }
  };

  const doApprove = async () => {
    setTxHash(undefined);
    if (!validToken || !validAddress || !totalPayment || !walletClient) {
      logError(
        `error during approve. totalPayment: ${totalPayment} walletClient: ${walletClient}`,
      );
      return;
    }
    try {
      setLoading(true);
      const { chain, account } = walletClient;
      const approvalAmount = BigInt(totalPayment);
      const hash = await approve(
        walletClient,
        validToken,
        validAddress,
        approvalAmount,
      );
      setTxHash(hash);
      // await waitForTransaction(chain, hash);
      setAllowance(BigInt(0));
      // await getAllowance(chain, validToken, account.address, validAddress),
      // );
    } catch (approvalError) {
      logError('error during approve: ', approvalError);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tipAmount > 0) {
      const v = BigInt(amount) + tipAmount;
      setTotalPayment(v);
    } else {
      setTotalPayment(amount);
    }
  }, [amount, tipAmount]);

  useEffect(() => {
    try {
      if (!walletClient || !validToken || !validAddress) return;
      const { account, chain } = walletClient;
      if (paymentType === 0) {
        balanceOf(chain, validToken, account.address).then(setBalance);
        // getAllowance(chain, validToken, account.address, validAddress).then(
        //   setAllowance,
        // );
      } else {
        // TODO: get balance from wallet
        // walletClient..(account).then(setBalance);
      }
    } catch (balanceError) {
      logError({ balanceError });
    }
  }, [validAddress, paymentType, validToken, walletClient]);

  useEffect(() => {
    if (
      depositError &&
      balance &&
      formatUnits(balance, decimals) > formatUnits(totalPayment, decimals)
    ) {
      setDepositError(false);
    }
  }, [depositError, amount, balance, decimals, totalPayment]);

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="bold"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
        color="black"
      >
        {fulfilled ? 'Add Tip' : 'Pay Invoice'}
      </Heading>
      {depositError ? (
        <Flex>
          <Alert bg="none" margin="0 auto" textAlign="center" padding="0">
            <AlertIcon color="red.500" />

            <AlertTitle fontSize="sm" color="red.500">
              Not enough available {symbol} for this deposit
            </AlertTitle>
          </Alert>
        </Flex>
      ) : null}

      <Text textAlign="center" color="black">
        How much will you be {fulfilled ? 'tipping' : 'depositing'} today?
      </Text>

      <VStack spacing="0.5rem" align="stretch" color="black" mb="1rem">
        <Flex justify="space-between" w="100%">
          <Text fontWeight="700">Amount</Text>

          <Flex>
            {paymentType === 1 && (
              <Tooltip
                label={`Your ${NATIVE_TOKEN_SYMBOL} will be automagically wrapped to ${symbol} tokens`}
                placement="auto-start"
              >
                <QuestionIcon ml="1rem" boxSize="0.75rem" />
              </Tooltip>
            )}
          </Flex>
        </Flex>

        <InputGroup>
          {!fulfilled && (
            <InputLeftElement>
              <Text
                color="blue.1"
                mb={0}
                _hover={{ textDecoration: 'underline' }}
                cursor="pointer"
                textAlign="right"
                onClick={() => {
                  const newAmount = due;
                  if (newAmount) {
                    setAmount(newAmount);
                    const newAmountInput = formatUnits(
                      newAmount,
                      decimals,
                    ).toString();
                    setAmountInput(newAmountInput);
                  } else {
                    setAmount(BigInt(0));
                  }
                }}
              >
                Max
              </Text>
            </InputLeftElement>
          )}

          <Input
            bg="white"
            color="black"
            border="1px"
            borderColor="lightgrey"
            type="number"
            textAlign="right"
            value={amountInput}
            onChange={e => {
              const newAmountInput = e.target.value;
              setAmountInput(newAmountInput);
              if (newAmountInput) {
                const newAmount = parseUnits(newAmountInput, decimals);
                setAmount(newAmount);
                setChecked(getCheckedStatus(deposited + newAmount, amounts));
              } else {
                setAmount(BigInt(0));
                setChecked(initialStatus);
              }
            }}
            placeholder="Amount to Deposit"
            pr={isWRAPPED ? '6.5rem' : '4rem'}
          />

          <InputRightElement w={isWRAPPED ? '6.5rem' : '4rem'}>
            {isWRAPPED ? (
              <Select
                onChange={e => setPaymentType(Number(e.target.value))}
                value={paymentType}
                bg="white"
                color="black"
                border="1px"
                paddingLeft={2}
                borderColor="lightgrey"
                borderLeftRadius={0}
              >
                <option value="0">{symbol}</option>
                <option value="1">{NATIVE_TOKEN_SYMBOL}</option>
              </Select>
            ) : (
              symbol
            )}
          </InputRightElement>
        </InputGroup>
        {due && !fulfilled ? (
          <Text fontSize={12} mt={0}>
            Total Due: {`${formatUnits(due, decimals)} ${symbol}`}
          </Text>
        ) : null}
        {amount > due && !fulfilled && (
          <Alert bg="none">
            <AlertIcon color="red.500" />

            <AlertTitle fontSize="sm">
              Your deposit is greater than the due amount!
            </AlertTitle>
          </Alert>
        )}
        {!openTipPanel && amount === due && !fulfilled && (
          <Text
            textAlign="center"
            color="blue.1"
            onClick={() => setOpenTipPanel(true)}
            cursor="pointer"
          >
            Add a tip
          </Text>
        )}
      </VStack>
      {amount === due && (
        <VStack>
          {openTipPanel && (
            <>
              <Text color="grey">Select a tip amount</Text>

              <ButtonGroup color="blue.1">
                <Button
                  color="blue.1"
                  borderColor="blue.1"
                  cursor="pointer"
                  fontWeight="normal"
                  borderWidth={1}
                  width={100}
                  minHeight={50}
                  onClick={() => {
                    setCustomTip('');
                    setTipAmount(BigInt(0));
                    setOpenTipPanel(false);
                  }}
                >
                  None
                </Button>
                {defaultTipPercs.map(t => (
                  <Button
                    value={t}
                    key={t}
                    borderColor="blue.1"
                    backgroundColor={tipPerc === t ? 'blue.1' : undefined}
                    color={tipPerc === t ? 'white' : undefined}
                    _hover={{
                      backgroundColor:
                        tipPerc === t ? 'rgba(61, 136, 248, 0.7)' : undefined,
                    }}
                    _active={{
                      backgroundColor:
                        tipPerc === t ? 'rgba(61, 136, 248, 0.7)' : undefined,
                    }}
                    borderWidth={1}
                    flexDir="column"
                    width={100}
                    gap={1}
                    minHeight={50}
                    onClick={() => {
                      setTipPerc(t);
                      if (t && !Number.isNaN(Number(t))) {
                        const p = total * BigInt(t / 100);
                        setTipAmount(p);
                      } else {
                        setTipAmount(BigInt(0));
                      }
                    }}
                  >
                    <Heading fontSize={12}>{`${t}%`}</Heading>

                    <Text>
                      {formatUnits(total * BigInt(t / 100), decimals)}
                    </Text>
                    {/* <Text fontSize={10}>{symbol}</Text> */}
                  </Button>
                ))}

                <Button
                  value="custom"
                  borderColor="blue.1"
                  backgroundColor={tipPerc === 'custom' ? 'blue.1' : undefined}
                  color={tipPerc === 'custom' ? 'white' : undefined}
                  _hover={{
                    backgroundColor:
                      tipPerc === 'custom' && 'rgba(61, 136, 248, 0.7)',
                  }}
                  _active={{
                    backgroundColor:
                      tipPerc === 'custom' && 'rgba(61, 136, 248, 0.7)',
                  }}
                  borderWidth={1}
                  width={100}
                  minHeight={50}
                  onClick={e => {
                    const v = e.currentTarget.value;
                    // setTipPerc(v);
                    if (customTip && !Number.isNaN(Number(customTip))) {
                      const p = parseUnits(customTip, decimals);
                      setTipAmount(p);
                    } else {
                      setTipAmount(BigInt(0));
                    }
                  }}
                >
                  Custom
                </Button>
              </ButtonGroup>
              {tipPerc === 'custom' && (
                <InputGroup maxWidth={300}>
                  <Input
                    type="number"
                    value={customTip}
                    onChange={e => {
                      const v = e.currentTarget.value;
                      setCustomTip(v);
                      if (v && !Number.isNaN(Number(v))) {
                        const p = parseUnits(v, decimals);
                        setTipAmount(p);
                      } else {
                        setTipAmount(BigInt(0));
                      }
                    }}
                    placeholder="Enter tip amount"
                    color="#323C47"
                    borderColor="lightgrey"
                    textAlign="right"
                  />

                  <InputRightAddon
                    bg="white"
                    color="black"
                    border="1px"
                    borderColor="lightgrey"
                    borderLeftRadius={0}
                  >
                    <Text>
                      {paymentType === 1 ? NATIVE_TOKEN_SYMBOL : symbol}
                    </Text>
                  </InputRightAddon>
                </InputGroup>
              )}
            </>
          )}
        </VStack>
      )}

      <Flex color="black" justify="space-between" w="100%" fontSize="sm">
        {deposited ? (
          <VStack align="flex-start">
            <Text fontWeight="bold">Total Paid</Text>

            <Text>{`${formatUnits(deposited, decimals)} ${symbol}`}</Text>
          </VStack>
        ) : null}
        {totalPayment ? (
          <VStack color="black">
            <Text fontWeight="bold">Total Payment</Text>

            <Heading size="lg">
              {formatUnits(totalPayment, decimals)}{' '}
              {paymentType === 1 ? NATIVE_TOKEN_SYMBOL : symbol}
            </Heading>
          </VStack>
        ) : null}
        {balance ? (
          <VStack align="flex-end">
            <Text fontWeight="bold">Your Balance</Text>

            <Text>
              {`${formatUnits(balance, decimals)} ${
                paymentType === 0 ? symbol : NATIVE_TOKEN_SYMBOL
              }`}
            </Text>
          </VStack>
        ) : null}
      </Flex>
      {paymentType === 0 && allowance < totalPayment && (
        <Button
          onClick={doApprove}
          isLoading={loading}
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.4"
          isDisabled={amount <= 0}
          textTransform="uppercase"
          size={buttonSize}
          fontFamily="mono"
          fontWeight="normal"
          w="100%"
        >
          Approve
        </Button>
      )}

      <Button
        onClick={deposit}
        isLoading={loading}
        _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        color="white"
        backgroundColor="blue.1"
        isDisabled={
          amount <= 0 || (allowance < totalPayment && paymentType === 0)
        }
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="normal"
        w="100%"
      >
        Pay
      </Button>
      {chainId && txHash ? (
        <Text color="black" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chainId, txHash)}
            isExternal
            color="blue.1"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      ) : null}
    </VStack>
  );
}
