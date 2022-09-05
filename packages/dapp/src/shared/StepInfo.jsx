import {
  Heading,
  Text,
  useBreakpointValue,
  VStack,
  Divider,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import React from 'react';
import { BackArrowIcon } from '../icons/ArrowIcons';

export const StepInfo = ({ stepNum, stepTitle, stepDetails, goBack }) => {
  const maxW = useBreakpointValue({ base: '100%' });

  const stepSize = useBreakpointValue({
    base: 'md',
    sm: 'lg',
    md: 'xl',
    lg: 'xl',
  });
  return (
    <VStack spacing="1rem" maxW={maxW} align="stretch">
      <HStack width="100%" align="center" paddingY={4}>
        {stepNum !== 1 && (
          <IconButton
            icon={<BackArrowIcon width="33px" height="24px" />}
            position="absolute"
            onClick={() => goBack()}
            cursor="pointer"
            zIndex={5}
          />
        )}
        <Heading
          position="relative"
          color="#323C47"
          size={stepSize}
          align="center"
          textAlign="center"
          width="100%"
        >
          Step {stepNum}: {stepTitle}
        </Heading>
      </HStack>

      <Divider width="100%" background="lightgrey" />
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
