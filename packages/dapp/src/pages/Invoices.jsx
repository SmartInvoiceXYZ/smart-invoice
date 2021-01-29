import {
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
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

const InvoiceStatusLabel = ({ invoice }) => {
  const { funded, label, loading } = useInvoiceStatus(invoice);
  return (
    <Text
      color={funded ? 'green' : 'red.500'}
      fontWeight="bold"
      textTransform="uppercase"
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
  return (
    <Container justify="flex-start" direction="row">
      <Flex
        direction="column"
        align="stretch"
        m={{ base: '1rem', md: '2rem' }}
        w="30rem"
        maxW="calc(100%-4rem)"
      >
        <Heading fontWeight="normal" mb="1rem">
          View Existing
        </Heading>
        <InputGroup>
          <Input
            type="text"
            value={search}
            placeholder="Search for Invoice"
            onChange={e => setSearch(e.target.value)}
          />
          <InputRightElement>
            {fetching ? <Loader size="20" /> : <SearchIcon boxSize="1.25rem" />}
          </InputRightElement>
        </InputGroup>

        <Flex direction="column" align="stretch" w="100%" mt="0.5rem">
          {result &&
            result.map(invoice => (
              // eslint-disable-next-line
              <Flex
                justify="space-between"
                align="center"
                borderBottom={`solid 1px ${theme.colors.borderGrey}`}
                onClick={() => history.push(`/invoice/${invoice.address}`)}
                key={invoice.address}
                p="0.5rem"
                height="3rem"
                cursor="pointer"
                transition="backgroundColor 0.25s"
                _hover={{
                  backgroundColor: 'white20',
                }}
              >
                <Text color="white"> {invoice.projectName} </Text>
                <InvoiceStatusLabel invoice={invoice} />
              </Flex>
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
