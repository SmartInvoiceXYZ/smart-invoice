import {
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import React, { useContext, useEffect } from 'react';
import { withRouter } from 'react-router-dom';

import { Loader } from '../components/Loader';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus';
import { SearchIcon } from '../icons/SearchIcon';
import { Container } from '../shared/Container';
import { theme } from '../theme';
import { getHexChainId } from '../utils/helpers';

const InvoiceStatusLabel = ({ invoice }) => {
  const { funded, label, loading } = useInvoiceStatus(invoice);
  return (
    <Text
      color={funded ? 'green' : 'red.500'}
      fontWeight="bold"
      textTransform="uppercase"
      textAlign="right"
    >
      {loading ? <Loader size="20" /> : label}
    </Text>
  );
};

const InvoicesInner = ({ history }) => {
  const { search, setSearch, result, fetching } = useContext(SearchContext);
  const { account } = useContext(Web3Context);

  useEffect(() => {
    if (account) {
      setSearch(account);
    }
  }, [account, setSearch]);
  const fontSize = useBreakpointValue({ base: 'md', sm: 'lg', md: 'xl' });
  return (
    <Container justify={{ base: 'center', md: 'flex-start' }} direction="row">
      <Flex
        direction="column"
        align="stretch"
        m={{ base: '1rem', md: '2rem' }}
        w={{ base: '30rem', md: '35rem' }}
        maxW="calc(100%-4rem)"
        fontSize={{ base: 'md', sm: 'lg', lg: 'xl' }}
      >
        <Heading fontWeight="normal" mb="1rem">
          View Existing
        </Heading>
        <InputGroup size="lg">
          <Input
            type="text"
            fontSize={fontSize}
            value={search}
            placeholder="Search for Invoice"
            onChange={e => setSearch(e.target.value)}
            borderColor="red.500"
          />
          <InputRightElement>
            {fetching ? (
              <Loader size="20" />
            ) : (
              <SearchIcon boxSize={{ base: '1.25rem', md: '1.5rem' }} />
            )}
          </InputRightElement>
        </InputGroup>

        <Flex direction="column" align="stretch" w="100%" mt="0.5rem">
          {result &&
            result.map(invoice => (
              <Button
                borderRadius="0"
                variant="ghost"
                size="lg"
                borderBottom={`solid 1px ${theme.colors.borderGrey}`}
                onClick={() =>
                  history.push(
                    `/invoice/${getHexChainId(invoice.network)}/${
                      invoice.address
                    }`,
                  )
                }
                key={invoice.address}
                _hover={{
                  bgColor: 'white20',
                }}
                _active={{
                  bgColor: 'white20',
                }}
              >
                <Flex
                  fontSize={fontSize}
                  display="flex"
                  justify="space-between"
                  align="center"
                  w="100%"
                >
                  <Text color="white"> {invoice.projectName} </Text>
                  <InvoiceStatusLabel invoice={invoice} />
                </Flex>
              </Button>
            ))}
          {!fetching && result && result.length === 0 && (
            <Flex
              justify="space-between"
              align="center"
              p="0.5rem"
              borderBottom="solid 1px #505050"
            >
              <Text color="white"> No invoices found </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Container>
  );
};

const InvoicesWithProvider = props => (
  <SearchContextProvider>
    <InvoicesInner {...props} />
  </SearchContextProvider>
);

export const Invoices = withRouter(InvoicesWithProvider);
