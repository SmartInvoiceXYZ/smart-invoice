import {
  Divider,
  Flex,
  Heading,
  Icon,
  IconButton,
  Spacer,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ESCROW_STEPS } from '@smartinvoicexyz/constants';
import { hashCode } from '@smartinvoicexyz/utils';

import { BackArrowIcon } from '../icons/ArrowIcons';

export function StepInfo({
  stepNum,
  stepsDetails,
  goBack,
}: {
  stepNum: number;
  stepsDetails: typeof ESCROW_STEPS;
  goBack: (() => void) | undefined;
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
    <Stack spacing="1rem" maxW={maxW} align="stretch">
      <Flex justify="space-between" my={4} align="center">
        {stepNum !== 1 && stepNum !== 5 && !!goBack ? (
          <IconButton
            icon={
              <Icon
                as={BackArrowIcon}
                color="white"
                width="2rem"
                height="1.5rem"
              />
            }
            variant="ghost"
            bg="gray.200"
            p={2}
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
    </Stack>
  );
}
