import React, { useState } from 'react';

import {
  ChakraProps,
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

import { QuestionIcon } from '../icons/QuestionIcon';
import { isValidLink, logDebug } from '../utils/helpers';

type Required = 'required' | 'optional';

interface OrderedLinkInputProps extends ChakraProps {
  label: string;
  linkType?: string;
  // eslint-disable-next-line no-unused-vars
  setLinkType: (value: string) => void;
  value?: string;
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
  infoText?: string;
  tooltip?: string;
  placeholder?: string;
  type?: string;
  required?: Required;
}

export const OrderedLinkInput: React.FC<OrderedLinkInputProps> = ({
  label,
  linkType,
  setLinkType,
  value,
  setValue,
  infoText,
  tooltip,
  placeholder,
  type = 'text',
  required,
  ...props
}) => {
  const protocolInitValue = linkType ?? /[a-z]+(?=:\/\/)/.exec(value ?? '');
  const [protocol, setProtocol] = useState(`${protocolInitValue}://`);
  const [input, setInput] = useState('');
  const [isInvalid, setInvalid] = useState(false);

  return (
    <VStack w="100%" spacing="0.5rem" justify="space-between" {...props}>
      <VStack align="left" w="100%" spacing={0}>
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

        <Text fontStyle="italic" fontSize="xs" marginLeft="5px">
          {required}
        </Text>
      </VStack>

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
                logDebug(newProtocol.substring(0, newProtocol.length - 3));
                setInvalid(!isValid);
                setProtocol(newProtocol);
              }}
              value={protocol}
              bg="none"
              color="black"
              border="1px"
              borderColor="lightgrey"
              _hover={{ borderColor: 'lightgrey' }}
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
            borderColor="lightgrey"
            _hover={{ borderColor: 'lightgrey' }}
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

interface OrderedInputProps extends ChakraProps {
  label: string;
  value?: string | number | readonly string[];
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
  infoText?: string;
  tooltip?: string;
  placeholder?: string;
  required?: Required;
  isInvalid?: boolean;
  isDisabled?: boolean;
  type?: string;
  error?: string;
}

export const OrderedInput: React.FC<OrderedInputProps> = ({
  label,
  value,
  setValue,
  infoText,
  tooltip,
  placeholder,
  required,
  isInvalid = false,
  isDisabled = false,
  type = 'text',
  error = '',
  ...props
}) => (
  <VStack w="100%" spacing="0.5rem" justify="space-between" {...props}>
    <VStack align="left" w="100%" spacing={0}>
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

      <Text fontStyle="italic" fontSize="xs" marginLeft="5px">
        {required}
      </Text>
    </VStack>

    <Flex direction="column" w="100%">
      <Input
        bg="white"
        type={type}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        color="black"
        border="1px"
        borderColor="lightgrey"
        _hover={{ borderColor: 'lightgrey' }}
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

interface OrderedSelectProps extends ChakraProps {
  label: string;
  value?: string | number | readonly string[];
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
  infoText?: string;
  tooltip?: string;
  required?: Required;
  isDisabled?: boolean;
}

export const OrderedSelect: React.FC<
  React.PropsWithChildren<OrderedSelectProps>
> = ({
  label,
  value,
  setValue,
  infoText,
  tooltip,
  required,
  isDisabled = false,
  children,
  ...props
}) => (
  <VStack w="100%" spacing="0.5rem" justify="space-between" {...props}>
    <VStack w="100%" align="left" spacing={0}>
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

      <Text fontStyle="italic" fontSize="xs" marginLeft="5px">
        {required}
      </Text>
    </VStack>

    <Select
      value={value}
      onChange={e => {
        setValue(e.target.value);
      }}
      bg="white"
      color="black"
      border="1px"
      borderColor="lightgrey"
      _hover={{ borderColor: 'lightgrey' }}
      isDisabled={isDisabled}
    >
      {children}
    </Select>
  </VStack>
);

interface OrderedTextareaProps extends ChakraProps {
  label: string;
  value?: string | number | readonly string[];
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
  infoText?: string;
  tooltip?: string;
  placeholder?: string;
  maxLength?: number;
  required?: Required;
  isDisabled?: boolean;
}

export const OrderedTextarea: React.FC<OrderedTextareaProps> = ({
  label,
  value,
  setValue,
  infoText,
  tooltip,
  placeholder,
  maxLength,
  required,
  isDisabled = false,
  ...props
}) => (
  <VStack w="100%" spacing="0.5rem" {...props}>
    <Flex direction="column" w="100%">
      <Flex w="100%">
        <Text fontWeight="700" color="black">
          {label}
        </Text>
        {tooltip && (
          <Tooltip color="white" label={tooltip} placement="auto-start">
            <QuestionIcon ml=".25rem" boxSize="0.75rem" />
          </Tooltip>
        )}
      </Flex>

      <Flex color="#707683">
        {infoText && (
          <Text fontSize="xs">
            {infoText} {required && <Text as="i">• {required}</Text>}
          </Text>
        )}
        {required && !infoText && (
          <Text fontSize="xs" fontStyle="italic">
            {required}
          </Text>
        )}
      </Flex>
    </Flex>

    <Textarea
      bg="white"
      value={value}
      onChange={e => setValue(e.target.value)}
      placeholder={placeholder}
      color="black"
      border="1px"
      borderColor="lightgrey"
      _hover={{ borderColor: 'lightgrey' }}
      isDisabled={isDisabled}
      h="4rem"
      resize="none"
      maxLength={maxLength}
    />
  </VStack>
);
