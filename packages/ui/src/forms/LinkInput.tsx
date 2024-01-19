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
import { isValidLink, logDebug } from '@smart-invoice/utils';
import React, { useState } from 'react';

import { QuestionIcon } from '../icons/QuestionIcon';

type Required = 'required' | 'optional';

interface LinkInputProps extends ChakraProps {
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

export function LinkInput({
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
}: LinkInputProps) {
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
}
