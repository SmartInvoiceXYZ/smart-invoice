import {
  Checkbox as ChakraCheckbox,
  CheckboxProps as ChakraCheckboxProps,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Stack,
  Tooltip,
} from '@chakra-ui/react';
import { QuestionIcon } from '@smart-invoice/ui';
import _ from 'lodash';
import { ReactElement, ReactNode } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';

export interface CustomCheckboxProps {
  name: string;
  label?: string | ReactNode;
  options: (string | ReactNode)[];
  direction?: 'row' | 'column';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  helperText?: string;
  tooltip?: string;
}

export type RadioProps = CustomCheckboxProps & ChakraCheckboxProps;

export function Checkbox({
  name,
  label,
  options,
  size,
  direction,
  localForm,
  helperText,
  tooltip,
  ...props
}: RadioProps) {
  const {
    control,
    formState: { errors },
  } = localForm;

  const error = name && errors[name] && errors[name]?.message;

  if (_.eq(_.size(options), 1)) {
    return (
      <Controller
        control={control}
        name={name}
        key={name}
        defaultValue={false}
        render={({ field: { onChange, value, ref } }) => (
          <FormControl m={0}>
            <Stack spacing={4}>
              <HStack align="center">
                {label && <FormLabel m="0">{label}</FormLabel>}
                {tooltip && (
                  <Tooltip
                    label={tooltip}
                    shouldWrapChildren
                    hasArrow
                    placement="end"
                  >
                    <Icon
                      as={QuestionIcon}
                      boxSize={3}
                      color="red.500"
                      bg="white"
                      borderRadius="full"
                    />
                  </Tooltip>
                )}
              </HStack>
              <ChakraCheckbox
                onChange={onChange}
                textTransform="capitalize"
                ref={ref}
                isChecked={value}
                size={size}
                {...props}
              >
                {options[0]}
              </ChakraCheckbox>
              {helperText && <FormHelperText>{helperText}</FormHelperText>}
              <FormErrorMessage>{error as string}</FormErrorMessage>
            </Stack>
          </FormControl>
        )}
      />
    );
  }

  return (
    <FormControl>
      <Stack spacing={4}>
        <HStack align="center">
          {label && <FormLabel m="0">{label}</FormLabel>}
          {tooltip && (
            <Tooltip
              label={tooltip}
              shouldWrapChildren
              hasArrow
              placement="end"
            >
              <Icon
                as={QuestionIcon}
                boxSize={3}
                color="red.500"
                bg="white"
                borderRadius="full"
              />
            </Tooltip>
          )}
        </HStack>
        <Stack spacing={3} direction={direction || 'row'}>
          {options.map(
            (option): ReactElement => (
              <Controller
                control={control}
                name={name}
                key={name}
                defaultValue={false}
                render={({ field: { onChange, value, ref } }) => (
                  <ChakraCheckbox
                    onChange={onChange}
                    textTransform="capitalize"
                    ref={ref}
                    isChecked={value}
                    size={size}
                    {...props}
                  >
                    {option}
                  </ChakraCheckbox>
                )}
              />
            ),
          )}
        </Stack>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
        {typeof error === 'string' && (
          <FormErrorMessage>{error}</FormErrorMessage>
        )}
      </Stack>
    </FormControl>
  );
}
