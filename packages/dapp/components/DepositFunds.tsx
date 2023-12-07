import { BigNumber, BigNumberish, Contract, Transaction, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

/* eslint-disable react/no-array-index-key */
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
  VStack,
  useBreakpointValue
} from '@chakra-ui/react';

import { Web3Context } from '../context/Web3Context';
import { QuestionIcon } from '../icons/QuestionIcon';
import { balanceOf } from '../utils/erc20';
import {
  calculateResolutionFeePercentage,
  getHexChainId,
  getNativeTokenSymbol,
  getTokenInfo,
  getTxLink,
  getWrappedNativeToken,
  logError,
} from '../utils/helpers';

const getCheckedStatus = (deposited: any, amounts: any) => {
  let sum = BigNumber.from(0);
  return amounts.map((a: any) => {
    sum = sum.add(a);
    return deposited.gte(sum);
  });
};

const checkedAtIndex = (index: any, checked: any) => checked.map((_c: any, i: any) => i <= index);

export type DepositFundsProps = {
  invoice: any;
  deposited: BigNumberish;
  due: BigNumberish;
  // total: BigNumberish;
  tokenData: any;
  // fulfilled: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  close: () => void;
};

export const DepositFunds: React.FC<DepositFundsProps> = ({
  invoice,
  deposited,
  due,
  tokenData,
}) => {
  const { chainId, provider, account } = useContext(Web3Context);
  const NATIVE_TOKEN_SYMBOL = getNativeTokenSymbol(chainId);
  const WRAPPED_NATIVE_TOKEN = getWrappedNativeToken(chainId);
  const { address, token, network, amounts, currentMilestone } = invoice;
  const [paymentType, setPaymentType] = useState(0);
  const [amount, setAmount] = useState(BigNumber.from(0));
  const [amountInput, setAmountInput] = useState('');
  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction>();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const [depositError, setDepositError] = useState(false);
  const isWRAPPED = token.toLowerCase() === WRAPPED_NATIVE_TOKEN;
  const initialStatus = getCheckedStatus(deposited, amounts);
  const [checked, setChecked] = useState(initialStatus);

  const [balance, setBalance] = useState<BigNumberish>();

  const deposit = async () => {
    if (!amount || !balance || !provider) return;
    if (
      utils.formatUnits(amount, decimals) > utils.formatUnits(balance, decimals)
    ) {
      setDepositError(true);
      return;
    }

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
    } catch (e) {
      setLoading(false);
      logError({ depositError: e });
    }
  };

  useEffect(() => {
    try {
      if (paymentType === 0) {
        balanceOf(provider, token, account).then(setBalance);
      } else if (provider && account) provider.getBalance(account).then(setBalance);
    } catch (balanceError) {
      logError({ balanceError });
    }
  }, [paymentType, token, provider, account]);

  useEffect(() => {
    if (
      depositError && balance &&
      utils.formatUnits(balance, decimals) > utils.formatUnits(amount, decimals)
    ) {
      setDepositError(false);
    }
  }, [decimals, depositError, amount, balance]);

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
        How much will you be depositing today?
      </Text>
      
      <VStack spacing="0.5rem">
        {amounts.map((a: any, i: any) => (
          
          <Checkbox
            key={i.toString()}
            isChecked={checked[i]}
            isDisabled={initialStatus[i]}
            onChange={(e: any) => {
              const newChecked = e.target.checked
                ? checkedAtIndex(i, checked)
                : checkedAtIndex(i - 1, checked);
              const totAmount = amounts.reduce(
                (tot: any, cur: any, ind: any) => (newChecked[ind] ? tot.add(cur) : tot),
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
        ))}
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
            onChange={(e: any) => {
              const newAmountInput = e.target.value;
              setAmountInput(newAmountInput);
              if (newAmountInput) {
                const newAmount = utils.parseUnits(newAmountInput, decimals);
                setAmount(newAmount);
                setChecked(getCheckedStatus(BigNumber.from(deposited).add(newAmount), amounts));
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
                onChange={(e: any) => setPaymentType(Number(e.target.value))}
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
        {deposited !== undefined ? (
          <VStack align="flex-start">
            <Text fontWeight="bold">Total Deposited</Text>
            <Text>{`${utils.formatUnits(deposited, decimals)} ${symbol}`}</Text>
          </VStack>
        ) : null}
        {deposited  !== undefined ?  (
          <VStack align="flex-start">
            <Text fontWeight="bold">Potential Dispute Fee</Text>
            <Text>{`${utils.formatUnits(amount.sub(deposited).mul(calculateResolutionFeePercentage(invoice.resolutionRate)), decimals)} ${symbol}`}</Text>
          </VStack>
        ) : null}
        {due  !== undefined ?  (
          <VStack>
            <Text fontWeight="bold">Total Due</Text>
            <Text>{`${utils.formatUnits(due, decimals)} ${symbol}`}</Text>
          </VStack>
        ) : null}
        {balance  !== undefined ?  (
          <VStack align="flex-end">
            <Text fontWeight="bold">Your Balance</Text>
            <Text>
              {`${utils.formatUnits(balance, decimals)} ${
                paymentType === 0 ? symbol : NATIVE_TOKEN_SYMBOL
              }`}
            </Text>
          </VStack>
        ) : null}
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
      {chainId && transaction?.hash && (
        
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
