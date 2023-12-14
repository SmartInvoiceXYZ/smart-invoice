import React from 'react';

import {
  Heading,
  Link,
  Spinner,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';

import { CONFIG } from '../constants';
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';
import { Container } from '../shared/Container';
import { getKeys } from '../utils/getKeys';
import {
  getAccountString,
  getAddressLink,
  getInvoiceFactoryAddress,
  getTokenInfo,
  getTokens,
} from '../utils/helpers';

const { NETWORK_CONFIG } = CONFIG;
const chainIds = getKeys(NETWORK_CONFIG);

const Contracts: React.FC = () => {
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

        {chainIds.map(chainId => {
          const INVOICE_FACTORY = getInvoiceFactoryAddress(chainId);
          const TOKENS = getTokens(allTokens, chainId);

          return (
            <>
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

              {TOKENS.map(token => (
                <Text textAlign="center" key={token}>
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
                </Text>
              ))}
              <br />
            </>
          );
        })}
      </Container>
    );
  }
  return (
    <Container>
      <Text>'Contract Information Loading'</Text>
      <br />

      <Spinner />
    </Container>
  );
};

export default Contracts;
