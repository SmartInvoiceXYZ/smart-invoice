import {
  Button,
  Divider,
  Flex,
  Grid,
  Heading,
  Link,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ESCROW_STEPS } from '@smart-invoice/constants/src';
import { useFetchTokens, useInvoiceCreate } from '@smart-invoice/hooks';
import { AccountLink, useToast } from '@smart-invoice/ui';
import { getDateString, getTokenInfo } from '@smart-invoice/utils';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';

// type FormConfirmationProps = {
//   tokenData: Record<ChainId, Record<Address, TokenData>>;
// };

export function FormConfirmation({
  escrowForm,
}: {
  escrowForm: UseFormReturn;
}) {
  const chainId = useChainId();
  const toast = useToast();
  const { data } = useFetchTokens();
  const { tokenData } = _.pick(data, ['tokenData']);
  const { watch } = escrowForm;
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
  } = watch();

  const paymentDue = _.get(_.first(milestones), 'value');
  const { symbol } = getTokenInfo(chainId, token, tokenData);

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });
  const flexWidth = useBreakpointValue({
    base: '95%',
    sm: '95%',
    md: '80%',
    lg: '70%',
  });

  const { writeAsync } = useInvoiceCreate({
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
    toast,
  });

  const handleSubmit = async () => {
    await writeAsync?.();
  };

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
      safetyValveDate && {
        label: 'Safety Valve Date:',
        value: (
          <Text textAlign="right">{getDateString(safetyValveDate / 1000)}</Text>
        ),
      },
      resolver && {
        label: 'Arbitration Provider:',
        value: <AccountLink address={resolver} chainId={chainId} />,
      },
    ]);
  }, [
    client,
    provider,
    startDate,
    endDate,
    safetyValveDate,
    resolver,
    chainId,
  ]);

  return (
    <Stack w="100%" spacing="1rem" color="#323C47" align="center">
      <Heading id="project-title" size="md">
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
        <Flex justify="space-between" width={flexWidth}>
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

            {paymentDue && (
              <Text color="blue.1" ml="2.5rem" fontWeight="bold">
                {`${paymentDue} ${symbol} Due Today`}
              </Text>
            )}
          </Flex>
        </>
      )}

      <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
        <Button
          onClick={handleSubmit}
          isDisabled={!writeAsync}
          textTransform="uppercase"
          size={buttonSize}
          fontFamily="mono"
          fontWeight="bold"
        >
          Next: {ESCROW_STEPS[4].next}
        </Button>
      </Grid>
    </Stack>
  );
}
