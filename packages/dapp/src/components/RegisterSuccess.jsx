import { Button, Flex, Heading, Link, Text, VStack } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { CreateContext } from '../context/CreateContext';
import { Web3Context } from '../context/Web3Context';
import { CopyIcon } from '../icons/CopyIcon';
import { copyToClipboard, getTxLink } from '../utils/helpers';
import { awaitInvoiceAddress } from '../utils/invoice';
import { Loader } from './Loader';

export const RegisterSuccess = () => {
  const { provider } = useContext(Web3Context);
  const { tx } = useContext(CreateContext);
  const [invoiceID, setInvoiceID] = useState();
  const history = useHistory();

  useEffect(() => {
    if (tx && provider) {
      awaitInvoiceAddress(provider, tx).then(id => {
        setInvoiceID(id);
      });
    }
  }, [tx, provider]);

  return (
    <VStack
      w="100%"
      spacing="1rem"
      align="center"
      justify="center"
      my="8rem"
      maxW="30rem"
    >
      <Heading fontWeight="normal" textAlign="center">
        Invoice Registration Received
      </Heading>
      <Text color="white" textAlign="center" fontSize="sm">
        You can check the progress of your transaction{' '}
        <Link
          href={getTxLink(tx.hash)}
          isExternal
          color="red.500"
          textDecoration="underline"
        >
          here
        </Link>
      </Text>
      {invoiceID ? (
        <>
          <Text color="white" fontStyle="italic" textAlign="center">
            Save this because you will need it to manage your invoice later:
          </Text>
          <VStack w="100%" align="stretch">
            <Text fontWeight="bold">Your Invoice ID</Text>
            <Flex
              p="0.5rem"
              justify="space-between"
              align="center"
              bg="background"
              borderRadius="0.25rem"
              w="100%"
            >
              <Link
                ml="0.5rem"
                href={`/invoice/${invoiceID}`}
                color="white"
                overflow="hidden"
              >
                {invoiceID}
              </Link>
              {document.queryCommandSupported('copy') && (
                <Button
                  ml={4}
                  onClick={() => copyToClipboard(invoiceID.toLowerCase())}
                  variant="ghost"
                  colorScheme="red"
                  h="auto"
                  w="auto"
                  minW="2"
                  p={2}
                >
                  <CopyIcon boxSize={4} />
                </Button>
              )}
            </Flex>
          </VStack>
          <VStack w="100%" align="stretch" mb="1.5rem">
            <Text fontWeight="bold">Link to Invoice</Text>
            <Flex
              p="0.5rem"
              justify="space-between"
              align="center"
              bg="background"
              borderRadius="0.25rem"
              w="100%"
            >
              <Link
                ml="0.5rem"
                href={`/invoice/${invoiceID}`}
                color="white"
                overflow="hidden"
              >{`${
                window.location.origin
              }/invoice/${invoiceID.toLowerCase()}`}</Link>
              {document.queryCommandSupported('copy') && (
                <Button
                  ml={4}
                  onClick={() =>
                    copyToClipboard(
                      `${
                        window.location.origin
                      }/invoice/${invoiceID.toLowerCase()}`,
                    )
                  }
                  variant="ghost"
                  colorScheme="red"
                  h="auto"
                  w="auto"
                  minW="2"
                  p={2}
                >
                  <CopyIcon boxSize={4} />
                </Button>
              )}
            </Flex>
          </VStack>
        </>
      ) : (
        <Loader size="80" />
      )}
      <Button
        w="100%"
        variant="outline"
        colorScheme="red"
        textTransform="uppercase"
        fontFamily="mono"
        fontWeight="normal"
        size="lg"
        onClick={() => history.push('/')}
      >
        Return Home
      </Button>
    </VStack>
  );
};
