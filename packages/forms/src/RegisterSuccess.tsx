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
import { ChakraNextLink, CopyIcon } from '@smartinvoicexyz/ui';
import { getTxLink } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { Address, useChainId } from 'wagmi';

export function RegisterSuccess({
  invoiceId,
  txHash,
}: {
  invoiceId: Address;
  txHash: Address;
}) {
  const chainId = useChainId();

  const chainHex = chainId.toString(16);

  const { onCopy: copyId } = useClipboard(_.toLower(invoiceId));
  const { onCopy: copyLink } = useClipboard(
    `${window.location.origin}/invoice/${chainHex}/${invoiceId}`,
  );

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
              href={`/invoice/${chainHex}/${invoiceId}
                  }`}
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
          <HStack bgColor="gray.50" p={3} borderRadius={4} overflow="clip">
            <Link
              ml="0.5rem"
              href={`/invoice/${chainHex}/${invoiceId}`}
              color="charcoal"
              overflow="clip"
            >
              {_.truncate(
                `${window.location.origin}/invoice/${chainHex}/${invoiceId}`,
                {
                  length: 60,
                  omission: '...',
                },
              )}
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
        <ChakraNextLink href={`/invoice/${chainHex}/${invoiceId}`}>
          <Button size="lg" fontWeight="medium">
            View Invoice
          </Button>
        </ChakraNextLink>
      </HStack>
    </Stack>
  );
}
