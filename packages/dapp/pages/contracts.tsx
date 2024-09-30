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
import { NETWORK_CONFIG } from '@smartinvoicexyz/constants';
import { useFetchTokens } from '@smartinvoicexyz/hooks';
import { IToken } from '@smartinvoicexyz/types';
import { Container } from '@smartinvoicexyz/ui';
import {
  chainsMap,
  getAccountString,
  getAddressLink,
  getInvoiceFactoryAddress,
  getKeys,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import React from 'react';

const chainIds = getKeys(NETWORK_CONFIG);

function Contracts() {
  const isSmallScreen = useBreakpointValue({ base: true, md: false });
  const { data: tokens } = useFetchTokens();

  if (!tokens) {
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
              const TOKENS: IToken[] = _.filter(
                tokens,
                // eslint-disable-next-line eqeqeq
                (token: IToken) => token.chainId == chainId,
              );
              return (
                <TabPanel key={chainId}>
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
                        <Text
                          textAlign="center"
                          key={token.chainId.toString() + token.address}
                        >
                          {token.symbol}
                          {': '}

                          <Link
                            href={getAddressLink(chainId, token.address)}
                            isExternal
                            fontWeight={600}
                            color="blue.500"
                          >
                            {isSmallScreen
                              ? getAccountString(token.address)
                              : token.address}
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
