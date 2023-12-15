// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React from 'react';

import {
  Divider,
  HStack,
  Heading,
  IconButton,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

// @ts-expect-error TS(6142): Module '../icons/ArrowIcons' was resolved to '/Use... Remove this comment to see the full error message
import { BackArrowIcon } from '../icons/ArrowIcons';

export function StepInfo({ stepNum, stepTitle, stepDetails, goBack }: any) {
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
      // @ts-expect-error TS(7026): JSX element implicitly has type 'any'
      because no i... Remove this comment to see the full error message
      <br />
      {stepDetails.map((detail: any, index: any) => (
        <Text color="grey" fontSize="sm" key={index.toString()}>
          {detail}
        </Text>
      ))}
    </VStack>
  );
}
