import { Flex, FlexProps } from '@chakra-ui/react';
import { isBackdropFilterSupported } from '@smart-invoice/utils';
import React from 'react';

interface ContainerProps extends FlexProps {
  overlay?: boolean;
}

export function Container({ children, overlay, ...props }: ContainerProps) {
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
}
