import {
  Divider,
  Flex,
  Heading,
  Icon,
  IconButton,
  Spacer,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { ESCROW_STEPS } from '@smart-invoice/constants';
import { hashCode } from '@smart-invoice/utils';
import React from 'react';

import { BackArrowIcon } from '../icons/ArrowIcons';

export function StepInfo({
  stepNum,
  stepsDetails,
  goBack,
}: {
  stepNum: number;
  stepsDetails: typeof ESCROW_STEPS;
  goBack: () => void;
}) {
  const maxW = useBreakpointValue({ base: '100%' });

  const headingSize = useBreakpointValue({
    base: 'md',
    sm: 'lg',
    md: 'xl',
    lg: 'xl',
  });
  const stepTitle = stepsDetails[stepNum].step_title;
  const stepDetails = stepsDetails[stepNum].step_details;

  return (
    <VStack spacing="1rem" maxW={maxW} align="stretch">
      <Flex justify="space-between" my={4}>
        {stepNum !== 1 ? (
          <IconButton
            icon={
              <Icon
                as={BackArrowIcon}
                color="white"
                width="33px"
                height="24px"
              />
            }
            variant="ghost"
            bg="gray.200"
            onClick={() => goBack()}
            cursor="pointer"
            aria-label="back"
          />
        ) : (
          <Spacer maxW="50px" />
        )}

        <Heading color="#323C47" size={headingSize}>
          Step {stepNum}: {stepTitle}
        </Heading>

        <Spacer maxW="50px" />
      </Flex>
      <Divider width="100%" background="lightgrey" />
      <br />
      {stepDetails.map((detail: string) => (
        <Text color="grey" fontSize="sm" key={hashCode(detail)}>
          {detail}
        </Text>
      ))}
    </VStack>
  );
}
