import { Heading, Link, Text, useBreakpointValue } from '@chakra-ui/react';
import React from 'react';

import { CONFIG } from '../config';
import { Container } from '../shared/Container';
import {
  getAccountString,
  getAddressLink,
  getInvoiceFactoryAddress,
  getTokenInfo,
  getTokens,
} from '../utils/helpers';

import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';

const { NETWORK_CONFIG } = CONFIG;
const networks = Object.keys(NETWORK_CONFIG);

export const Contracts = () => {
  const isSmallScreen = useBreakpointValue({ base: true, md: false });
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();
  // const [symbols, setSymbols] = useState([]);

  // useEffect(() => {
  //   const getSymbols = () => {
  //     let symbols = [];
  //     var promises = TOKENS.map((token) => {
  //       let symbol = (getTokenInfo(chainId, token, tokenData));
  //       return symbol
  //     })
  //     Promise.all(promises).then(details => {
  //       details.map(detail => {
  //         return symbols.push(detail.symbol)
  //       })
  //   })
  //     setSymbols(symbols);
  //   }
  //   getSymbols();
  // }, [TOKENS, chainId, tokenData]);
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
  } else {
    return 'loading';
  }
};
