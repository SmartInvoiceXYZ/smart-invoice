import React, { useContext } from 'react';

import { Button, Flex, Text } from '@chakra-ui/react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

import { Loader } from '../components/Loader';
import { SUPPORTED_NETWORKS } from '../constants';
import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { getNetworkName } from '../utils/helpers';
import { Container } from './Container';

export function ConnectWeb3() {
  const { loading, account } = useWalletClient();
  const { openConnectModal } = useConnectModal();

  if (loading) {
    return (
      <Container>
        <Loader size="80" />
      </Container>
    );
  }

  const NETWORK_NAMES = SUPPORTED_NETWORKS.map(getNetworkName).join(' or ');
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
        {loading ? (
          <Text fontSize="2xl" fontFamily="heading" mb={4}>
            Connecting Wallet
          </Text>
        ) : (
          <>
            <Text fontSize="2xl" fontFamily="heading" mb={4}>
              {account ? `Network not supported` : 'Connect Wallet'}
            </Text>

            <Text color="greyText" mb={4} textAlign="center">
              {account
                ? `Please switch to ${NETWORK_NAMES}`
                : 'To get started, connect your wallet'}
            </Text>
          </>
        )}
        {!account && (
          <Button
            onClick={openConnectModal}
            backgroundColor="blue.1"
            _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            color="white"
            px={12}
            isLoading={loading}
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
