import {
  Button,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
  useClipboard,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Invoice } from '@smart-invoice/graphql';
import {
  chainByName,
  getAccountString,
  getAddressLink,
  getAgreementLink,
  getDateString,
} from '@smart-invoice/utils';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { isAddress } from 'viem';
import { useAccount } from 'wagmi';

import {
  AccountLink,
  CopyIcon,
  GenerateInvoicePDF,
  QuestionIcon,
  VerifyInvoice,
} from '..';

export function InvoiceMetaDetails({ invoice }: { invoice: Invoice }) {
  const { address } = useAccount();

  const {
    id: invoiceId,
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    terminationTime,
    client,
    provider,
    resolver,
  } = _.pick(invoice, [
    'id',
    'client',
    'provider',
    'resolver',
    'terminationTime',
    'projectName',
    'projectDescription',
    'projectAgreement',
    'startDate',
    'endDate',
  ]);

  const invoiceChainId = chainByName(invoice?.network)?.id;
  const validClient = !!client && isAddress(client) ? client : undefined;
  const validProvider =
    !!provider && isAddress(provider) ? provider : undefined;
  const validResolver =
    !!resolver && isAddress(resolver) ? resolver : undefined;

  const isClient = address === client;

  const leftMinW = useBreakpointValue({ base: '10rem', sm: '20rem' });
  const leftMaxW = useBreakpointValue({ base: '30rem', lg: '22rem' });

  const { onCopy } = useClipboard(_.toLower(invoiceId));

  const verifiedStatus = useMemo(
    () =>
      !_.isEmpty(invoice?.verified) &&
      !!_.find(invoice?.verified, { client: invoice?.client }),
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
      {
        label: 'Safety Valve Withdrawal Date:',
        value: getDateString(_.toNumber(_.toString(terminationTime))),
        tip: `The Safety Valve gets activated on ${new Date(
          Number(terminationTime) * 1000,
        ).toUTCString()}`,
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
        value: <AccountLink address={validResolver} chainId={invoiceChainId} />,
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

  return (
    <Stack
      spacing="1rem"
      minW={leftMinW}
      w="100%"
      maxW={leftMaxW}
      justify="center"
      align="stretch"
      direction="column"
    >
      <Stack align="stretch" justify="center">
        {projectName && (
          <Heading fontWeight="normal" fontSize="2xl">
            {projectName}
          </Heading>
        )}

        <HStack align="center" color="black" spacing={4}>
          <Link
            href={getAddressLink(invoiceChainId, _.toLower(invoiceId))}
            isExternal
          >
            {getAccountString(invoiceId)}
          </Link>
          <Button
            onClick={onCopy}
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
        {projectDescription && <Text color="black">{projectDescription}</Text>}

        {!_.isEmpty(projectAgreement) && (
          <Link
            href={getAgreementLink(projectAgreement)}
            isExternal
            textDecor="underline"
            color="black"
          >
            Details of Agreement
          </Link>
        )}
      </Stack>

      <Stack fontSize="sm" color="grey" align="stretch" justify="center">
        {_.map(_.compact(details), ({ label, value, tip }) => (
          <Wrap>
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

        <Wrap>
          <WrapItem>
            <Text>{'Non-Client Deposits Enabled: '}</Text>
          </WrapItem>

          <WrapItem fontWeight="bold">
            {invoice && verifiedStatus ? (
              <Text color="green">Enabled!</Text>
            ) : (
              <Text color="red">Not enabled</Text>
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
