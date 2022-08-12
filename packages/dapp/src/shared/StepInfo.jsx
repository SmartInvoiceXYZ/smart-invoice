import { Heading, Text, useBreakpointValue, VStack } from '@chakra-ui/react';
import React from 'react';

export const StepInfo = ({ stepNum, stepTitle, stepDetails }) => {
  const maxW = useBreakpointValue({ base: '30rem', lg: '20rem' });
  return (
    <VStack spacing="1rem" maxW={maxW} align="stretch">
      <Text color="#323C47">
        Step {stepNum}: {stepTitle}
      </Text>
      {stepDetails.map((detail, index) => {
        return (
          <Text color="grey" fontSize="sm" key={index.toString()}>
            {detail}
          </Text>
        );
      })}
    </VStack>
  );
};
