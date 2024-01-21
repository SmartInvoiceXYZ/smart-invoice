import 'react-datepicker/dist/react-datepicker.css';

import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Icon,
  Stack,
  Tooltip,
} from '@chakra-ui/react';
import _ from 'lodash';
import ReactDatePicker, { ReactDatePickerProps } from 'react-datepicker';
import { Controller, RegisterOptions, UseFormReturn } from 'react-hook-form';

// import { CustomDatePickerButton } from './CustomDatePickerButton';

// TODO handle separate controlled component
// TODO currently only single date is supported, but type shows that it can be a range

export type DatePickerProps = {
  name: string;
  label?: string;
  tip?: string;
  localForm: Pick<UseFormReturn, 'control' | 'formState' | 'watch'>;
  registerOptions?: RegisterOptions;
  tooltip?: string;
  placeholder?: string;
  variant?: string;
  spacing?: number | string;
} & Omit<typeof ReactDatePickerProps, 'onChange'>;

export function DatePicker({
  label,
  name,
  localForm,
  registerOptions,
  tooltip,
  placeholderText, // default prop from react-datepicker
  placeholder, // match rest of inputs for consistency, takes priority
  variant = 'ghost',
  spacing,
  ...props
}: DatePickerProps) {
  const {
    control,
    watch,
    formState: { errors },
  } = _.pick(localForm, ['control', 'watch', 'formState']);

  // these are the values that seemed relevant. we can adjust and even theme this
  const customDatePickerStyles = {
    '.react-datepicker__header': {
      backgroundColor: 'gray.800',
      color: 'gray.100',
    },
    '.react-datepicker__month-container': {
      backgroundColor: 'gray.800',
      color: 'gray.100',
    },
    '.react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__month, .react-datepicker__month-text':
      {
        color: 'gray.100',
      },
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={registerOptions}
      shouldUnregister={false}
      render={({ field }) => (
        <FormControl isInvalid={!!errors[name]}>
          <Stack sx={customDatePickerStyles} spacing={spacing}>
            <HStack>
              {label && <FormLabel m={0}>{label}</FormLabel>}
              {tooltip && (
                <Tooltip label={tooltip} shouldWrapChildren>
                  <Icon
                    as={InfoOutlineIcon}
                    boxSize={3}
                    color="red.500"
                    bg="white"
                    borderRadius="full"
                  />
                </Tooltip>
              )}
            </HStack>
            <ReactDatePicker
              {...props}
              {...field}
              selected={watch?.(name)}
              customInput={
                <Button variant={variant}>
                  {placeholder || placeholderText}
                </Button>
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={(ref: any) => {
                field.ref({
                  focus: ref?.setFocus,
                });
              }}
            />
            <FormErrorMessage color="red.500">
              {errors[name]?.message as string}
            </FormErrorMessage>
          </Stack>
        </FormControl>
      )}
    />
  );
}
