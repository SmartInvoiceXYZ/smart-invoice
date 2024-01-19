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
import { hashCode } from '@smart-invoice/utils';

import { BackArrowIcon } from '../icons/ArrowIcons';

export function StepInfo({
  stepNum,
  stepsDetails,
  goBack,
}: {
  stepNum: number;
  stepsDetails: any;
  goBack: () => void;
}) {
  const maxW = useBreakpointValue({ base: '100%' });

  const stepSize = useBreakpointValue({
    base: 'md',
    sm: 'lg',
    md: 'xl',
    lg: 'xl',
  });
  const stepTitle = stepsDetails[stepNum].step_title;
  const stepDetails = stepsDetails[stepNum].step_details;

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
            aria-label="back"
          />
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
      {stepDetails.map((detail: any) => (
        <Text color="grey" fontSize="sm" key={hashCode(detail)}>
          {detail}
        </Text>
      ))}
    </VStack>
  );
}
