import { Divider, Flex, Link, Text, VStack } from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';
import { AccountLink } from '../shared/AccountLink';
import { getDateString, getToken } from '../utils/helpers';

export const FormConfirmation = ({ display }) => {
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
    <VStack
      w="100%"
      spacing="1rem"
      color="white"
      align="stretch"
      display={display}
    >
      <Text id="project-title" fontWeight="bold" fontSize="xl">
        {projectName}
      </Text>
      {projectDescription && <Text>{projectDescription}</Text>}
      <Link href={projectAgreement} isExternal mb="1rem" textDecor="underline">
        {projectAgreement}
      </Link>
      <Flex justify="space-between">
        <Text>{`Client Address: `}</Text>
        <AccountLink address={clientAddress} />
      </Flex>
      <Flex justify="space-between">
        <Text>{`Payment Address: `}</Text>
        <AccountLink address={paymentAddress} />
      </Flex>
      {startDate && (
        <Flex justify="space-between">
          <Text>{`Project Start Date: `}</Text>
          <Text textAlign="right">{getDateString(startDate / 1000)}</Text>
        </Flex>
      )}
      {endDate && (
        <Flex justify="space-between">
          <Text>{`Expected End Date: `}</Text>
          <Text textAlign="right">{getDateString(endDate / 1000)}</Text>
        </Flex>
      )}
      <Flex justify="space-between">
        <Text>{`Safety Valve Date: `}</Text>
        <Text textAlign="right">{getDateString(safetyValveDate / 1000)}</Text>
      </Flex>
      <Flex justify="space-between">
        <Text>{`Arbitration Provider: `}</Text>
        <AccountLink address={arbitrationProvider} />
      </Flex>
      <Divider
        color="black"
        w="calc(100% + 2rem)"
        transform="translateX(-1rem)"
      />
      <Flex justify="flex-end">
        <Text>{milestones} Payments</Text>
        <Text color="red.500" ml="2rem" fontWeight="bold">
          {utils.formatUnits(paymentDue, decimals)} {symbol} Total
        </Text>
      </Flex>
    </VStack>
  );
};
