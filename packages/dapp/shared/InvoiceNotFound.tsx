// @ts-expect-error TS(2792): Cannot find module 'next/router'. Did you mean to ... Remove this comment to see the full error message
import { useRouter } from 'next/router';
// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React from 'react';

// @ts-expect-error TS(2792): Cannot find module '@chakra-ui/react'. Did you mea... Remove this comment to see the full error message
import { Button, Flex, Text, VStack } from '@chakra-ui/react';

// @ts-expect-error TS(6142): Module '../icons/WalletFilledIcon' was resolved to... Remove this comment to see the full error message
import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { getNetworkName } from '../utils/helpers';
// @ts-expect-error TS(6142): Module './Container' was resolved to '/Users/moc/d... Remove this comment to see the full error message
import { Container } from './Container';

export function InvoiceNotFound({
  heading,
  chainId
}: any) {
  const router = useRouter();
  return (
    
    <Container>
      
      <VStack
        spacing="1rem"
        background="background"
        borderRadius="1rem"
        align="center"
        w="calc(100% - 2rem)"
        p="2rem"
        maxW="27.5rem"
        mx={4}
        color="white"
      >
        {chainId && (
          
          <Flex
            bg="red.500"
            borderRadius="50%"
            p="1rem"
            justify="center"
            align="center"
            color="white"
          >
            
            <WalletFilledIcon boxSize="1.75rem" />
          </Flex>
        )}
        
        <Text fontSize="2xl" textAlign="center" fontFamily="heading">
          {heading || 'Invoice Not Found'}
        </Text>
        {chainId && (
          
          <Text color="greyText">
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            Please switch to <b>{getNetworkName(chainId)}</b> to view this
            invoice.
          </Text>
        )}

        
        <Button
          colorScheme="red"
          px={12}
          onClick={() => router.push('/')}
          fontFamily="mono"
          fontWeight="normal"
        >
          Return Home
        </Button>
      </VStack>
    </Container>
  );
}
