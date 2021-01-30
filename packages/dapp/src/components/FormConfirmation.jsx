import { Divider, Flex, Link, Text, VStack } from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';
import {
  getAccountString,
  getDateString,
  getResolverString,
  getAddressLink,
  getToken,
} from '../utils/helpers';

export const FormConfirmation = () => {
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
  const tokenData = getToken(paymentToken);
  const { decimals, symbol } = tokenData;
  return (
    <VStack w="100%" spacing="1rem" color="white" align="stretch">
      <Text id="project-title" fontWeight="bold" fontSize="xl">
        {projectName}
      </Text>
      {projectDescription && <Text>{projectDescription}</Text>}
      <Link href={projectAgreement} isExternal mb="1rem" textDecor="underline">
        {projectAgreement}
      </Link>
      <Flex justify="space-between">
        <Text>{`Client Address: `}</Text>
        <Text>{getAccountString(clientAddress)}</Text>
      </Flex>
      <Flex justify="space-between">
        <Text>{`Payment Address: `}</Text>
        <Text>{getAccountString(paymentAddress)}</Text>
      </Flex>
      {startDate && (
        <Flex justify="space-between">
          <Text>{`Project Start Date: `}</Text>
          <Text>{getDateString(startDate / 1000)}</Text>
        </Flex>
      )}
      {endDate && (
        <Flex justify="space-between">
          <Text>{`Expected End Date: `}</Text>
          <Text>{getDateString(endDate / 1000)}</Text>
        </Flex>
      )}
      <Flex justify="space-between">
        <Text>{`Safety Valve Date: `}</Text>
        <Text>{getDateString(safetyValveDate / 1000)}</Text>
      </Flex>
      <Flex justify="space-between">
        <Text>{`Arbitration Provider: `}</Text>
        <Link href={getAddressLink(arbitrationProvider)} isExternal>
          {getResolverString(arbitrationProvider)}
        </Link>
      </Flex>
      <Divider color="black" w="calc(100% + 2rem)" ml="-1rem" />
      <Flex justify="flex-end">
        <Text>{milestones} Payments</Text>
        <Text color="red.500" ml="2rem">
          {utils.formatUnits(paymentDue, decimals)} {symbol} Total
        </Text>
      </Flex>
    </VStack>
  );
};
