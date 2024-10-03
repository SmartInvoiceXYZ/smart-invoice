import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
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
  QuestionIcon,
  VerifyInvoice,
} from '..';

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
    provider,
    resolver,
    verified,
    invoiceType,
    resolverInfo,
  } = _.pick(invoice, [
    'id',
    'client',
    'provider',
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
      validProvider && {
        label: 'Provider Account:',
        value: <AccountLink address={validProvider} chainId={invoiceChainId} />,
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
          <Heading fontWeight="normal" fontSize="2xl">
            {title}
          </Heading>
        )}

        <HStack align="center" color="black" spacing={4}>
          <InvoiceBadge invoiceType={invoiceType} />
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
            p={2}
          >
            <CopyIcon boxSize={3} />
          </Button>
        </HStack>
        {description && <Text color="black">{description}</Text>}

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

      <Stack fontSize="sm" color="grey" align="stretch" justify="center">
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
