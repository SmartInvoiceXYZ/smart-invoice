import { Button, Flex, Text } from '@chakra-ui/react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { SUPPORTED_NETWORKS } from '@smart-invoice/constants';
import { chainsMap } from '@smart-invoice/utils/src';
import _ from 'lodash';
import React from 'react';
import { useAccount } from 'wagmi';

import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { Container } from './Container';
// import { Loader } from './Loader';

export function ConnectWeb3() {
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();

  // if (isLoading) {
  //   return (
  //     <Container>
  //       <Loader size="80" />
  //     </Container>
  //   );
  // }

  return (
    <Container>
      <Flex
        background="background"
        borderRadius="1rem"
        direction="column"
        align="center"
        w="calc(100% - 2rem)"
        p="2rem"
        maxW="27.5rem"
        mx={4}
      >
        <Flex
          bg="blue.1"
          borderRadius="50%"
          p="1rem"
          justify="center"
          align="center"
          color="white"
          mb={4}
        >
          <WalletFilledIcon boxSize="1.75rem" />
        </Flex>

        <Text fontSize="2xl" fontFamily="heading" mb={4}>
          {address ? `Network not supported` : 'Connect Wallet'}
        </Text>

        <Text color="greyText" mb={4} textAlign="center">
          {address
            ? `Please switch to ${_.map(
                SUPPORTED_NETWORKS,
                network => chainsMap(network)?.name,
              ).join(' or ')}`
            : 'To get started, connect your wallet'}
        </Text>

        {!address && (
          <Button
            onClick={openConnectModal}
            backgroundColor="blue.1"
            _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            color="white"
            px={12}
            // isLoading={isLoading}
            fontFamily="mono"
            fontWeight="normal"
          >
            Connect
          </Button>
        )}
      </Flex>
    </Container>
  );
}
