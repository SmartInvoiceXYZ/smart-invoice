import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  InputGroup,
  InputProps as ChakraInputProps,
  NumberInput as ChakraNumberInput,
  NumberInputField,
  Stack,
  Tooltip,
} from '@chakra-ui/react';
import _ from 'lodash';
import React, { ReactNode } from 'react';
import { Controller, RegisterOptions, UseFormReturn } from 'react-hook-form';

export interface CustomNumberInputProps {
  label?: string | React.ReactNode;
  helperText?: string;
  name: string;
  tooltip?: string;
  required?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  registerOptions?: RegisterOptions;
  step?: number;
  variant?: string;
  min?: number;
  max?: number;
  spacing?: number | string;
  rightElement?: ReactNode;
}

type NumberInputProps = ChakraInputProps & CustomNumberInputProps;

/**
 * Primary UI component for Heading
 */
export function NumberInput({
  name,
  label,
  localForm,
  helperText,
  tooltip,
  registerOptions,
  step = 1,
  variant = 'outline',
  min = 0,
  max = 100,
  spacing,
  rightElement,
  placeholder,
  required = false,
  ...props
}: NumberInputProps) {
  if (!localForm) return null;

  const {
    control,
    formState: { errors },
  } = localForm;

  const error = name && errors[name] && errors[name]?.message;
  // some Input props not compatible with NumberInput/Controller field props
  const localProps = _.omit(props, ['onInvalid', 'filter', 'defaultValue']);

  return (
    <Controller
      control={control}
      name={name}
      rules={registerOptions}
      render={({ field: { ref, ...restField } }) => (
        <FormControl
          isRequired={!!registerOptions?.required || required}
          isInvalid={!!errors[name]}
          m={0}
        >
          <Stack spacing={spacing}>
            {label && (
              <HStack>
                {label && <FormLabel m={0}>{label}</FormLabel>}
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
            )}

            <InputGroup>
              <ChakraNumberInput
                variant={variant}
                step={step}
                min={min}
                max={max}
                {...localProps}
                {...restField}
              >
                <NumberInputField
                  ref={ref}
                  name={restField.name}
                  placeholder={placeholder}
                />
              </ChakraNumberInput>
              <HStack>{rightElement || null}</HStack>
            </InputGroup>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}

            <FormErrorMessage>{error as string}</FormErrorMessage>
          </Stack>
        </FormControl>
      )}
    />
  );
}
