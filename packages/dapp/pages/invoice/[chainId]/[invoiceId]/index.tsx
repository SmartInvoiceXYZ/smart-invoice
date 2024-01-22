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
import {
  InvoiceButtonManager,
  InvoicePaymentDetails,
} from '@smart-invoice/forms';
import { useInvoiceDetails } from '@smart-invoice/hooks';
import {
  AccountLink,
  Container,
  CopyIcon,
  GenerateInvoicePDF,
  InvoiceNotFound,
  Loader,
  QuestionIcon,
  VerifyInvoice,
} from '@smart-invoice/ui';
import {
  getAccountString,
  getAddressLink,
  getAgreementLink,
  getDateString,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { isAddress } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import { useOverlay } from '../../../../contexts/OverlayContext';

function ViewInvoice() {
  const chainId = useChainId();
  const { address } = useAccount();
  const { modals, setModals } = useOverlay();
  const router = useRouter();
  const { invoiceId: invId, chainId: hexChainId } = router.query;
  const invoiceId = String(invId) as `0x${string}`;
  const invoiceChainId = hexChainId
    ? parseInt(String(hexChainId), 16)
    : undefined;

  const { onCopy } = useClipboard(_.toLower(invoiceId));
  const { data: invoice } = useInvoiceDetails({ chainId, address: invoiceId });

  const verifiedStatus = useMemo(
    () =>
      !_.isEmpty(invoice?.verified) &&
      !!_.find(invoice?.verified, { client: invoice?.client }),
    [invoice],
  );

  const leftMinW = useBreakpointValue({ base: '10rem', sm: '20rem' });
  const leftMaxW = useBreakpointValue({ base: '30rem', lg: '22rem' });
  // const rightMaxW = useBreakpointValue({ base: '100%', md: '40rem' });
  // const buttonSize = useBreakpointValue({ base: 'md', lg: 'lg' });
  // const smallScreen = useBreakpointValue({ base: true, sm: false });

  if (!isAddress(invoiceId) || invoice === null) {
    return <InvoiceNotFound />;
  }

  if (invoice && chainId !== invoiceChainId) {
    return (
      <InvoiceNotFound chainId={invoiceChainId} heading="Incorrect Network" />
    );
  }

  if (!invoice) {
    return (
      <Container overlay>
        <Loader size="80" />
      </Container>
    );
  }

  const {
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
  const validClient = client && isAddress(client) && client;
  const validProvider = provider && isAddress(provider) && provider;
  const validResolver = resolver && isAddress(resolver) && resolver;

  const isClient = address === client;

  console.log(
    startDate,
    endDate,
    endDate && _.toNumber(endDate.toString()),
    endDate && getDateString(new Date(endDate?.toString()).getTime()),
    terminationTime,
    invoiceChainId,
  );

  return (
    <Container overlay>
      <Stack
        spacing="2rem"
        justify="center"
        align="center"
        direction={{ base: 'column', lg: 'row' }}
        w="100%"
        px="1rem"
        py="8rem"
      >
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
            <Heading fontWeight="normal" fontSize="2xl">
              {projectName}
            </Heading>

            <HStack align="center" color="black" spacing={4}>
              <Link
                href={getAddressLink(invoiceChainId, invoiceId.toLowerCase())}
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
            {projectDescription && (
              <Text color="black">{projectDescription}</Text>
            )}

            <Link
              href={getAgreementLink(projectAgreement)}
              isExternal
              textDecor="underline"
              color="black"
            >
              Details of Agreement
            </Link>
          </Stack>

          <Stack fontSize="sm" color="grey" align="stretch" justify="center">
            {!!startDate && startDate !== BigInt(0) && (
              <Wrap>
                <WrapItem>
                  <Text>{'Project Start Date: '}</Text>
                </WrapItem>

                <WrapItem>
                  <Text fontWeight="bold">
                    {getDateString(_.toNumber(startDate.toString()))}
                  </Text>
                </WrapItem>
              </Wrap>
            )}
            {!!endDate && endDate !== BigInt(0) && (
              <Wrap>
                <WrapItem>
                  <Text>{'Project End Date: '}</Text>
                </WrapItem>

                <WrapItem>
                  <Text fontWeight="bold">
                    {getDateString(_.toNumber(endDate.toString()))}
                  </Text>
                </WrapItem>
              </Wrap>
            )}

            <Wrap>
              <WrapItem>
                <Text>{'Safety Valve Withdrawal Date: '}</Text>
              </WrapItem>

              <WrapItem>
                <Text fontWeight="bold">
                  {getDateString(_.toNumber(terminationTime.toString()))}
                </Text>

                <Tooltip
                  label={`The Safety Valve gets activated on ${new Date(
                    Number(terminationTime) * 1000,
                  ).toUTCString()}`}
                  placement="auto-start"
                >
                  <QuestionIcon ml="1rem" boxSize="0.75rem" color="gray" />
                </Tooltip>
              </WrapItem>
            </Wrap>

            <Wrap>
              <WrapItem>
                <Text>{'Client Account: '}</Text>
              </WrapItem>

              <WrapItem fontWeight="bold">
                {validClient ? (
                  <AccountLink address={validClient} chainId={invoiceChainId} />
                ) : (
                  client
                )}
              </WrapItem>
            </Wrap>

            <Wrap>
              <WrapItem>
                <Text>{'Provider Account: '}</Text>
              </WrapItem>

              <WrapItem fontWeight="bold">
                {validProvider ? (
                  <AccountLink
                    address={validProvider}
                    chainId={invoiceChainId}
                  />
                ) : (
                  provider
                )}
              </WrapItem>
            </Wrap>

            <Wrap>
              <WrapItem>
                <Text>{'Arbitration Provider: '}</Text>
              </WrapItem>

              <WrapItem fontWeight="bold">
                {validResolver ? (
                  <AccountLink
                    address={validResolver}
                    chainId={invoiceChainId}
                  />
                ) : (
                  resolver
                )}
              </WrapItem>
            </Wrap>

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

        <Stack minW={{ base: '90%', md: '50%' }}>
          <InvoicePaymentDetails invoice={invoice} />
          <InvoiceButtonManager
            invoice={invoice}
            modals={modals}
            setModals={setModals}
          />
        </Stack>
      </Stack>
    </Container>
  );
}

export default ViewInvoice;
