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
  InputLeftElement,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { isValidLink, logDebug } from '@smart-invoice/utils';
import { RegisterOptions, UseFormReturn } from 'react-hook-form';

import { QuestionIcon } from '../icons/QuestionIcon';

// type Required = 'required' | 'optional';

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
  const protocol = watch('protocol');

  const inputValue = watch(name);
  // const protocolInitValue = linkType ?? /[a-z]+(?=:\/\/)/.exec(value ?? '');
  // const [protocol, setProtocol] = useState(`${protocolInitValue}://`);
  // const [input, setInput] = useState('');
  // const [isInvalid, setInvalid] = useState(false);

  // useEffect(() => {
  //   const protocolInitValue = /[a-z]+(?=:\/\/)/.exec(value ?? '');
  //   const localProtocol = `${protocolInitValue}://`;
  //   setValue('protocol', localProtocol);

  // }, [inputValue])
  const error = errors?.[name];

  return (
    <FormControl isInvalid={!!error}>
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
            <InputLeftElement
              w="6.75rem"
              overflow="hidden"
              borderLeftRadius="0.375rem"
              borderRightColor="background"
              borderRightWidth="3px"
            >
              <Select
                onChange={e => {
                  setValue(`${name}-protocol`, e.target.value);
                  const newProtocol = e.target.value;
                  const newValue = newProtocol + inputValue;
                  const isValid = isValidLink(newValue);
                  setValue(name, newValue);
                  // setLinkType(newProtocol.substring(0, newProtocol.length - 3));
                  // logDebug(newProtocol.substring(0, newProtocol.length - 3));
                  // setInvalid(!isValid);
                  // setProtocol(newProtocol);
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
