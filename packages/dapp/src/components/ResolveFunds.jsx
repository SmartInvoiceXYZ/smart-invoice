import {
  Button,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { OrderedTextarea } from '../shared/OrderedInput';
import { getTokenInfo, getTxLink, logError } from '../utils/helpers';
import { getResolutionRate, resolve } from '../utils/invoice';
import { uploadDisputeDetails } from '../utils/ipfs';

export const ResolveFunds = ({ invoice, balance, close }) => {
  const { address, resolver, token, isLocked } = invoice;
  const { chainId, provider } = useContext(Web3Context);
  const { decimals, symbol } = getTokenInfo(chainId, token);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();
  const [resolutionRate, setResolutionRate] = useState(20);

  useEffect(() => {
    getResolutionRate(provider, resolver).then(setResolutionRate);
  }, [provider, resolver]);

  const resolverAward = balance.gt(0)
    ? balance.div(resolutionRate)
    : BigNumber.from(0);
  const availableFunds = balance.sub(resolverAward);
  const [clientAward, setClientAward] = useState(availableFunds);
  const [providerAward, setProviderAward] = useState(BigNumber.from(0));
  const [clientAwardInput, setClientAwardInput] = useState(
    utils.formatUnits(availableFunds, decimals),
  );
  const [providerAwardInput, setProviderAwardInput] = useState('0');
  const [comments, setComments] = useState('');
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const resolveFunds = async () => {
    if (
      provider &&
      isLocked &&
      comments &&
      balance.eq(clientAward.add(providerAward).add(resolverAward)) &&
      balance.gt(0)
    ) {
      try {
        setLoading(true);
        const detailsHash = await uploadDisputeDetails({
          comments,
          invoice: address,
          amount: balance.toString(),
        });
        const tx = await resolve(
          provider,
          address,
          clientAward,
          providerAward,
          detailsHash,
        );
        setTransaction(tx);
        await tx.wait();
        window.location.href = `/invoice/${address}`;
      } catch (depositError) {
        setLoading(false);
        logError({ depositError });
      }
    }
  };

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
      >
        Resolve Dispute
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem">
        {isLocked
          ? `You’ll need to distribute the total balance of ${utils.formatUnits(
              balance,
              decimals,
            )} ${symbol} between the client and provider, excluding the ${
              100 / resolutionRate
            }% arbitration fee which you shall receive.`
          : `Invoice is not locked`}
      </Text>
      {isLocked ? (
        <>
          <OrderedTextarea
            tooltip="Here you may explain your reasoning behind the resolution"
            label="Resolution Comments"
            value={comments}
            setValue={setComments}
          />

          <VStack spacing="0.5rem" align="stretch" color="red.500">
            <Text fontWeight="700">Client Award</Text>
            <InputGroup>
              <Input
                bg="black"
                color="white"
                border="none"
                type="number"
                value={clientAwardInput}
                pr="3.5rem"
                onChange={e => {
                  setClientAwardInput(e.target.value);
                  if (e.target.value) {
                    let award = utils.parseUnits(e.target.value, decimals);
                    if (award.gt(availableFunds)) {
                      award = availableFunds;
                      setClientAwardInput(utils.formatUnits(award, decimals));
                    }
                    setClientAward(award);
                    award = availableFunds.sub(award);
                    setProviderAward(award);
                    setProviderAwardInput(utils.formatUnits(award, decimals));
                  }
                }}
                placeholder="Client Award"
              />
              <InputRightElement w="3.5rem">{symbol}</InputRightElement>
            </InputGroup>
          </VStack>
          <VStack spacing="0.5rem" align="stretch" color="red.500">
            <Text fontWeight="700">Provider Award</Text>
            <InputGroup>
              <Input
                bg="black"
                color="white"
                border="none"
                type="number"
                value={providerAwardInput}
                pr="3.5rem"
                onChange={e => {
                  setProviderAwardInput(e.target.value);
                  if (e.target.value) {
                    let award = utils.parseUnits(e.target.value, decimals);
                    if (award.gt(availableFunds)) {
                      award = availableFunds;
                      setProviderAwardInput(utils.formatUnits(award, decimals));
                    }
                    setProviderAward(award);
                    award = availableFunds.sub(award);
                    setClientAward(award);
                    setClientAwardInput(utils.formatUnits(award, decimals));
                  }
                }}
                placeholder="Provider Award"
              />
              <InputRightElement w="3.5rem">{symbol}</InputRightElement>
            </InputGroup>
          </VStack>
          <VStack spacing="0.5rem" align="stretch" color="red.500" mb="1rem">
            <Text fontWeight="700">Resolver Award</Text>
            <InputGroup>
              <Input
                bg="black"
                color="white"
                border="none"
                type="number"
                value={utils.formatUnits(resolverAward, decimals)}
                pr="3.5rem"
                isDisabled
              />
              <InputRightElement w="3.5rem">{symbol}</InputRightElement>
            </InputGroup>
          </VStack>
          <Button
            onClick={resolveFunds}
            isLoading={loading}
            colorScheme="red"
            isDisabled={resolverAward.lte(0) || !comments}
            textTransform="uppercase"
            size={buttonSize}
            fontFamily="mono"
            fontWeight="normal"
            w="100%"
          >
            Resolve
          </Button>
          {transaction && (
            <Text color="white" textAlign="center" fontSize="sm">
              Follow your transaction{' '}
              <Link
                href={getTxLink(chainId, transaction.hash)}
                isExternal
                color="red.500"
                textDecoration="underline"
              >
                here
              </Link>
            </Text>
          )}
        </>
      ) : (
        <Button
          onClick={close}
          variant="outline"
          colorScheme="red"
          textTransform="uppercase"
          size={buttonSize}
          fontFamily="mono"
          fontWeight="normal"
          w="100%"
        >
          Close
        </Button>
      )}
    </VStack>
  );
};
