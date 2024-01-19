import {
  ChakraProps,
  Flex,
  FormLabel,
  Select as ChakraSelect,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
// import { isValidLink, logDebug } from '@smart-invoice/utils';
import { Controller, UseFormReturn } from 'react-hook-form';

import { QuestionIcon } from '../icons/QuestionIcon';

type Required = 'required' | 'optional';

interface SelectProps extends ChakraProps {
  name: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  infoText?: string;
  tooltip?: string;
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
    <VStack w="100%" spacing="0.5rem" justify="space-between" {...props}>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <>
            <VStack w="100%" align="left" spacing={0}>
              <Flex w="100%">
                <FormLabel fontWeight="700">{label}</FormLabel>

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

            <ChakraSelect
              value={value}
              onChange={onChange}
              bg="white"
              color="black"
              border="1px"
              borderColor="lightgrey"
              _hover={{ borderColor: 'lightgrey' }}
              isDisabled={isDisabled}
            >
              {children}
            </ChakraSelect>
          </>
        )}
      />
    </VStack>
  );
}
