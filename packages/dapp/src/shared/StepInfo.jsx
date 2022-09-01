import {
  Heading,
  Text,
  useBreakpointValue,
  VStack,
  Divider,
} from '@chakra-ui/react';
import React from 'react';

export const StepInfo = ({ stepNum, stepTitle, stepDetails }) => {
  const maxW = useBreakpointValue({ base: '100%' });

  const stepSize = useBreakpointValue({
    base: 'md',
    sm: 'lg',
    md: 'xl',
    lg: 'xl',
  });
  return (
    <VStack spacing="1rem" maxW={maxW} align="stretch">
      <Heading color="#323C47" size={stepSize} align="center">
        Step {stepNum}: {stepTitle}
      </Heading>

      <Divider width="100%" />
      <br />

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
