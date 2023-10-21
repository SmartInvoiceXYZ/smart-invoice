import {
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';
import { Web3Context } from '../context/Web3Context';
import { QuestionIcon } from '../icons/QuestionIcon';
import { getTokenInfo } from '../utils/helpers';

export function PaymentChunksForm({ display, tokenData }) {
  const { chainId } = useContext(Web3Context);
  const {
    paymentToken,
    milestones,
    payments,
    setPayments,
    paymentDue,
  } = useContext(CreateContext);
  const { decimals, symbol } = getTokenInfo(chainId, paymentToken, tokenData);
  return (
    <VStack w="100%" spacing="1rem" display={display}>
      {Array.from(Array(Number(milestones))).map((_val, index) => (
          <VStack w="100%" spacing="0.5rem" key={index.toString()}>
            <Flex w="100%">
              <Text fontWeight="700">Payment #{index + 1}</Text>
              <Flex>
                <Tooltip
                  label="This is the amount of tokens you’ll receive for completion of this milestone."
                  placement="auto-start"
                >
                  <QuestionIcon ml=".25rem" boxSize="0.75rem" />
                </Tooltip>
              </Flex>
            </Flex>
            <InputGroup>
              <Input
                _hover={{ borderColor: 'lightgray' }}
                bg="white"
                type="text"
                color="#323C47"
                border="1px"
                borderColor="lightgray"
                pr="3.5rem"
                onChange={e => {
                  if (!e.target.value || isNaN(Number(e.target.value))) return;
                  const amount = utils.parseUnits(e.target.value, decimals);
                  const newPayments = payments.slice();
                  newPayments[index] = amount;
                  setPayments(newPayments);
                }}
              />
              <InputRightElement color="white" w="3.5rem">
                {symbol}
              </InputRightElement>
            </InputGroup>
          </VStack>
        ))}
      <Text w="100%" textAlign="right" color="grey" fontWeight="bold">
        Total Amount Must Add Up to {utils.formatUnits(paymentDue, decimals)}{' '}
        {symbol}
      </Text>
    </VStack>
  );
}
