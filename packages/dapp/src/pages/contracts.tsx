// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React from 'react';

/* eslint-disable react/no-unescaped-entities */
import {
  Heading,
  Link,
  Spinner,
  Text,
  useBreakpointValue
} from '@chakra-ui/react';

// @ts-expect-error TS(2792): Cannot find module '../constants'. Did you mean to... Remove this comment to see the full error message
import { CONFIG } from '../constants';
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';
// @ts-expect-error TS(6142): Module '../shared/Container' was resolved to '/Use... Remove this comment to see the full error message
import { Container } from '../shared/Container';
import {
  getAccountString,
  getAddressLink,
  getInvoiceFactoryAddress,
  getTokenInfo,
  getTokens,
} from '../utils/helpers';

const { NETWORK_CONFIG } = CONFIG;
const networks = Object.keys(NETWORK_CONFIG);

function Contracts() {
  const isSmallScreen = useBreakpointValue({ base: true, md: false });
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();

  if (tokenData && allTokens) {
    return (
      
      <Container overlay color="white">
        
        <Heading
          fontWeight="normal"
          mb="1rem"
          mx="1rem"
          textTransform="uppercase"
          textAlign="center"
          color="red.500"
        >
          Contracts
        </Heading>

        {networks.map(chainId => {
          const INVOICE_FACTORY = getInvoiceFactoryAddress(chainId);

          const TOKENS = getTokens(chainId, allTokens);

          
          return <>
            
            <Text textAlign="center">NETWORK CHAIN ID: {chainId}</Text>
            
            <Text textAlign="center">
              INVOICE FACTORY:{' '}
              
              <Link
                href={getAddressLink(chainId, INVOICE_FACTORY)}
                isExternal
                color="red.500"
              >
                {isSmallScreen
                  ? getAccountString(INVOICE_FACTORY)
                  : INVOICE_FACTORY}
              </Link>
            </Text>
            
            {TOKENS.map((token: any) => <Text textAlign="center" key={token}>
              {`ERC20 TOKEN ${
                getTokenInfo(chainId, token, tokenData).symbol
              }: `}
              
              <Link
                href={getAddressLink(chainId, token)}
                isExternal
                color="red.500"
              >
                {isSmallScreen ? getAccountString(token) : token}
              </Link>
            </Text>)}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <br />
          </>;
        })}
      </Container>
    );
  }
  return (
    
    <Container>
      
      <Text>'Contract Information Loading'</Text>
      // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
      <br />
      
      <Spinner />
    </Container>
  );
}

export default Contracts;
