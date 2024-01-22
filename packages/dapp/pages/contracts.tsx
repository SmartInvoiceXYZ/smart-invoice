import {
  Heading,
  Link,
  Spinner,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { CONFIG } from '@smart-invoice/constants';
import { useFetchTokens } from '@smart-invoice/hooks';
import { Container } from '@smart-invoice/ui';
import {
  getAccountString,
  getAddressLink,
  getInvoiceFactoryAddress,
  getKeys,
  getTokenInfo,
  getTokens,
} from '@smart-invoice/utils';
import _ from 'lodash';
import React from 'react';

const { NETWORK_CONFIG } = CONFIG;
const chainIds = getKeys(NETWORK_CONFIG);

function Contracts() {
  const isSmallScreen = useBreakpointValue({ base: true, md: false });
  const { data } = useFetchTokens();
  const { tokenData, allTokens } = _.pick(data, ['tokenData', 'allTokens']);

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
          const INVOICE_FACTORY = getInvoiceFactoryAddress(chainId) || '0x';
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

              {TOKENS?.map(token => (
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
      <Text>Contract Information Loading</Text>
      <br />

      <Spinner />
    </Container>
  );
}

export default Contracts;