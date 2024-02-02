import {
  ChakraProps,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { isValidLink, logDebug } from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect } from 'react';
import { RegisterOptions, UseFormReturn } from 'react-hook-form';

import { QuestionIcon } from '../icons/QuestionIcon';

interface LinkInputProps extends ChakraProps {
  name: string;
  label: string;
  linkType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  registerOptions?: RegisterOptions;
  infoText?: string;
  tooltip?: string;
  placeholder?: string;
}

const protocolOptions = ['https://', 'ipfs://'];

export function LinkInput({
  name,
  label,
  infoText,
  tooltip,
  placeholder,
  localForm,
  registerOptions,
  ...props
}: LinkInputProps) {
  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = localForm;

  const protocol = watch(`${name}-protocol`);
  const inputValue = watch(`${name}-input`);

  const error = errors?.[name];

  // handle the validation in the form resolver, just set the value here
  useEffect(() => {
    if (!inputValue) return;
    // update overall field value based on input change
    const newValue = protocol + inputValue;
    setValue(name, newValue, { shouldValidate: true, shouldDirty: true });
  }, [inputValue]);

  useEffect(() => {
    setValue(`${name}-protocol`, 'https://');
  }, []);

  return (
    <FormControl
      isInvalid={!!error}
      isRequired={_.includes(_.keys(registerOptions), 'required')}
    >
      <Stack w="100%" spacing="0.5rem" justify="space-between" {...props}>
        <Stack align="left" w="100%" spacing={0}>
          <Flex w="100%">
            <HStack align="center" spacing={1}>
              <FormLabel fontWeight="700" m={0}>
                {label}
              </FormLabel>
              {tooltip && (
                <Tooltip label={tooltip} placement="right" hasArrow>
                  <Icon as={QuestionIcon} boxSize={3} />
                </Tooltip>
              )}
            </HStack>

            <Flex>{infoText && <Text fontSize="xs">{infoText}</Text>}</Flex>
          </Flex>
        </Stack>

        <Flex direction="column" w="100%">
          <InputGroup>
            <InputLeftAddon
              px={0}
              w="6.75rem"
              overflow="hidden"
              borderLeftRadius="0.375rem"
              borderRightColor="background"
              borderRightWidth="3px"
              mr="-5px"
            >
              <Select
                onChange={e => {
                  setValue(`${name}-protocol`, e.target.value);
                  const newProtocol = e.target.value;
                  const newValue = newProtocol + inputValue;
                  // TODO check if link is valid
                  const isValid = isValidLink(newValue);
                  // handles resetting the field value
                  setValue(name, newValue);
                }}
                value={protocol}
                bg="none"
                color="black"
                border="1px"
                w="100%"
                borderColor="lightgrey"
                _hover={{ borderColor: 'lightgrey' }}
                fontWeight="normal"
                borderRadius="none"
              >
                {_.map(protocolOptions, option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </InputLeftAddon>

            <Input
              maxLength={240}
              placeholder={placeholder}
              {...register(`${name}-input`, registerOptions)}
              type="text"
            />
          </InputGroup>
          <FormErrorMessage>Invalid URL</FormErrorMessage>
        </Flex>
      </Stack>
    </FormControl>
  );
}
