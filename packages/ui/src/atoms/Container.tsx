import { Flex, FlexProps } from '@chakra-ui/react';
import { isBackdropFilterSupported } from '@smartinvoicexyz/utils';
import { useEffect, useState } from 'react';

interface ContainerProps extends FlexProps {
  overlay?: boolean;
}

type OverlayStyles = {
  backgroundColor: string;
  backdropFilter?: string;
};

export function Container({ children, overlay, ...props }: ContainerProps) {
  const [overlayStyles, setOverlayStyles] = useState<OverlayStyles>({
    backgroundColor: 'blackAlpha.800',
  });

  useEffect(() => {
    if (isBackdropFilterSupported()) {
      setOverlayStyles({
        backgroundColor: 'blackAlpha.300',
        backdropFilter: 'blur(8px)',
      });
    } else {
      setOverlayStyles({
        backgroundColor: 'blackAlpha.800',
      });
    }
  }, []);

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
