import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Stack,
  Textarea as ChakraTextarea,
  TextareaProps as ChakraTextareaProps,
} from '@chakra-ui/react';
import React from 'react';
import { RegisterOptions, UseFormReturn } from 'react-hook-form';

// import { Tooltip } from '../../atoms';

export type CustomTextareaProps = {
  label: string | React.ReactNode;
  name: string;
  helperText?: string;
  tooltip?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  registerOptions?: RegisterOptions;
};

export type TextareaProps = ChakraTextareaProps & CustomTextareaProps;

/**
 * Primary UI component for Textarea Input
 */
export function Textarea({
  label,
  name,
  localForm,
  registerOptions,
  helperText,
  tooltip,
  ...props
}: TextareaProps) {
  const {
    register,
    formState: { errors },
  } = localForm;

  const error = errors[name] && errors[name]?.message;

  return (
    <FormControl>
      <Stack spacing={4}>
        <HStack align="center">
          {label && <FormLabel m="0">{label}</FormLabel>}
          {/* {tooltip && (
            <Tooltip
              label={tooltip}
              shouldWrapChildren
              hasArrow
              placement="end"
            >
              <Icon
                as={FaInfoCircle}
                boxSize={3}
                color="red.500"
                bg="white"
                borderRadius="full"
              />
            </Tooltip>
          )} */}
        </HStack>

        <ChakraTextarea {...props} {...register(name, registerOptions)} />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
        {typeof error === 'string' && (
          <FormErrorMessage>{error}</FormErrorMessage>
        )}
      </Stack>
    </FormControl>
  );
}
