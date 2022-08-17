import {
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useBreakpointValue,
  Grid,
  IconButton,
  GridItem,
} from '@chakra-ui/react';
import React, { useContext, useEffect } from 'react';
import { withRouter } from 'react-router-dom';

import { Loader } from '../components/Loader';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus';
import { Container } from '../shared/Container';
import { DragHandleIcon } from '@chakra-ui/icons';
import { VerticalDotsIcon } from '../icons/VerticalDots';
import { theme } from '../theme';
import {
  getHexChainId,
  getTokenSymbol,
  dateTimeToDate,
} from '../utils/helpers';
import { unixToDateTime } from '../utils/invoice';
import { formatEther } from 'ethers/lib/utils';
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';

const InvoiceStatusLabel = ({ invoice }) => {
  const { funded, label, loading } = useInvoiceStatus(invoice);
  const { isLocked, terminationTime } = invoice;
  const terminated = terminationTime > Date.now();

  return (
    <Flex
      // backgroundColor={funded ? 'green' : 'orange'}
      backgroundColor={
        terminated ? 'gray' : isLocked ? 'red' : funded ? 'green' : 'orange'
      }
      padding="6px"
      borderRadius="10"
      minWidth="155px"
    >
      <Text
        color="white"
        fontWeight="bold"
        textTransform="uppercase"
        textAlign="right"
        fontSize="15px"
      >
        {loading ? <Loader size="20" /> : label}
      </Text>
    </Flex>
  );
};

const responsiveText = text => {
  return (
    <svg viewBox="0 0 56 18">
      <text x="0" y="15">
        {text}
      </text>
    </svg>
  );
};

const InvoicesInner = ({ history }) => {
  const { search, setSearch, result, fetching } = useContext(SearchContext);
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const { account, chainId } = useContext(Web3Context);

  useEffect(() => {
    if (account) {
      setSearch(account);
    }
  }, [account, setSearch]);
  // const fontSize = useBreakpointValue({ base: 'md', sm: 'lg', md: 'xl' });
  const testColor = useBreakpointValue({
    base: 'red',
    sm: 'pink',
    md: 'green',
    lg: 'yellow',
  });
  const templateColumnWidth = useBreakpointValue({
    base: 'repeat(5, minmax(0, 1fr))',
    sm: 'repeat(5, 1fr)',
    md: 'repeat(5, 1fr)',
    lg: 'repeat(5, minmax(0, 1fr))',
  });
  return (
    <Container justify="center" direction="row">
      <Flex
        direction="column"
        align="stretch"
        mx={{ base: '1rem', md: '2rem' }}
        w={{ base: '55rem', md: '55rem' }}
        maxW="calc(100%-4rem)"
        fontSize={{ base: 'md', sm: 'lg', lg: 'xl' }}
        // mt="6rem"
        mb="4rem"
      >
        <Heading fontWeight="bold" mb="1rem">
          My Invoices
        </Heading>
        {/* <InputGroup size="lg">
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
        </InputGroup> */}

        <Flex
          direction="column"
          align="stretch"
          w="100%"
          mt="0.5rem"
          maxH="30rem"
          overflowY="auto"
        >
          {result &&
            result.map((invoice, index) => (
              <Flex key={invoice.address}>
                <Grid
                  templateColumns="repeat(15, 1fr)"
                  mt="4px"
                  minH="3rem"
                  width="100%"
                >
                  <GridItem colSpan={14}>
                    <Button
                      borderTopLeftRadius="10"
                      borderBottomLeftRadius="10"
                      borderTopRightRadius="0"
                      borderBottomRightRadius="0"
                      variant="ghost"
                      size="lg"
                      backgroundColor="white"
                      boxShadow="sm"
                      onClick={() =>
                        history.push(
                          `/invoice/${getHexChainId(invoice.network)}/${
                            invoice.address
                          }`,
                        )
                      }
                      _hover={{
                        bgColor: 'white',
                        border: '1px',
                        borderColor: 'gray.200',
                      }}
                      _active={{
                        bgColor: 'white20',
                      }}
                      px={{ base: '0.5rem', md: '1rem' }}
                    >
                      <Grid
                        templateColumns={templateColumnWidth}
                        gap={1}
                        backgroundColor={testColor}
                        width="100%"
                      >
                        <Text
                          borderRight="1px"
                          borderColor="gray.100"
                          color="#323C47"
                          textAlign="left"
                        >
                          {' '}
                          {dateTimeToDate(
                            unixToDateTime(invoice.createdAt),
                          )}{' '}
                        </Text>
                        <Text color="#323C47" textAlign="left">
                          {' '}
                          {invoice.projectName}{' '}
                        </Text>
                        <Text color="#323C47" textAlign="right">
                          {' '}
                          {formatEther(invoice.total)}{' '}
                        </Text>
                        <Text color="#323C47" textAlign="left">
                          {' '}
                          {getTokenSymbol(
                            invoice.token,
                            chainId,
                            tokenData,
                          )}{' '}
                        </Text>
                        <InvoiceStatusLabel invoice={invoice} />
                      </Grid>
                    </Button>
                  </GridItem>

                  <IconButton
                    backgroundColor="white"
                    size="lg"
                    borderTopLeftRadius="0"
                    borderBottomLeftRadius="0"
                    borderTopRightRadius="10"
                    borderBottomRightRadius="10"
                    _hover={{
                      bgColor: 'white',
                      border: '1px',
                      borderColor: 'gray.200',
                    }}
                    _active={{
                      bgColor: 'white20',
                    }}
                    icon={<VerticalDotsIcon />}
                  />
                </Grid>
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

{
  /* <Grid templateColumns='repeat(5, 1fr)' gap={6}>
<Text color="#323C47" textAlign='left'>Date Created</Text>
<Text color="#323C47" textAlign='left'>Project Name</Text>
<Text color="#323C47" textAlign='right'>Amount</Text>
<Text color="#323C47" textAlign='left'>Currency</Text>     
<Text color="#323C47"> Status </Text>      
</Grid> */
}
