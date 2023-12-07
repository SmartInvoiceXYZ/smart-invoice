// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React, { useContext } from 'react';

// @ts-expect-error TS(2792): Cannot find module '@chakra-ui/react'. Did you mea... Remove this comment to see the full error message
import { Button, Flex, Text } from '@chakra-ui/react';
// @ts-expect-error TS(2792): Cannot find module '@rainbow-me/rainbowkit'. Did y... Remove this comment to see the full error message
import { useConnectModal } from '@rainbow-me/rainbowkit';

// @ts-expect-error TS(6142): Module '../components/Loader' was resolved to '/Us... Remove this comment to see the full error message
import { Loader } from '../components/Loader';
// @ts-expect-error TS(2792): Cannot find module '../constants'. Did you mean to... Remove this comment to see the full error message
import { SUPPORTED_NETWORKS } from '../constants';
// @ts-expect-error TS(6142): Module '../context/Web3Context' was resolved to '/... Remove this comment to see the full error message
import { Web3Context } from '../context/Web3Context';
// @ts-expect-error TS(6142): Module '../icons/WalletFilledIcon' was resolved to... Remove this comment to see the full error message
import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { getNetworkName } from '../utils/helpers';
// @ts-expect-error TS(6142): Module './Container' was resolved to '/Users/moc/d... Remove this comment to see the full error message
import { Container } from './Container';

export function ConnectWeb3() {
  const { loading, account } = useContext(Web3Context);
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
