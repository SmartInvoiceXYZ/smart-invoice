import React from 'react';

import {
  Center,
  Divider,
  HStack,
  Heading,
  IconButton,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { BackArrowIcon } from '../icons/ArrowIcons';
import { hashCode } from '../utils';

export function StepInfo({ stepNum, stepTitle, stepDetails, goBack }: {stepNum: number, stepTitle: string, stepDetails: any[], goBack: () => void}) {
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
            zIndex={5} aria-label='back'          />
        )}
<Center>
        <Heading
          position="relative"
          color="#323C47"
          size={stepSize}
          textAlign="center"
          width="100%"
        >
          Step {stepNum}: {stepTitle}
        </Heading>
        </Center>
      </HStack>
      <Divider width="100%" background="lightgrey" />
      <br />
      {stepDetails.map((detail) => (
        <Text color="grey" fontSize="sm" key={hashCode(detail)}>
          {detail}
        </Text>
      ))}
    </VStack>
  );
}
