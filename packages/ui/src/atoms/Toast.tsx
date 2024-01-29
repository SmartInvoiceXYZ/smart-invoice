import { CloseIcon } from '@chakra-ui/icons';
import {
  AlertStatus,
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import { ToastProps } from '@smart-invoice/types';
import React from 'react';

// const icons: {
//   [name: string]: { icon: IconType; color: ColorProps['color'] };
// } = {
//   crown: { icon: AiTwotoneCrown, color: 'red.500' },
//   warning: { icon: AiFillWarning, color: 'whiteAlpha.700' },
//   alert: { icon: AiFillAlert, color: 'whiteAlpha.800' },
//   bell: { icon: BsBellFill, color: 'blackAlpha.700' },
//   rocket: { icon: RiRocket2Fill, color: 'whiteAlpha.800' },
// };

const bgValues: {
  [key in AlertStatus]: {
    bg: string;
    bgImage: string;
    displayBorder: string;
  };
} = {
  success: {
    bg: 'gray.800',
    bgImage:
      'linear-gradient(95.58deg, #FF3864 0%, #8B1DBA 53.65%, #4353DF 100%)',
    displayBorder: 'block',
  },
  error: {
    bg: 'red.500',
    bgImage: '',
    displayBorder: 'none',
  },
  info: {
    bg: 'blue.500',
    bgImage: 'whiteAlpha.700',
    displayBorder: 'block',
  },
  warning: {
    bg: 'blue.500',
    bgImage: 'whiteAlpha.700',
    displayBorder: 'block',
  },
  loading: {
    bg: 'blue.500',
    bgImage: 'whiteAlpha.700',
    displayBorder: 'block',
  },
};

export function Toast({
  title,
  description,
  status = 'success',
  icon,
  iconName,
  iconColor,
  closeToast,
  descriptionNoOfLines,
  ...props
}: ToastProps) {
  return (
    <Flex
      bg={bgValues[status].bg}
      position="relative"
      borderRadius="15px"
      padding={4}
      color="white"
    >
      <HStack spacing={3}>
        {/* {iconName ? (
          <Icon
            as={icons[iconName].icon}
            color={iconColor || icons[iconName].color || 'whiteAlpha.800'}
            width="35px"
            height="35px"
          />
        ) : (
          icon && <Icon as={icon} width="35px" height="35px" />
        )} */}
        <Box>
          <Heading size="md">{title}</Heading>
          {description && (
            <Text size="sm" noOfLines={descriptionNoOfLines}>
              {description}
            </Text>
          )}
        </Box>
      </HStack>
      {props.isClosable === true && (
        <Flex
          marginLeft={8}
          onClick={closeToast}
          justifyContent="baseline"
          _hover={{ cursor: 'pointer' }}
        >
          <Icon
            as={CloseIcon}
            onClick={closeToast}
            w="25px"
            h="25px"
            _hover={{ cursor: 'pointer' }}
          />
        </Flex>
      )}

      <Box
        display={bgValues[status].displayBorder}
        top="-2px"
        left="-2px"
        width="104%"
        height="104%"
        bgImage={bgValues[status].bgImage}
        filter="blur(10px)"
        position="absolute"
        zIndex={-1}
      />
    </Flex>
  );
}
