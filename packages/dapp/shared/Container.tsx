import React from 'react';
import { Flex } from '@chakra-ui/react';

import { isBackdropFilterSupported } from '../utils/compatibilityHelpers';

export const Container = ({ children, overlay, ...props }: any) => {
  const overlayStyles = isBackdropFilterSupported()
    ? {
        backgroundColor: 'black30',
        backdropFilter: 'blur(8px)',
      }
    : {
        backgroundColor: 'black80',
      };
  return (
    <Flex
      justify="center"
      align="center"
      direction="column"
      w="calc(100% - 2rem)"
      h="100%"
      flex={1}
      m="1rem"
      css={overlay ? overlayStyles : {}}
      {...props}
    >
      {children}
    </Flex>
  );
};
