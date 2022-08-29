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
import React, { useState } from 'react';

import { QuestionIcon } from '../icons/QuestionIcon';
import { isValidLink } from '../utils/helpers';

export const OrderedLinkInput = ({
  label,
  linkType,
  setLinkType,
  value,
  setValue,
  infoText,
  tooltip,
  placeholder,
  type = 'text',
  ...props
}) => {
  const [protocol, setProtocol] = useState(`${linkType}://`);
  const [input, setInput] = useState('');
  const [isInvalid, setInvalid] = useState(false);

  return (
    <VStack w="100%" spacing="0.5rem" justify="space-between" {...props}>
      <Flex w="100%">
        <Text fontWeight="700">{label}</Text>
        <Flex>
          {infoText && <Text fontSize="xs">{infoText}</Text>}
          {tooltip && (
            <Tooltip label={tooltip} placement="auto-start">
              <QuestionIcon ml=".25rem" boxSize="0.75rem" />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      <Flex direction="column" w="100%">
        <InputGroup>
          <InputLeftElement
            w="6.75rem"
            overflow="hidden"
            borderLeftRadius="0.375rem"
            borderRightColor="background"
            borderRightWidth="3px"
          >
            <Select
              onChange={e => {
                const newProtocol = e.target.value;
                const newValue = newProtocol + input;
                const isValid = isValidLink(newValue);
                setValue(newValue);
                setLinkType(newProtocol.substring(0, newProtocol.length - 3));
                console.log(newProtocol.substring(0, newProtocol.length - 3));
                setInvalid(!isValid);
                setProtocol(newProtocol);
              }}
              value={protocol}
              bg="none"
              color="black"
              border="1px"
              fontWeight="normal"
              borderRadius="none"
            >
              <option value="https://">https://</option>
              <option value="ipfs://">ipfs://</option>
            </Select>
          </InputLeftElement>
          <Input
            pl="7.25rem"
            bg="white"
            type={type}
            value={input}
            maxLength={240}
            onChange={e => {
              let newInput = e.target.value;
              let newProtocol = protocol;
              if (newInput.startsWith('https://') && newInput.length > 8) {
                newProtocol = 'https://';
                newInput = newInput.slice(8);
              } else if (
                newInput.startsWith('ipfs://') &&
                newInput.length > 7
              ) {
                newProtocol = 'ipfs://';
                newInput = newInput.slice(7);
              }
              const newValue = newProtocol + newInput;
              const isValid = isValidLink(newValue);
              setValue(newValue);
              setLinkType(newProtocol.substring(0, newProtocol.length - 3));
              setInvalid(!isValid);
              setInput(newInput);
              setProtocol(newProtocol);
            }}
            placeholder={placeholder}
            color="black"
            border="1px"
            isInvalid={isInvalid}
            _invalid={{ border: '1px solid', borderColor: 'red' }}
          />
        </InputGroup>
        {isInvalid && (
          <Text
            w="100%"
            color="red"
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
      <Flex w="100%">
        <Text fontWeight="700">{label}</Text>
        <Flex>
          {infoText && (
            <Text ml=".25rem" fontSize="xs">
              {infoText}
            </Text>
          )}
          {tooltip && (
            <Tooltip label={tooltip} placement="auto-start">
              <QuestionIcon ml=".25rem" boxSize="0.75rem" />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      <Flex direction="column" w="100%">
        <Input
          bg="white"
          type={type}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          color="black"
          border="1px"
          isDisabled={isDisabled}
          isInvalid={isInvalid}
          _invalid={{ border: '1px solid', borderColor: 'red' }}
        />
        {error && (
          <Text
            w="100%"
            color="red"
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
      <Flex w="100%">
        <Text fontWeight="700">{label}</Text>
        <Flex>
          {infoText && (
            <Text ml=".25rem" fontSize="xs">
              {infoText}
            </Text>
          )}
          {tooltip && (
            <Tooltip label={tooltip} placement="auto-start">
              <QuestionIcon ml=".25rem" boxSize="0.75rem" />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      <Select
        value={value}
        onChange={e => {
          setValue(e.target.value);
        }}
        bg="white"
        color="black"
        border="1px"
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
    <VStack w="100%" spacing="0.5rem" justify="space-between" color="#707683">
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
        bg="white"
        type={type}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        color="black"
        border="1px"
        isDisabled={isDisabled}
        h="4rem"
        resize="none"
        maxLength={maxLength}
      />
    </VStack>
  );
};
