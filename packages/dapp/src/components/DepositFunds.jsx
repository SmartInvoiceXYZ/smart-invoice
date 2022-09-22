import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Checkbox,
  Flex,
  Heading,
  Input,
  InputGroup,
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

import { Web3Context } from '../context/Web3Context';
import { QuestionIcon } from '../icons/QuestionIcon';
import { balanceOf } from '../utils/erc20';
import {
  getHexChainId,
  getNativeTokenSymbol,
  getTokenInfo,
  getTxLink,
  getWrappedNativeToken,
  logError,
  calculateResolutionFeePercentage,
} from '../utils/helpers';

const getCheckedStatus = (deposited, amounts) => {
  let sum = BigNumber.from(0);
  return amounts.map(a => {
    sum = sum.add(a);
    return deposited.gte(sum);
  });
};

const checkedAtIndex = (index, checked) => {
  return checked.map((_c, i) => i <= index);
};

export const DepositFunds = ({ invoice, deposited, due, tokenData }) => {
  const { chainId, provider, account } = useContext(Web3Context);
  const NATIVE_TOKEN_SYMBOL = getNativeTokenSymbol(chainId);
  const WRAPPED_NATIVE_TOKEN = getWrappedNativeToken(chainId);
  const { address, token, network, amounts, currentMilestone } = invoice;
  const [paymentType, setPaymentType] = useState(0);
  const [amount, setAmount] = useState(BigNumber.from(0));
  const [amountInput, setAmountInput] = useState('');
  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const deposit = async () => {
    if (!amount || !provider) return;
    try {
      setLoading(true);
      let tx;
      if (paymentType === 1) {
        tx = await provider
          .getSigner()
          .sendTransaction({ to: address, value: amount });
      } else {
        const abi = ['function transfer(address, uint256) public'];
        const tokenContract = new Contract(token, abi, provider.getSigner());
        tx = await tokenContract.transfer(address, amount);
      }
      setTransaction(tx);
      await tx.wait();
      window.location.href = `/invoice/${getHexChainId(network)}/${address}`;
    } catch (depositError) {
      setLoading(false);
      logError({ depositError });
    }
  };

  const isWRAPPED = token.toLowerCase() === WRAPPED_NATIVE_TOKEN;
  const initialStatus = getCheckedStatus(deposited, amounts);
  const [checked, setChecked] = useState(initialStatus);

  const [balance, setBalance] = useState();

  useEffect(() => {
    try {
      if (paymentType === 0) {
        balanceOf(provider, token, account).then(setBalance);
      } else {
        provider.getBalance(account).then(setBalance);
      }
    } catch (balanceError) {
      logError({ balanceError });
    }
  }, [paymentType, token, provider, account]);

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="bold"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
        color="black"
      >
        Pay Invoice
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem" color="black">
        At a minimum, you’ll need to deposit enough to cover the{' '}
        {currentMilestone === 0 ? 'first' : 'next'} project payment.
      </Text>

      <Text textAlign="center" color="black">
        How much will you be depositing today?
      </Text>
      <VStack spacing="0.5rem">
        {amounts.map((a, i) => {
          return (
            <Checkbox
              key={i.toString()}
              isChecked={checked[i]}
              isDisabled={initialStatus[i]}
              onChange={e => {
                const newChecked = e.target.checked
                  ? checkedAtIndex(i, checked)
                  : checkedAtIndex(i - 1, checked);
                const totAmount = amounts.reduce(
                  (tot, cur, ind) => (newChecked[ind] ? tot.add(cur) : tot),
                  BigNumber.from(0),
                );
                const newAmount = totAmount.gte(deposited)
                  ? totAmount.sub(deposited)
                  : BigNumber.from(0);

                setChecked(newChecked);
                setAmount(newAmount);
                setAmountInput(utils.formatUnits(newAmount, decimals));
              }}
              colorScheme="blue"
              borderColor="lightgrey"
              size="lg"
              fontSize="1rem"
              color="#323C47"
            >
              Payment #{i + 1} &nbsp; &nbsp;
              {utils.formatUnits(a, decimals)} {symbol}
            </Checkbox>
          );
        })}
      </VStack>

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
          <Input
            bg="white"
            color="black"
            border="1px"
            type="number"
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
            pr={isWRAPPED ? '6rem' : '3.5rem'}
          />
          <InputRightElement w={isWRAPPED ? '6rem' : '3.5rem'}>
            {isWRAPPED ? (
              <Select
                onChange={e => setPaymentType(Number(e.target.value))}
                value={paymentType}
                bg="white"
                color="black"
                border="1px"
              >
                <option value="0">{symbol}</option>
                <option value="1">{NATIVE_TOKEN_SYMBOL}</option>
              </Select>
            ) : (
              symbol
            )}
          </InputRightElement>
        </InputGroup>
        {amount.gt(due) && (
          <Alert bg="none">
            <AlertIcon color="red.500" />
            <AlertTitle fontSize="sm">
              Your deposit is greater than the due amount!
            </AlertTitle>
          </Alert>
        )}
      </VStack>
      <Flex color="black" justify="space-between" w="100%" fontSize="sm">
        {deposited && (
          <VStack align="flex-start">
            <Text fontWeight="bold">Total Deposited</Text>
            <Text>{`${utils.formatUnits(deposited, decimals)} ${symbol}`}</Text>
          </VStack>
        )}
        {deposited && (
          <VStack align="flex-start">
            <Text fontWeight="bold">Potential Dispute Fee</Text>
            <Text>{`${(
              (utils.formatUnits(amount, decimals) -
                utils.formatUnits(deposited, decimals)) *
              calculateResolutionFeePercentage(invoice.resolutionRate)
            ).toFixed(6)} ${symbol}`}</Text>
          </VStack>
        )}
        {due && (
          <VStack>
            <Text fontWeight="bold">Total Due</Text>
            <Text>{`${utils.formatUnits(due, decimals)} ${symbol}`}</Text>
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
      <Button
        onClick={deposit}
        isLoading={loading}
        _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        color="white"
        backgroundColor="blue.1"
        isDisabled={amount.lte(0)}
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="normal"
        w="100%"
      >
        Deposit
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
};
