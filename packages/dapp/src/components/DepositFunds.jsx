import {
  Button,
  Checkbox,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Select,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { BigNumber, Contract, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { ADDRESSES, NATIVE_TOKEN_SYMBOL } from '../utils/constants';
import { getToken, getTxLink, logError } from '../utils/helpers';

const { WRAPPED_TOKEN } = ADDRESSES;

export const DepositFunds = ({ invoice, deposited }) => {
  const { address, token, amounts, currentMilestone } = invoice;
  const [paymentType, setPaymentType] = useState(0);
  const { provider } = useContext(Web3Context);
  const [amount, setAmount] = useState(BigNumber.from(0));
  const [amountInput, setAmountInput] = useState('');
  const tokenData = getToken(token);
  const { decimals, symbol } = tokenData;
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
      window.location.href = `/invoice/${address}`;
    } catch (depositError) {
      setLoading(false);
      logError({ depositError });
    }
  };
  const isWRAPPED = token.toLowerCase() === WRAPPED_TOKEN;

  useEffect(() => {
    if (amountInput) {
      setAmount(utils.parseUnits(amountInput, decimals));
    }
  }, [amountInput, decimals]);

  let sum = BigNumber.from(0);
  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
      >
        Pay Invoice
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem">
        At a minimum, you’ll need to deposit enough to cover the{' '}
        {currentMilestone === 0 ? 'first' : 'next'} project payment.
      </Text>

      <Text textAlign="center" color="red.500">
        How much will you be depositing today?
      </Text>
      <VStack spacing="0.5rem">
        {amounts.map((a, i) => {
          sum = sum.add(a);
          return (
            <Checkbox
              key={i.toString()}
              isChecked={deposited.gte(sum) ? true : undefined}
              isDisabled={deposited.gte(sum)}
              onChange={e => {
                if (e.target.checked) {
                  setAmountInput(_input => {
                    const amt = _input
                      ? utils.parseUnits(_input, decimals)
                      : BigNumber.from(0);
                    return utils.formatUnits(amt.add(amounts[i]), decimals);
                  });
                } else {
                  setAmountInput(_input => {
                    const amt = _input
                      ? utils.parseUnits(_input, decimals)
                      : BigNumber.from(0);
                    return amt.gt(amounts[i])
                      ? utils.formatUnits(amt.sub(amounts[i]), decimals)
                      : '0';
                  });
                }
              }}
              colorScheme="red"
              border="none"
              size="lg"
              fontSize="1rem"
              color="white"
            >
              Payment #{i + 1} &nbsp; &nbsp;
              {utils.formatUnits(a, decimals)} {symbol}
            </Checkbox>
          );
        })}
      </VStack>

      <VStack spacing="0.5rem" align="stretch" color="red.500" mb="1rem">
        <Text fontWeight="700">Amount</Text>
        <InputGroup>
          <Input
            bg="black"
            color="white"
            border="none"
            type="number"
            value={amountInput}
            onChange={e => setAmountInput(e.target.value)}
            placeholder="Amount to Deposit"
            pr="3.5rem"
          />
          <InputRightElement w="3.5rem">
            {isWRAPPED ? (
              <Select
                onChange={e => setPaymentType(Number(e.target.value))}
                value={paymentType}
                bg="black"
                color="white"
                border="none"
              >
                <option value="0">{symbol}</option>
                <option value="1">{NATIVE_TOKEN_SYMBOL}</option>
              </Select>
            ) : (
              symbol
            )}
          </InputRightElement>
        </InputGroup>
      </VStack>
      <Button
        onClick={deposit}
        isLoading={loading}
        colorScheme="red"
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
        <Text color="white" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(transaction.hash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )}
    </VStack>
  );
};
