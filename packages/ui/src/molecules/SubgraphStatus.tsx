import {
  Box,
  Button,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  Tooltip,
  useClipboard,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import {
  chainByName,
  documentToHttp,
  getDateString,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { Address, isAddress, zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

import {
  AccountLink,
  CopyIcon,
  GenerateInvoicePDF,
  InvoiceBadge,
  NetworkBadge,
  QuestionIcon,
  ShareButton,
  VerifyInvoice,
} from '..';
import { ExternalLinkIcon } from '../icons';

export function InvoiceMetaDetails({
  invoice,
}: {
  invoice: Partial<InvoiceDetails>;
}) {
  const { address } = useAccount();

  const {
    id: invoiceId,
    metadata,
    terminationTime,
    deadline,
    client,
    clientReceiver,
    provider,
    providerReceiver,
    resolver,
    verified,
    invoiceType,
    resolverInfo,
  } = _.pick(invoice, [
    'id',
    'client',
    'clientReceiver',
    'provider',
    'providerReceiver',
    'resolver',
    'terminationTime',
    'deadline',
    'metadata',
    'verified',
    'invoiceType',
    'resolverInfo',
  ]);

  const { startDate, endDate, title, description, documents } = _.pick(
    metadata,
    ['startDate', 'endDate', 'title', 'description', 'documents'],
  );

  const invoiceChainId = chainByName(invoice?.network)?.id;
  const validClient = !!client && isAddress(client) ? client : undefined;
  const validProvider =
    !!provider && isAddress(provider) ? provider : undefined;
  const validResolver =
    !!resolver && isAddress(resolver) && resolver !== zeroAddress
      ? resolver
      : undefined;

  // display receivers if they are different from the client and provider
  const validClientReceiver =
    !!clientReceiver &&
    isAddress(clientReceiver) &&
    clientReceiver !== zeroAddress &&
    clientReceiver.toLowerCase() !== client?.toLowerCase()
      ? clientReceiver
      : undefined;
  const validProviderReceiver =
    !!providerReceiver &&
    isAddress(providerReceiver) &&
    providerReceiver !== zeroAddress &&
    providerReceiver.toLowerCase() !== provider?.toLowerCase()
      ? providerReceiver
      : undefined;

  const isClient = _.toLower(address) === client;

  const { onCopy } = useClipboard(_.toLower(invoiceId));

  const verifiedStatus = useMemo(
    () =>
      !_.isEmpty(verified) && !!_.find(verified, { client: invoice?.client }),
    [invoice],
  );

  const details = useMemo(
    () => [
      !!startDate &&
        _.toString(startDate) !== '0' && {
          label: 'Project Start Date:',
          value: getDateString(_.toNumber(_.toString(startDate))),
        },
      !!startDate &&
        _.toString(endDate) !== '0' && {
          label: 'Project End Date:',
          value: getDateString(_.toNumber(_.toString(endDate))),
        },
      !!terminationTime &&
        BigInt(terminationTime) !== BigInt(0) && {
          label: 'Safety Valve Withdrawal Date:',
          value: getDateString(_.toNumber(_.toString(terminationTime))),
          tip: `The Safety Valve gets activated on ${new Date(
            Number(terminationTime) * 1000,
          ).toUTCString()}`,
        },
      !!deadline && {
        label: 'Payment Deadline:',
        value: getDateString(_.toNumber(_.toString(deadline))),
        tip: `Late fees start accumulating after ${new Date(
          _.toNumber(deadline?.toString()) * 1000,
        ).toUTCString()} until total amount is paid.`,
      },
      validClient && {
        label: 'Client Account:',
        value: <AccountLink address={validClient} chainId={invoiceChainId} />,
      },
      validClientReceiver && {
        label: 'Client Receiver:',
        value: (
          <AccountLink address={validClientReceiver} chainId={invoiceChainId} />
        ),
      },
      validProvider && {
        label: 'Provider Account:',
        value: <AccountLink address={validProvider} chainId={invoiceChainId} />,
      },
      validProviderReceiver && {
        label: 'Provider Receiver:',
        value: (
          <AccountLink
            address={validProviderReceiver}
            chainId={invoiceChainId}
          />
        ),
      },
      validResolver && {
        label: 'Arbitration Provider:',
        value: (
          <AccountLink
            address={validResolver}
            chainId={invoiceChainId}
            resolverInfo={resolverInfo}
          />
        ),
      },
    ],
    [
      startDate,
      endDate,
      terminationTime,
      validClient,
      validClientReceiver,
      validProviderReceiver,
      validProvider,
      validResolver,
      invoiceChainId,
    ],
  );

  const lastDocument = _.findLast(documents);

  return (
    <Stack
      spacing="1rem"
      w="100%"
      maxW={{ base: '100%', lg: '25rem' }}
      justify="center"
      align="stretch"
      direction="column"
    >
      <Stack align="stretch" justify="center">
        {title && (
          <Stack direction="row" align="center" spacing={2}>
            <Heading color="black" fontSize="2xl">
              {title}
            </Heading>
            <ShareButton invoice={invoice} />
          </Stack>
        )}
        <Stack direction="row" align="center" spacing={2}>
          <InvoiceBadge invoiceType={invoiceType} />
          <Box w="0.25rem" h="0.25rem" bg="black" transform="rotate(45deg)" />
          <NetworkBadge chainId={invoiceChainId} />
        </Stack>

        <HStack align="center" spacing={4}>
          <AccountLink
            address={invoiceId as Address}
            chainId={invoiceChainId}
          />
          <Button
            onClick={onCopy}
            variant="ghost"
            bg="none"
            colorScheme="blue"
            h="auto"
            w="auto"
            minW="2"
            p={1}
          >
            <CopyIcon boxSize={3.5} />
          </Button>
        </HStack>
        {description && <Text>{description}</Text>}

        {!!lastDocument && (
          <Link href={documentToHttp(lastDocument)} isExternal _hover={{}}>
            <Button
              size="xs"
              textTransform="uppercase"
              rightIcon={<ExternalLinkIcon />}
            >
              View Details of Agreement
            </Button>
          </Link>
        )}
      </Stack>

      <Stack fontSize="sm" align="stretch" justify="center">
        {_.map(_.compact(details), ({ label, value, tip }) => (
          <Wrap key={label}>
            <WrapItem>
              <Text>{label}</Text>
            </WrapItem>

            <WrapItem>
              <HStack>
                {typeof value === 'string' ? (
                  <Text fontWeight="bold">{value}</Text>
                ) : (
                  value
                )}

                {tip && (
                  <Tooltip label={tip} placement="auto-start">
                    <QuestionIcon boxSize="0.75rem" color="gray" />
                  </Tooltip>
                )}
              </HStack>
            </WrapItem>
          </Wrap>
        ))}

        {invoiceType === INVOICE_TYPES.Escrow && (
          <Wrap>
            <WrapItem>
              <Text>{'Non-Client Deposits Enabled: '}</Text>
            </WrapItem>

            <WrapItem fontWeight="bold">
              {invoice && verifiedStatus ? (
                <Text color="green.500">Enabled!</Text>
              ) : (
                <Text color="red.500">Not enabled</Text>
              )}
            </WrapItem>

            <WrapItem fontWeight="bold">
              <VerifyInvoice
                invoice={invoice}
                isClient={isClient}
                verifiedStatus={verifiedStatus}
              />
            </WrapItem>
          </Wrap>
        )}

        <Wrap>
          <GenerateInvoicePDF
            invoice={invoice}
            buttonText="Preview & Download Invoice PDF"
          />
        </Wrap>
      </Stack>
    </Stack>
  );
}
