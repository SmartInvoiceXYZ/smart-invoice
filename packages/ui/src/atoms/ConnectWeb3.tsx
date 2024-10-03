import { Button, Flex, Text } from '@chakra-ui/react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { SUPPORTED_CHAINS } from '@smartinvoicexyz/constants';
import { useIsClient } from '@smartinvoicexyz/hooks';
import _ from 'lodash';
import { useAccount } from 'wagmi';

import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { Container } from './Container';
import { Loader } from './Loader';

export function ConnectWeb3() {
  const { openConnectModal } = useConnectModal();
  const { isConnected, isConnecting } = useAccount();
  const isClient = useIsClient();

  if (!isClient || isConnecting) {
    return (
      <Container>
        <Loader size="80" />
      </Container>
    );
  }

  return (
    <Container>
      <Flex
        background="white"
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

        {isClient && isConnected ? (
          <>
            <Text fontSize="2xl" fontFamily="heading" mb={4}>
              Connect Wallet
            </Text>
            <Text color="greyText" mb={4} textAlign="center">
              {`Please switch to ${_.map(
                SUPPORTED_CHAINS,
                chain => chain.name,
              ).join(' or ')}`}
            </Text>
          </>
        ) : (
          <Text
            fontSize="xl"
            fontFamily="heading"
            mb={4}
            maxW={200}
            textAlign="center"
          >
            To get started, connect your wallet
          </Text>
        )}

        {isClient && !isConnected && (
          <Button onClick={openConnectModal} px={12} isLoading={isConnecting}>
            Connect Wallet
          </Button>
        )}
      </Flex>
    </Container>
  );
}
