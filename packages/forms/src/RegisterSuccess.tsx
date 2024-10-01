import { CheckCircleIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  HStack,
  Icon,
  Link,
  Stack,
  Text,
  useClipboard,
} from '@chakra-ui/react';
import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import { ValueOf } from '@smartinvoicexyz/types';
import { ChakraNextLink, CopyIcon } from '@smartinvoicexyz/ui';
import { getTxLink } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { Address } from 'viem';
import { useChainId } from 'wagmi';

export function RegisterSuccess({
  invoiceId,
  txHash,
  type,
}: {
  invoiceId: Address;
  txHash: Address;
  type: ValueOf<typeof INVOICE_TYPES>;
}) {
  const chainId = useChainId();

  const chainHex = chainId.toString(16);

  const url = useMemo(() => {
    return `/invoice/${chainHex}/${invoiceId}${type === INVOICE_TYPES.Instant ? '/instant' : ''}`;
  }, [chainHex, invoiceId, type]);

  const { onCopy: copyId } = useClipboard(_.toLower(invoiceId));
  const { onCopy: copyLink } = useClipboard(`${window.location.origin}${url}`);

  return (
    <Stack w="100%" spacing="1rem" align="center" justify="center" px="1rem">
      <Icon as={CheckCircleIcon} w={28} h={28} color="blue.500" />

      <Text color="black" textAlign="center" fontSize="lg">
        You can view your transaction
        <Link
          href={getTxLink(chainId, txHash)}
          isExternal
          color="blue.500"
          ml={1}
          textDecoration="underline"
        >
          here
        </Link>
      </Text>

      <Stack w="100%" align="stretch">
        <Text fontWeight="bold">Your Invoice ID</Text>

        <Flex
          p="0.5rem"
          justify="space-between"
          align="center"
          bg="white"
          borderRadius="0.25rem"
          w="100%"
        >
          <HStack
            bgColor="gray.50"
            p={3}
            borderRadius={4}
            overflow="clip"
            w="full"
          >
            <Link
              ml="0.5rem"
              href={url}
              color="charcoal"
              overflow="clip"
              w="full"
            >
              {invoiceId}
            </Link>
            <Button
              onClick={copyId}
              variant="ghost"
              colorScheme="blue"
              h="auto"
              w="auto"
              minW="2"
              p={2}
            >
              <CopyIcon boxSize={4} />
            </Button>
          </HStack>
        </Flex>
      </Stack>

      <Stack w="100%" align="stretch" mb="1.5rem">
        <Text fontWeight="bold">Link to Invoice</Text>
        <Flex
          p="0.5rem"
          justify="space-between"
          align="center"
          bg="white"
          borderRadius="0.25rem"
          w="100%"
        >
          <HStack
            bgColor="gray.50"
            p={3}
            borderRadius={4}
            overflow="clip"
            w="100%"
          >
            <Link
              ml="0.5rem"
              href={url}
              color="charcoal"
              overflow="clip"
              w="100%"
            >
              {_.truncate(`${window.location.origin}${url}`, {
                length: 60,
                omission: '...',
              })}
            </Link>
            <Button
              ml={4}
              onClick={copyLink}
              variant="ghost"
              colorScheme="blue"
              h="auto"
              w="auto"
              minW="2"
              p={2}
            >
              <CopyIcon boxSize={4} />
            </Button>
          </HStack>
        </Flex>
      </Stack>
      <HStack>
        <ChakraNextLink href="/invoices">
          <Button size="lg" fontWeight="medium" variant="ghost">
            Return Home
          </Button>
        </ChakraNextLink>
        <ChakraNextLink href={url}>
          <Button size="lg" fontWeight="medium">
            View Invoice
          </Button>
        </ChakraNextLink>
      </HStack>
    </Stack>
  );
}
