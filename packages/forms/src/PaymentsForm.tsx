import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS } from '@smart-invoice/constants';
import { useFetchTokens } from '@smart-invoice/hooks';
import { FormInvoice } from '@smart-invoice/types';
import { NumberInput, QuestionIcon, Select } from '@smart-invoice/ui';
import { commify, getTokenInfo, getTokens } from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  milestones: Yup.array()
    .min(1, 'At least one milestone is required!')
    .of(
      Yup.object().shape({
        value: Yup.string().required('Milestone Amount is required'),
      }),
    ),
  token: Yup.string().required('Token is required'),
  // token: Yup.object().shape({
  //   label: Yup.string(),
  //   value: Yup.string().required(),
  // }),
});

export function PaymentsForm({
  escrowForm,
  updateStep,
}: {
  escrowForm: UseFormReturn;
  updateStep: () => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = escrowForm;
  const { milestones, token } = watch();
  const localForm = useForm({
    defaultValues: {
      milestones: milestones || [{ value: '1' }],
    },
    resolver: yupResolver(validationSchema),
  });
  const {
    setValue: localSetValue,
    handleSubmit,
    watch: localWatch,
    control,
    formState: { errors, isValid },
  } = localForm;
  const { milestones: localMilestones, token: localToken } = localWatch();

  const { data } = useFetchTokens();
  const { tokenData, allTokens } = _.pick(data, ['tokenData', 'allTokens']);

  const TOKENS = useMemo(
    () => allTokens && getTokens(allTokens, chainId),
    [chainId, allTokens],
  );
  const invoiceTokenData = localToken
    ? getTokenInfo(chainId, localToken, tokenData)
    : undefined;

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const onSubmit = (values: Partial<FormInvoice>) => {
    setValue('milestones', values?.milestones);
    setValue('token', values?.token);
    // navigate form
    updateStep();
  };

  const {
    fields: milestonesFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    name: 'milestones',
    control,
  });

  useEffect(() => {
    localSetValue('token', token || _.first(TOKENS));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TOKENS]);

  const total = _.sumBy(
    localMilestones,
    (milestone: { value: string }) => _.toNumber(milestone.value) || 0,
  );

  return (
    <Stack as="form" onSubmit={handleSubmit(onSubmit)} spacing={4}>
      <Flex w="100%">
        <FormControl isRequired>
          <Select
            name="token"
            label="Payment Token"
            required="required"
            tooltip="This is the cryptocurrency you'll receive payment in. The network your wallet is connected to determines which tokens display here. (If you change your wallet network now, you'll be forced to start the invoice over)."
            localForm={localForm}
          >
            {TOKENS?.map((t: string) => (
              <option value={t} key={t}>
                {getTokenInfo(chainId, t, tokenData).symbol}
              </option>
            ))}
          </Select>
        </FormControl>
      </Flex>
      <FormControl isInvalid={!!errors?.milestones}>
        <Stack w="100%">
          <HStack>
            <Heading size="sm">Milestone Amounts</Heading>
            <Tooltip
              label="Amounts of each milestone for the escrow. Additional milestones can be added later."
              placement="right"
              hasArrow
              shouldWrapChildren
            >
              <Icon as={QuestionIcon} boxSize={3} borderRadius="full" />
            </Tooltip>
          </HStack>
          {_.map(milestonesFields, (field, index) => {
            const handleRemoveMilestone = () => {
              removeMilestone(index);
            };

            return (
              <HStack key={field.id} spacing={4}>
                <HStack spacing={1} flexGrow={1}>
                  <NumberInput
                    name={`milestones.${index}.value`}
                    step={50}
                    min={0}
                    max={1_000_000}
                    placeholder="500"
                    variant="outline"
                    localForm={localForm}
                  />
                </HStack>
                <IconButton
                  icon={<Icon as={DeleteIcon} />}
                  aria-label="remove milestone"
                  variant="outline"
                  onClick={handleRemoveMilestone}
                />
              </HStack>
            );
          })}
          <Flex>
            <FormErrorMessage mb={4}>
              {errors?.milestones?.message}
            </FormErrorMessage>
          </Flex>

          <Flex justify="space-between" align="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                appendMilestone({ value: '1' });
              }}
              rightIcon={<Icon as={AddIcon} boxSize={3} />}
            >
              Add
            </Button>
            <Text>
              Total: {commify(total || 0)} {invoiceTokenData?.symbol}
            </Text>
          </Flex>
        </Stack>
      </FormControl>

      <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
        <Button
          type="submit"
          isDisabled={!isValid}
          textTransform="uppercase"
          size={buttonSize}
          fontFamily="mono"
          fontWeight="bold"
        >
          Next: {ESCROW_STEPS[3].next}
        </Button>
      </Grid>
    </Stack>
  );
}
