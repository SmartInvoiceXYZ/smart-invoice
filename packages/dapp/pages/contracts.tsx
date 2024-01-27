import {
  Heading,
  Link,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { CONFIG } from '@smart-invoice/constants';
import { useFetchTokens } from '@smart-invoice/hooks';
import { Container } from '@smart-invoice/ui';
import {
  chainsMap,
  getAccountString,
  getAddressLink,
  getInvoiceFactoryAddress,
  getKeys,
  getTokens,
  getTokenSymbol,
} from '@smart-invoice/utils';
import _ from 'lodash';
import React from 'react';

const { NETWORK_CONFIG } = CONFIG;
const chainIds = getKeys(NETWORK_CONFIG);

function Contracts() {
  const isSmallScreen = useBreakpointValue({ base: true, md: false });
  const { data } = useFetchTokens();
  const { tokenData, allTokens } = _.pick(data, ['tokenData', 'allTokens']);

  if (!tokenData || !allTokens) {
    return (
      <Container>
        <Text>Contract Information Loading</Text>
        <br />

        <Spinner />
      </Container>
    );
  }

  return (
    <Container overlay>
      <Stack minH="800px" my={10}>
        <Heading textTransform="uppercase" textAlign="center" color="blue.500">
          Contracts
        </Heading>

        <Tabs>
          <TabList>
            {_.map(chainIds, chainId => (
              <Tab key={chainId}>{chainsMap(chainId)?.name}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {_.map(chainIds, chainId => {
              const INVOICE_FACTORY = getInvoiceFactoryAddress(chainId) || '0x';
              const TOKENS = getTokens(allTokens, chainId);

              return (
                <TabPanel>
                  <Stack spacing={1}>
                    <Text textAlign="center">
                      INVOICE FACTORY:{' '}
                      <Link
                        href={getAddressLink(chainId, INVOICE_FACTORY)}
                        isExternal
                        fontWeight={600}
                        color="blue.500"
                      >
                        {isSmallScreen
                          ? getAccountString(INVOICE_FACTORY)
                          : INVOICE_FACTORY}
                      </Link>
                    </Text>

                    {TOKENS?.map(token => {
                      return (
                        <Text textAlign="center" key={token}>
                          {`ERC20 TOKEN ${getTokenSymbol(chainId, token, tokenData)}: `}

                          <Link
                            href={getAddressLink(chainId, token)}
                            isExternal
                            fontWeight={600}
                            color="blue.500"
                          >
                            {isSmallScreen ? getAccountString(token) : token}
                          </Link>
                        </Text>
                      );
                    })}
                    <br />
                  </Stack>
                </TabPanel>
              );
            })}
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default Contracts;
