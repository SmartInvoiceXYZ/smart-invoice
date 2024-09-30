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
import { isValidURL, logDebug, PROTOCOL_OPTIONS } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useCallback, useEffect } from 'react';
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

const getPath = (url: string | undefined) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return url.slice(urlObj.protocol.length + 2);
  } catch {
    return '';
  }
};

const getProtocol = (url: string | undefined) => {
  if (!url) return 'https://';
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//`;
  } catch {
    return 'https://';
  }
};

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

  const localProtocol = watch(`${name}-protocol`);
  const localInput = watch(`${name}-input`);

  const error = errors?.[name];
  const finalValue = watch(name);

  const updateValidatedUrl = useCallback(
    (str: string) => {
      const url = new URL(str);
      const urlProtocol = url.protocol === 'http:' ? 'https://' : url.protocol;
      const parsedProtocol = `${urlProtocol}//`;
      setValue(`${name}-protocol`, parsedProtocol);
      setValue(name, str, { shouldValidate: true, shouldDirty: true });
      logDebug('LinkInput - validValue', str);
    },
    [name, setValue],
  );

  useEffect(() => {
    if (!localInput) return;

    if (isValidURL(localInput)) {
      updateValidatedUrl(localInput);
      return;
    }
    if (isValidURL(localProtocol + localInput)) {
      updateValidatedUrl(localProtocol + localInput);
      return;
    }

    setValue(name, localProtocol + localInput, {
      shouldValidate: true,
      shouldDirty: true,
    });
    logDebug('LinkInput - invalidValue', localProtocol + localInput);
  }, [localInput, localProtocol, updateValidatedUrl]);

  useEffect(() => {
    setValue(`${name}-protocol`, 'https://');
  }, [name, setValue]);

  return (
    <FormControl
      isInvalid={!!error}
      isRequired={_.includes(_.keys(registerOptions), 'required')}
    >
      <Stack w="100%" spacing="0.5rem" justify="space-between" {...props}>
        <Stack align="left" w="100%" spacing={0}>
          <Flex w="100%">
            <HStack align="center" spacing={1}>
              <FormLabel m={0}>{label}</FormLabel>
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
            <InputLeftAddon px={0}>
              <Select
                {...register(`${name}-protocol`, registerOptions)}
                defaultValue={getProtocol(finalValue)}
                color="black"
                border="0"
              >
                {_.map(PROTOCOL_OPTIONS, option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </InputLeftAddon>

            <Input
              {...register(`${name}-input`, registerOptions)}
              maxLength={240}
              placeholder={placeholder}
              type="text"
              defaultValue={getPath(finalValue)}
            />
          </InputGroup>
          <FormErrorMessage>Invalid URL</FormErrorMessage>
        </Flex>
      </Stack>
    </FormControl>
  );
}
