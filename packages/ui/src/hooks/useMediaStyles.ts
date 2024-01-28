import { useBreakpointValue } from '@chakra-ui/react';

export const useMediaStyles = () => {
  const headingSize = useBreakpointValue({
    base: '125%',
    sm: '175%',
    md: '225%',
    lg: '250%',
  });

  const primaryButtonSize = useBreakpointValue({
    base: 'sm',
    sm: 'md',
    md: 'lg',
  });

  return {
    headingSize,
    primaryButtonSize,
  };
};
