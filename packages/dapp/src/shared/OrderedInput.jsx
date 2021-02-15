import {
  Flex,
  Input,
  Select,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React from 'react';

import { QuestionIcon } from '../icons/QuestionIcon';

export const OrderedInput = ({
  label,
  value,
  setValue,
  infoText,
  tooltip,
  placeholder,
  isInvalid = false,
  isDisabled = false,
  type = 'text',
  error = '',
  ...props
}) => {
  return (
    <VStack w="100%" spacing="0.5rem" justify="space-between" {...props}>
      <Flex justify="space-between" w="100%">
        <Text fontWeight="700">{label}</Text>
        <Flex>
          {infoText && <Text fontSize="xs">{infoText}</Text>}
          {tooltip && (
            <Tooltip label={tooltip} placement="auto-start">
              <QuestionIcon ml="1rem" boxSize="0.75rem" />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      <Flex direction="column" w="100%">
        <Input
          bg="black"
          type={type}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          color="white"
          border="none"
          isDisabled={isDisabled}
          isInvalid={isInvalid}
          _invalid={{ border: '1px solid', borderColor: 'purple' }}
        />
        {error && (
          <Text
            w="100%"
            color="purple"
            textAlign="right"
            fontSize="xs"
            fontWeight="700"
            mt="0.5rem"
          >
            {error}
          </Text>
        )}
      </Flex>
    </VStack>
  );
};

export const OrderedSelect = ({
  label,
  value,
  setValue,
  infoText,
  tooltip,
  isDisabled = false,
  children,
}) => {
  return (
    <VStack w="100%" spacing="0.5rem" justify="space-between">
      <Flex justify="space-between" w="100%">
        <Text fontWeight="700">{label}</Text>
        <Flex>
          {infoText && <Text fontSize="xs">{infoText}</Text>}
          {tooltip && (
            <Tooltip label={tooltip} placement="auto-start">
              <QuestionIcon ml="1rem" boxSize="0.75rem" />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      <Select
        value={value}
        onChange={e => {
          setValue(e.target.value);
        }}
        bg="black"
        color="white"
        border="none"
        isDisabled={isDisabled}
      >
        {children}
      </Select>
    </VStack>
  );
};

export const OrderedTextarea = ({
  label,
  value,
  setValue,
  infoText,
  tooltip,
  placeholder,
  maxLength,
  isDisabled = false,
  type = 'text',
}) => {
  return (
    <VStack w="100%" spacing="0.5rem" justify="space-between" color="red.500">
      <Flex justify="space-between" w="100%">
        <Text fontWeight="700">{label}</Text>
        <Flex>
          {infoText && <Text fontSize="xs">{infoText}</Text>}
          {tooltip && (
            <Tooltip label={tooltip} placement="auto-start">
              <QuestionIcon ml="1rem" boxSize="0.75rem" />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      <Textarea
        bg="black"
        type={type}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        color="white"
        border="none"
        isDisabled={isDisabled}
        h="4rem"
        resize="none"
        maxLength={maxLength}
      />
    </VStack>
  );
};
