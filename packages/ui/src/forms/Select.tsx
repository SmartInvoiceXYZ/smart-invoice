import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  ChakraProps,
  FormLabel,
  HStack,
  Icon,
  Select as ChakraSelect,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { Controller, UseFormReturn } from 'react-hook-form';

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
}

export function Select({
  name,
  label,
  localForm,
  infoText,
  tooltip,
  required,
  isDisabled = false,
  children,
  ...props
}: React.PropsWithChildren<SelectProps>) {
  const { control } = localForm;

  return (
    <Stack w="100%" spacing="0.5rem" justify="space-between">
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
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

            <ChakraSelect
              value={value}
              onChange={onChange}
              bg="white"
              color="black"
              border="1px"
              borderColor="lightgrey"
              _hover={{ borderColor: 'lightgrey' }}
              isDisabled={isDisabled}
              {...props}
            >
              {children}
            </ChakraSelect>
          </>
        )}
      />
    </Stack>
  );
}
