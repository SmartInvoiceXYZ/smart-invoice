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
import { BigNumber, Contract, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import { Web3Context } from '../../context/Web3Context';
import { QuestionIcon } from '../../icons/QuestionIcon';
import { balanceOf } from '../../utils/erc20';
import {
  getHexChainId,
  getNativeTokenSymbol,
  getTokenInfo,
  getTxLink,
  getWrappedNativeToken,
  logError,
} from '../../utils/helpers';
import { depositTokens, tipTokens } from '../../utils/invoice';

const getCheckedStatus = (deposited, amounts) => {
  let sum = BigNumber.from(0);
  return amounts.map(a => {
    sum = sum.add(a);
    return deposited.gte(sum);
  });
};

export function DepositFunds({
  invoice,
  deposited,
  due,
  total,
  tokenData,
  fulfilled,
}) {
  const { chainId, provider, account } = useContext(Web3Context);
  const NATIVE_TOKEN_SYMBOL = getNativeTokenSymbol(chainId);
  const WRAPPED_NATIVE_TOKEN = getWrappedNativeToken(chainId);
  const { address, token, network, amounts } = invoice;
  const [paymentType, setPaymentType] = useState(0);
  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [amount, setAmount] = useState(BigNumber.from(0));
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const [depositError, setDepositError] = useState(false);
  const [openTipPanel, setOpenTipPanel] = useState(false);
  const [tipPerc, setTipPerc] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [tipAmount, setTipAmount] = useState(BigNumber.from(0));
  const [totalPayment, setTotalPayment] = useState(BigNumber.from(0));
  const [allowance, setAllowance] = useState(BigNumber.from(0));

  const defaultTipPercs = [10, 15, 18];

  const deposit = async () => {
    setTransaction();
    if (!totalPayment || !provider) return;
    if (
      utils.formatUnits(totalPayment, decimals) >
      utils.formatUnits(balance, decimals)
    ) {
      return setDepositError(true);
    }

    try {
      setLoading(true);
      let tx;
      if (paymentType === 1) {
        tx = await provider
          .getSigner()
          .sendTransaction({ to: address, value: totalPayment });
      } else if (fulfilled) {
        tx = await tipTokens(provider, address, token, totalPayment);
      } else {
        tx = await depositTokens(provider, address, token, totalPayment);
      }
      setTransaction(tx);
      await tx.wait();
      window.location.href = `/invoice/${getHexChainId(
        network,
      )}/${address}/instant`;
    } catch (depositError) {
      setLoading(false);
      console.error('error during deposit: ', depositError);
      logError({ depositError });
    }
  };

  const approve = async () => {
    setTransaction();
    if (!totalPayment || !provider) {
      console.error(
        `error during approve. totalPayment: ${totalPayment} provider: ${provider}`,
      );
      return;
    }
    try {
      setLoading(true);
      let tx;
      const approvalAmount = BigNumber.from(totalPayment);
      const abi = [
        'function approve(address spender, uint256 amount) public virtual override returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
      ];
      const tokenContract = new Contract(token, abi, provider.getSigner());
      tx = await tokenContract.approve(invoice.address, approvalAmount);
      setTransaction(tx);
      await tx.wait();
      setAllowance(await tokenContract.allowance(account, invoice.address));
    } catch (approvalError) {
      console.error('error during approve: ', approvalError);
      logError({ approvalError });
    }
    setLoading(false);
  };

  const isWRAPPED = token.toLowerCase() === WRAPPED_NATIVE_TOKEN;
  const initialStatus = getCheckedStatus(deposited, amounts);
  // eslint-disable-next-line no-unused-vars
  const [checked, setChecked] = useState(initialStatus);

  const [balance, setBalance] = useState();

  useEffect(() => {
    if (tipAmount.gt(0)) {
      const v = BigNumber.from(amount).add(tipAmount);
      setTotalPayment(v);
    } else {
      setTotalPayment(amount);
    }
  }, [amount, tipAmount]);

  useEffect(() => {
    try {
      if (paymentType === 0) {
        balanceOf(provider, token, account).then(setBalance);
        const abi = [
          'function allowance(address owner, address spender) external view returns (uint256)',
        ];
        const tokenContract = new Contract(token, abi, provider.getSigner());
        tokenContract.allowance(account, invoice.address).then(setAllowance);
      } else {
        provider.getBalance(account).then(setBalance);
      }
    } catch (balanceError) {
      logError({ balanceError });
    }
  }, [invoice.address, paymentType, token, provider, account]);

  useEffect(() => {
    if (
      depositError &&
      utils.formatUnits(balance, decimals) >
        utils.formatUnits(totalPayment, decimals)
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
                    const newAmountInput = utils
                      .formatUnits(newAmount, decimals)
                      .toString();
                    setAmountInput(newAmountInput);
                  } else {
                    setAmount(BigNumber.from(0));
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
                const newAmount = utils.parseUnits(newAmountInput, decimals);
                setAmount(newAmount);
                setChecked(getCheckedStatus(deposited.add(newAmount), amounts));
              } else {
                setAmount(BigNumber.from(0));
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
        {due && !fulfilled && (
          <Text fontSize={12} mt={0}>
            Total Due: {`${utils.formatUnits(due, decimals)} ${symbol}`}
          </Text>
        )}
        {amount.gt(due) && !fulfilled && (
          <Alert bg="none">
            <AlertIcon color="red.500" />
            <AlertTitle fontSize="sm">
              Your deposit is greater than the due amount!
            </AlertTitle>
          </Alert>
        )}
        {!openTipPanel && amount.eq(due) && !fulfilled && (
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
                    setTipAmount(BigNumber.from(0));
                    setOpenTipPanel(false);
                  }}
                >
                  None
                </Button>
                {defaultTipPercs.map(t => (
                  <Button
                    value={t}
                    borderColor="blue.1"
                    backgroundColor={tipPerc === t && 'blue.1'}
                    color={tipPerc === t && 'white'}
                    _hover={{
                      backgroundColor:
                        tipPerc === t && 'rgba(61, 136, 248, 0.7)',
                    }}
                    _active={{
                      backgroundColor:
                        tipPerc === t && 'rgba(61, 136, 248, 0.7)',
                    }}
                    borderWidth={1}
                    flexDir="column"
                    width={100}
                    gap={1}
                    minHeight={50}
                    onClick={e => {
                      setTipPerc(t);
                      if (t && !isNaN(Number(t))) {
                        const p = BigNumber.from(total).mul(t).div(100);
                        setTipAmount(p);
                      } else {
                        setTipAmount(BigNumber.from(0));
                      }
                    }}
                  >
                    <Heading fontSize={12}>{`${t}%`}</Heading>
                    <Text>
                      {utils.formatUnits(
                        BigNumber.from(total).mul(t).div(100),
                        decimals,
                      )}
                    </Text>
                    {/* <Text fontSize={10}>{symbol}</Text> */}
                  </Button>
                ))}
                <Button
                  value="custom"
                  borderColor="blue.1"
                  backgroundColor={tipPerc === 'custom' && 'blue.1'}
                  color={tipPerc === 'custom' && 'white'}
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
                    setTipPerc(v);
                    if (customTip && !isNaN(Number(customTip))) {
                      const p = utils.parseUnits(customTip, decimals);
                      setTipAmount(p);
                    } else {
                      setTipAmount(BigNumber.from(0));
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
                      if (v && !isNaN(Number(v))) {
                        const p = utils.parseUnits(v, decimals);
                        setTipAmount(p);
                      } else {
                        setTipAmount(BigNumber.from(0));
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
        {deposited && (
          <VStack align="flex-start">
            <Text fontWeight="bold">Total Paid</Text>
            <Text>{`${utils.formatUnits(deposited, decimals)} ${symbol}`}</Text>
          </VStack>
        )}
        {totalPayment && (
          <VStack color="black">
            <Text fontWeight="bold">Total Payment</Text>
            <Heading size="lg">
              {utils.formatUnits(totalPayment, decimals)}{' '}
              {paymentType === 1 ? NATIVE_TOKEN_SYMBOL : symbol}
            </Heading>
          </VStack>
        )}
        {balance && (
          <VStack align="flex-end">
            <Text fontWeight="bold">Your Balance</Text>
            <Text>
              {`${utils.formatUnits(balance, decimals)} ${
                paymentType === 0 ? symbol : NATIVE_TOKEN_SYMBOL
              }`}
            </Text>
          </VStack>
        )}
      </Flex>
      {paymentType === 0 && allowance.lt(totalPayment) && (
        <Button
          onClick={approve}
          isLoading={loading}
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.4"
          isDisabled={amount.lte(0)}
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
          amount.lte(0) || (allowance.lt(totalPayment) && paymentType === 0)
        }
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="normal"
        w="100%"
      >
        Pay
      </Button>
      {transaction && (
        <Text color="black" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chainId, transaction.hash)}
            isExternal
            color="blue.1"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )}
    </VStack>
  );
}
