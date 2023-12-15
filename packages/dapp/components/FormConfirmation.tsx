import React, { useContext } from 'react';
import { formatUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import {
  Divider,
  Flex,
  Link,
  Spacer,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { CreateContext } from '../context/CreateContext';
import { AccountLink } from '../shared/AccountLink';
import { getDateString, getTokenInfo } from '../utils/helpers';

export function FormConfirmation({ display, tokenData }: any) {
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
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
    paymentToken,
  } = useContext(CreateContext);

  const { decimals, symbol } = getTokenInfo(chainId, paymentToken, tokenData);

  const flexWidth = useBreakpointValue({
    base: '95%',
    sm: '95%',
    md: '80%',
    lg: '70%',
  });

  return (
    <VStack w="100%" spacing="1rem" color="#323C47" display={display}>
      <Text
        id="project-title"
        color="#323C47"
        fontWeight="bold"
        fontSize="xl"
        align="center"
      >
        {projectName}
      </Text>

      {projectDescription && <Text align="center">{projectDescription}</Text>}

      <Link
        href={projectAgreement.src || '#'}
        isExternal
        mb="1rem"
        textDecor="underline"
      >
        {projectAgreement.src}
      </Link>

      <Divider />

      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Client Address: `}</Text>

        <Spacer />

        <AccountLink address={clientAddress} chain={chainId} />
      </Flex>

      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Payment Address: `}</Text>

        <AccountLink address={paymentAddress} chain={chainId} />
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

          <AccountLink address={arbitrationProvider} chain={chainId} />
        </Flex>
      )}

      {milestones && paymentDue ? (
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
      ) : null}
    </VStack>
  );
}
