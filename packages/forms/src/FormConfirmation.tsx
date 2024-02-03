import {
  Button,
  Divider,
  Flex,
  Grid,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  ESCROW_STEPS,
  INVOICE_TYPES,
  LATE_FEE_INTERVAL_OPTIONS,
} from '@smart-invoice/constants';
import { useFetchTokens } from '@smart-invoice/hooks';
import { ValueOf } from '@smart-invoice/types';
import { AccountLink, useMediaStyles } from '@smart-invoice/ui';
import { getDateString, getTokenInfo } from '@smart-invoice/utils';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';

type FormConfirmationProps = {
  invoiceForm: UseFormReturn;
  handleSubmit: () => void;
  canSubmit: boolean;
  isLoading: boolean;
  type: ValueOf<typeof INVOICE_TYPES>;
};

export function FormConfirmation({
  invoiceForm,
  handleSubmit,
  canSubmit,
  isLoading,
  type,
}: FormConfirmationProps) {
  const chainId = useChainId();
  const { data } = useFetchTokens();
  const { tokenData } = _.pick(data, ['tokenData']);
  const { watch } = invoiceForm;
  const {
    projectName,
    projectDescription,
    projectAgreement,
    client,
    provider,
    startDate,
    endDate,
    safetyValveDate,
    resolver,
    customResolver,
    milestones,
    token,
    deadline,
    lateFee,
    lateFeeTimeInterval,
    paymentDue,
  } = watch();

  const lateFeeIntervalLabel = _.toLower(
    _.find(LATE_FEE_INTERVAL_OPTIONS, { value: lateFeeTimeInterval })?.label,
  );

  const initialPaymentDue = _.get(_.first(milestones), 'value');
  const { symbol } = getTokenInfo(chainId, token, tokenData);

  const { headingSize, primaryButtonSize, columnWidth } = useMediaStyles();

  const details = useMemo(() => {
    return _.compact([
      {
        label: 'Client Address',
        value: <AccountLink address={client} chainId={chainId} />,
      },
      {
        label: 'Payment Address',
        value: <AccountLink address={provider} chainId={chainId} />,
      },
      startDate && {
        label: 'Project Start Date:',
        value: <Text textAlign="right">{getDateString(startDate / 1000)}</Text>,
      },
      endDate && {
        label: 'Expected End Date:',
        value: <Text textAlign="right">{getDateString(endDate / 1000)}</Text>,
      },
      paymentDue && {
        label: 'Payment Due:',
        value: <Text textAlign="right">{`${paymentDue} ${symbol}`}</Text>,
      },
      type === INVOICE_TYPES.Escrow
        ? {
            label: 'Safety Valve Date:',
            value: (
              <Text textAlign="right">
                {getDateString(safetyValveDate / 1000)}
              </Text>
            ),
          }
        : {
            label: 'Deadline:',
            value: (
              <Text textAlign="right">{getDateString(deadline / 1000)}</Text>
            ),
          },
      lateFee &&
        lateFeeTimeInterval && {
          label: 'Late Fee:',
          value: (
            <Text textAlign="right">{`${lateFee} ${symbol} per ${lateFeeIntervalLabel}`}</Text>
          ),
        },
      // calculate payment due
      (customResolver || (resolver && resolver !== 'custom')) && {
        label: 'Arbitration Provider:',
        value: (
          <AccountLink address={customResolver || resolver} chainId={chainId} />
        ),
      },
    ]);
  }, [
    client,
    provider,
    startDate,
    endDate,
    safetyValveDate,
    resolver,
    paymentDue,
    lateFee,
    lateFeeTimeInterval,
    chainId,
  ]);

  return (
    <Stack w="100%" spacing="1rem" color="#323C47" align="center">
      <Heading id="project-title" size={headingSize}>
        {projectName}
      </Heading>

      {projectDescription && <Text align="center">{projectDescription}</Text>}

      {projectAgreement && (
        <Link
          href={projectAgreement.src || '#'}
          isExternal
          mb="1rem"
          textDecor="underline"
        >
          {projectAgreement.src}
        </Link>
      )}

      <Divider />

      {_.map(details, ({ label, value }) => (
        <Flex justify="space-between" width={columnWidth} key={label}>
          <Text>{label}</Text>
          {value}
        </Flex>
      ))}

      {milestones && (
        <>
          <Divider
            color="black"
            w="calc(100% + 2rem)"
            transform="translateX(-1rem)"
          />

          <Flex justify="flex-end">
            <Text>
              {`${_.size(milestones)} ${_.size(milestones) > 1 ? 'Payments' : 'Payment'} Total`}
            </Text>

            {initialPaymentDue && (
              <Text color="blue.1" ml="2.5rem" fontWeight="bold">
                {`${initialPaymentDue} ${symbol} Due Today`}
              </Text>
            )}
          </Flex>
        </>
      )}

      <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
        <Button
          onClick={handleSubmit}
          isDisabled={!canSubmit}
          isLoading={isLoading}
          textTransform="uppercase"
          size={primaryButtonSize}
          fontFamily="mono"
          fontWeight="bold"
        >
          Next: {ESCROW_STEPS[4].next}
        </Button>
      </Grid>
    </Stack>
  );
}
