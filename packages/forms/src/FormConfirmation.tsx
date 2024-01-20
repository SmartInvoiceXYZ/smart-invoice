import {
  Divider,
  Flex,
  Heading,
  Link,
  Spacer,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useFetchTokens } from '@smart-invoice/hooks';
import { AccountLink } from '@smart-invoice/ui';
import { getDateString, getTokenInfo } from '@smart-invoice/utils';
import _ from 'lodash';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { formatUnits } from 'viem';
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
  const { data } = useFetchTokens();
  const { tokenData } = _.pick(data, ['tokenData']);
  const { watch } = escrowForm;
  const {
    projectName,
    projectDescription,
    projectAgreement,
    clientAddress,
    paymentAddress,
    startDate,
    endDate,
    safetyValveDate,
    arbitrationProvider,
    milestones,
    paymentDue,
    token,
  } = watch();

  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);

  const flexWidth = useBreakpointValue({
    base: '95%',
    sm: '95%',
    md: '80%',
    lg: '70%',
  });

  return (
    <Stack w="100%" spacing="1rem" color="#323C47">
      <Heading id="project-title">{projectName}</Heading>

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

      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Client Address: `}</Text>

        <Spacer />

        <AccountLink address={clientAddress} chainId={chainId} />
      </Flex>

      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Payment Address: `}</Text>

        <AccountLink address={paymentAddress} chainId={chainId} />
      </Flex>
      {startDate && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Project Start Date: `}</Text>

          <Text textAlign="right">{getDateString(startDate / 1000)}</Text>
        </Flex>
      )}
      {endDate && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Expected End Date: `}</Text>

          <Text textAlign="right">{getDateString(endDate / 1000)}</Text>
        </Flex>
      )}

      {safetyValveDate && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Safety Valve Date: `}</Text>

          <Text textAlign="right">{getDateString(safetyValveDate / 1000)}</Text>
        </Flex>
      )}

      {arbitrationProvider && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Arbitration Provider: `}</Text>

          <AccountLink address={arbitrationProvider} chainId={chainId} />
        </Flex>
      )}

      {milestones && !!paymentDue && (
        <>
          <Divider
            color="black"
            w="calc(100% + 2rem)"
            transform="translateX(-1rem)"
          />

          <Flex justify="flex-end">
            <Text>
              {`${milestones} ${milestones > 1 ? 'Payments' : 'Payment'}`}
            </Text>

            <Text color="blue.1" ml="2.5rem" fontWeight="bold">
              {`${formatUnits(paymentDue, decimals)} ${symbol} Total`}
            </Text>
          </Flex>
        </>
      )}
    </Stack>
  );
}
