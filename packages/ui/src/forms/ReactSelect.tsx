import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  ChakraProps,
  FormLabel,
  HStack,
  Icon,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { Controller, UseFormReturn } from 'react-hook-form';
import Select from 'react-select';

type Required = 'required' | 'optional';

interface SelectProps extends ChakraProps {
  name: string;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  infoText?: string;
  tooltip?: string | JSX.Element;
  required?: Required;
  isDisabled?: boolean;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

export function ReactSelect({
  name,
  label,
  localForm,
  infoText,
  tooltip,
  required,
  isDisabled = false,
  defaultValue,
  ...props
}: React.PropsWithChildren<SelectProps>) {
  const { control } = localForm;
  return (
    <Stack w="100%" spacing="0.5rem" justify="space-between">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            {label && (
              <Stack w="100%" align="left" spacing={0}>
                <HStack align="center" spacing={4}>
                  <FormLabel m={0}>{label}</FormLabel>

                  <HStack>
                    {infoText && <Text fontSize="xs">{infoText}</Text>}
                    {tooltip && (
                      <Tooltip label={tooltip} placement="right" hasArrow>
                        <Icon
                          as={InfoOutlineIcon}
                          boxSize={3}
                          color="blue.500"
                          bg="white"
                          borderRadius="full"
                        />
                      </Tooltip>
                    )}
                  </HStack>
                </HStack>
                <Text fontStyle="italic" fontSize="xs" marginLeft="5px">
                  {required}
                </Text>
              </Stack>
            )}

            <Select
              {...field}
              onChange={option => field.onChange(option?.value)}
              value={props.options.find(option => option.value === field.value)}
              defaultValue={props.options.find(
                option => option.value.toLowerCase() === defaultValue,
              )}
              bg="white"
              color="black"
              border="1px"
              borderColor="lightgrey"
              _hover={{ borderColor: 'lightgrey' }}
              isDisabled={isDisabled}
              {...props}
            />
          </>
        )}
      />
    </Stack>
  );
}
