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
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS } from '@smart-invoice/constants';
import { useFetchTokens } from '@smart-invoice/hooks';
import { FormInvoice, IToken } from '@smart-invoice/types';
import {
  NumberInput,
  QuestionIcon,
  Select,
  useMediaStyles,
} from '@smart-invoice/ui';
import {
  commify,
  escrowPaymentsSchema,
  getDecimals,
  getWrappedNativeToken,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';

// TODO move FieldArray to its own component?

export function PaymentsForm({
  invoiceForm,
  updateStep,
}: {
  invoiceForm: UseFormReturn;
  updateStep: () => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = invoiceForm;
  const { milestones, token } = watch();


  const { data: tokens } = useFetchTokens();

  const TOKENS = useMemo(
    // eslint-disable-next-line eqeqeq
    () => (tokens ? _.filter(tokens, t => t.chainId == chainId) : []),
    [chainId, tokens],
  ) as IToken[];


  const nativeWrappedToken = getWrappedNativeToken(chainId) || '0x';




  const localForm = useForm({
    defaultValues: {
      milestones: milestones || [{ value: '1' }, { value: '1' }],
    },
    resolver: yupResolver(escrowPaymentsSchema),
  });
  const {
    setValue: localSetValue,
    handleSubmit,
    watch: localWatch,
    control,
    formState: { errors, isValid },
  } = localForm;
  const { milestones: localMilestones, token: localToken } = localWatch();

  const invoiceTokenData = _.filter(TOKENS, (t) => t.address === localToken)[0];

  const { primaryButtonSize } = useMediaStyles();

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
    localSetValue('token', nativeWrappedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TOKENS, nativeWrappedToken]);


  const [total, decimals] = localMilestones
    ? localMilestones
      .map((milestone: { value: string }) => [
        _.toNumber(milestone.value) || 0,
        getDecimals(milestone.value),
      ])
      .reduce(
        ([tot, maxDecimals], [v, d]) => [tot + v, Math.max(d, maxDecimals)],
        [0, 0],
      )
    : [0, 0];

  return (
    <Stack as="form" onSubmit={handleSubmit(onSubmit)} spacing={4}>
      <Flex w="100%">
        <FormControl isRequired >
          <Select
            name="token"
            label="Payment Token"
            required="required"
            // _placeholder={defaultTokenData?.symbol}
            tooltip="This is the cryptocurrency you'll receive payment in. The network your wallet is connected to determines which tokens display here. (If you change your wallet network now, you'll be forced to start the invoice over)."
            localForm={localForm}
          >
            {TOKENS?.map(t => {
              return (
                <option value={t.address} key={t.address}>
                  {t.symbol}
                </option>
              );
            })}
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
              {errors?.milestones?.message?.toString()}
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
              Total: {commify(total.toFixed(decimals), decimals)}
              {` `}
              {invoiceTokenData?.symbol}
            </Text>
          </Flex>
        </Stack>
      </FormControl>

      <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
        <Button
          type="submit"
          isDisabled={!isValid}
          textTransform="uppercase"
          size={primaryButtonSize}
          fontFamily="mono"
          fontWeight="bold"
        >
          Next: {ESCROW_STEPS[3].next}
        </Button>
      </Grid>
    </Stack>
  );
}
