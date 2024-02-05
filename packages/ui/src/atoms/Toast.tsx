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
  [key in AlertStatus]: { bg: string };
} = {
  success: { bg: 'green.500' },
  error: { bg: 'red.500' },
  info: { bg: 'blue.500' },
  warning: { bg: 'blue.500' },
  loading: { bg: 'blue.500' },
};

export function Toast({
  title,
  description,
  status = 'success',
  // icon,
  // iconName,
  // iconColor,
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
      minW="350px"
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
            boxSize="20px"
            _hover={{ cursor: 'pointer' }}
          />
        </Flex>
      )}
    </Flex>
  );
}
