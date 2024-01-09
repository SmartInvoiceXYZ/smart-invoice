import React, { useCallback, useState } from 'react';
import { Hash, formatUnits, parseUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import {
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  Tooltip,
  VStack,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import { waitForTransaction } from '@wagmi/core';

import { ChainId } from '../constants/config';
import { QuestionIcon } from '../icons/QuestionIcon';
import { OrderedTextarea } from '../shared/OrderedInput';
import { TokenData } from '../types';
import { getTokenInfo, getTxLink, isAddress, logError } from '../utils/helpers';
import { resolve } from '../utils/invoice';
import { uploadDisputeDetails } from '../utils/ipfs';
import { Invoice } from '../graphql/fetchInvoice';

export type ResolveFundsProps = {
  invoice: Invoice;
  balance: bigint;
  close: any;
  tokenData: Record<ChainId, Record<string, TokenData>>;
};

export function ResolveFunds({
  invoice,
  balance,
  close,
  tokenData,
}: ResolveFundsProps) {
  const { address, resolutionRate, token, isLocked } = invoice ?? {};
  const validAddress = isAddress(address);
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash>();
  const toast = useToast();

  const resolverAward =
    balance > 0 && resolutionRate && resolutionRate > 0 ? balance / resolutionRate : BigInt(0);
  const availableFunds = balance - resolverAward;
  const [clientAward, setClientAward] = useState(availableFunds);
  const [providerAward, setProviderAward] = useState(BigInt(0));
  const [clientAwardInput, setClientAwardInput] = useState(
    formatUnits(availableFunds, decimals),
  );
  const [providerAwardInput, setProviderAwardInput] = useState('0');
  const [comments, setComments] = useState('');
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const resolveFunds = useCallback(async () => {
    if (
      walletClient &&
      chainId &&
      isLocked &&
      comments &&
      validAddress &&
      balance === clientAward + providerAward + resolverAward &&
      balance > 0
    ) {
      try {
        setLoading(true);
        const detailsHash = await uploadDisputeDetails({
          comments,
          invoice: address,
          amount: balance.toString(),
        });
        const hash = await resolve(
          walletClient,
          validAddress,
          clientAward,
          providerAward,
          detailsHash,
        );
        setTxHash(hash);
        const txReceipt = await waitForTransaction({ chainId, hash });
        setLoading(false);
        if (txReceipt.status === 'success') {
          window.location.href = `/invoice/${chainId.toString(16)}/${address}`;
        } else {
          toast({
            status: 'error',
            title: 'Transaction failed',
            description: (
              <Flex direction="row">
                <Heading>Transaction failed</Heading>
                <Text>
                  Transaction {txReceipt.transactionHash} status is '
                  {txReceipt.status}'.
                </Text>
              </Flex>
            ),
            isClosable: true,
            duration: 5000,
          });
        }
      } catch (depositError) {
        setLoading(false);
        logError({ depositError });
      }
    }
  }, [walletClient, chainId, isLocked, comments, validAddress, balance, clientAward, providerAward, resolverAward, address, toast]);

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="bold"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
        color="black"
      >
        Resolve Dispute
      </Heading>

      <Text textAlign="center" fontSize="sm" mb="1rem" color="black">
        {isLocked
          ? `Review the project agreement to decide how to distribute the disputed payment of ${formatUnits(
              balance,
              decimals,
            )} ${symbol} between the client & provider, excluding the ${
              100 / Number(resolutionRate)
            }% arbitration fee you’ll receive.`
          : `Invoice is not locked`}
      </Text>
      {isLocked ? (
        <>
          <OrderedTextarea
            tooltip="Include a note explaining your decision."
            label="Resolution Comments"
            value={comments}
            setValue={setComments}
            infoText="Include a note explaining your decision."
          />

          <VStack spacing="0.5rem" align="stretch" color="black">
            <Flex w="100%">
              <Text fontWeight="700" color="black">
                Client Award
              </Text>

              <Tooltip
                color="white"
                label="How much of the disputed payment should the client receive?"
                placement="auto-start"
              >
                <QuestionIcon ml=".25rem" boxSize="0.75rem" />
              </Tooltip>
            </Flex>

            <InputGroup>
              <Input
                bg="white"
                color="black"
                border="1px"
                type="number"
                value={clientAwardInput}
                pr="3.5rem"
                alt="How much of the disputed payment should the client receive?"
                onChange={(e: any) => {
                  setClientAwardInput(e.target.value);
                  if (e.target.value) {
                    let award = parseUnits(e.target.value, decimals);
                    if (award > availableFunds) {
                      award = availableFunds;
                      setClientAwardInput(formatUnits(award, decimals));
                    }
                    setClientAward(award);
                    award = availableFunds - award;
                    setProviderAward(award);
                    setProviderAwardInput(formatUnits(award, decimals));
                  }
                }}
                placeholder="Client Award"
              />

              <InputRightElement w="3.5rem">{symbol}</InputRightElement>
            </InputGroup>
          </VStack>

          <VStack spacing="0.5rem" align="stretch" color="black">
            {/* <Text fontWeight="700">Provider Award</Text> */}

            <Flex w="100%">
              <Text fontWeight="700" color="black">
                Provider Award
              </Text>

              <Tooltip
                color="white"
                label="How much of the disputed payment should the provider receive?"
                placement="auto-start"
              >
                <QuestionIcon ml=".25rem" boxSize="0.75rem" />
              </Tooltip>
            </Flex>

            <InputGroup>
              <Input
                bg="white"
                color="black"
                border="1px"
                type="number"
                value={providerAwardInput}
                pr="3.5rem"
                alt="How much of the disputed payment should the provider receive?"
                onChange={(e: any) => {
                  setProviderAwardInput(e.target.value);
                  if (e.target.value) {
                    let award = parseUnits(e.target.value, decimals);
                    if (award > availableFunds) {
                      award = availableFunds;
                      setProviderAwardInput(formatUnits(award, decimals));
                    }
                    setProviderAward(award);
                    award = availableFunds - award;
                    setClientAward(award);
                    setClientAwardInput(formatUnits(award, decimals));
                  }
                }}
                placeholder="Provider Award"
              />

              <InputRightElement w="3.5rem">{symbol}</InputRightElement>
            </InputGroup>
          </VStack>

          <VStack spacing="0.5rem" align="stretch" color="black" mb="1rem">
            <Flex w="100%">
              <Text fontWeight="700" color="black">
                Arbitrator Award
              </Text>

              <Tooltip
                color="white"
                label="This is how much you’ll receive as your fee for resolving this dispute."
                placement="auto-start"
              >
                <QuestionIcon ml=".25rem" boxSize="0.75rem" />
              </Tooltip>
            </Flex>

            <InputGroup>
              <Input
                bg="white"
                color="black"
                border="1px"
                type="number"
                value={formatUnits(resolverAward, decimals)}
                pr="3.5rem"
                alt="This is how much you’ll receive as your fee for resolving this dispute."
                isDisabled
              />

              <InputRightElement w="3.5rem">{symbol}</InputRightElement>
            </InputGroup>
          </VStack>

          <Button
            onClick={resolveFunds}
            isLoading={loading}
            colorScheme="red"
            isDisabled={resolverAward <= 0 || !comments}
            textTransform="uppercase"
            size={buttonSize}
            fontFamily="mono"
            fontWeight="bold"
            w="100%"
          >
            Resolve
          </Button>
          {chainId && txHash && (
            <Text color="black" textAlign="center" fontSize="sm">
              Follow your transaction{' '}
              <Link
                href={getTxLink(chainId, txHash)}
                isExternal
                color="blue"
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
}
