import {
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { memo, useState } from 'react';

import { QuestionIcon } from '../icons/QuestionIcon';
import { isValidURL } from '../utils/helpers';

const InnerOrderedLinkInput = ({
  label,
  value,
  setValue,
  infoText,
  tooltip,
  placeholder,
  type = 'text',
  ...props
}) => {
  const [protocol, setProtocol] = useState('https://');
  const [isInvalid, setInvalid] = useState(false);
  const [input, setInput] = useState('');

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
        <InputGroup>
          <InputLeftElement
            w="6.5rem"
            overflow="hidden"
            borderLeftRadius="0.375rem"
            borderRightColor="background"
            borderRightWidth="3px"
          >
            <Select
              onChange={e => setProtocol(e.target.value)}
              value={protocol}
              bg="none"
              color="white"
              border="none"
              fontWeight="bold"
              borderRadius="none"
            >
              <option value="https://">https://</option>
              <option value="ipfs://">ipfs://</option>
            </Select>
          </InputLeftElement>
          <Input
            pl="7rem"
            bg="black"
            type={type}
            value={input}
            onChange={e => {
              const newInput = e.target.value;
              let newValue = protocol + newInput;
              if (newInput.startsWith('https://') && newInput.length > 8) {
                setProtocol('https://');
                setInput(newInput.slice(8));
                newValue = `https://${newInput.slice(8)}`;
              } else if (
                newInput.startsWith('http://') &&
                newInput.length > 7
              ) {
                setProtocol('https://');
                setInput(newInput.slice(7));
                newValue = `https://${newInput.slice(7)}`;
              } else if (
                newInput.startsWith('ipfs://') &&
                newInput.length > 7
              ) {
                setProtocol('ipfs://');
                setInput(newInput.slice(7));
                newValue = `ipfs://${newInput.slice(7)}`;
              } else {
                setInput(newInput);
              }
              setValue(newValue);
              setInvalid(!isValidURL(newValue));
            }}
            placeholder={placeholder}
            color="white"
            border="none"
            isInvalid={isInvalid}
            _invalid={{ border: '1px solid', borderColor: 'purple' }}
          />
        </InputGroup>
        {isInvalid && (
          <Text
            w="100%"
            color="purple"
            textAlign="right"
            fontSize="xs"
            fontWeight="700"
            mt="0.5rem"
          >
            Invalid URL
          </Text>
        )}
      </Flex>
    </VStack>
  );
};

const InnerOrderedInput = ({
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

const InnerOrderedSelect = ({
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

const InnerOrderedTextarea = ({
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

export const OrderedInput = memo(InnerOrderedInput);
export const OrderedLinkInput = memo(InnerOrderedLinkInput);
export const OrderedSelect = memo(InnerOrderedSelect);
export const OrderedTextarea = memo(InnerOrderedTextarea);
