// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React from 'react';

// @ts-expect-error TS(2792): Cannot find module '@chakra-ui/react'. Did you mea... Remove this comment to see the full error message
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
