import {
  Box,
  Button,
  Flex,
  FormControl,
  Grid,
  Heading,
  HStack,
  IconButton,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS } from '@smart-invoice/constants/src';
import { Invoice } from '@smart-invoice/graphql';
import { useFetchTokens } from '@smart-invoice/hooks';
import { NumberInput, Select } from '@smart-invoice/ui';
import { commify, getTokenInfo, getTokens } from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { Hex } from 'viem';
import { useChainId } from 'wagmi';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  milestones: Yup.array().of(
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
  backStep,
}: {
  escrowForm: UseFormReturn;
  updateStep: () => void;
  backStep: (i?: number) => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = escrowForm;
  const { milestones, token } = watch();
  const localForm = useForm({
    defaultValues: {
      milestones: [{ value: '1000' }],
    },
    resolver: yupResolver(validationSchema),
  });
  const {
    setValue: localSetValue,
    handleSubmit,
    watch: localWatch,
    control,
    getValues,
  } = localForm;
  const { milestones: localMilestones, token: localToken } = localWatch();

  const { data } = useFetchTokens();
  const { tokenData, allTokens } = _.pick(data, ['tokenData', 'allTokens']);

  const setEscrowValues = (values: Partial<Invoice>) => {
    // set values in escrow form
    // setValue('milestones', values?.milestones);
    setValue('token', values?.token);
  };

  const TOKENS = useMemo(
    () => allTokens && getTokens(allTokens, chainId),
    [chainId, allTokens],
  );

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const onSubmit = (values: any) => {
    setEscrowValues(values);
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
    if (milestones) localSetValue('milestones', milestones);
    localSetValue('token', token || _.first(TOKENS));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = _.sumBy(
    localMilestones,
    (milestone: any) => _.toNumber(milestone.value) || 0,
  );

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} p={6}>
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
      <Stack w="100%">
        <HStack>
          <Heading size="sm">Milestone Amounts</Heading>
          <Tooltip
            label="Amounts of each milestone for the escrow. Additional milestones can be added later."
            placement="right"
            hasArrow
            shouldWrapChildren
          >
            <p>Test</p>
            {/* <Icon
              as={FaInfoCircle}
              boxSize={3}
              color="purple.500"
              bg="white"
              borderRadius="full"
            /> */}
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
                // icon={<Icon as={FaRegTrashAlt} />}
                aria-label="remove milestone"
                variant="outline"
                onClick={handleRemoveMilestone}
              />
            </HStack>
          );
        })}
        <Flex justify="space-between" align="flex-end">
          <Button
            variant="outline"
            onClick={() => {
              appendMilestone({ value: '1000' });
            }}
            // rightIcon={<Icon as={FaPlusCircle} />}
          >
            Add
          </Button>
          {total && (
            <Text>
              Total: {commify(total)} {localToken}
            </Text>
          )}
        </Flex>
      </Stack>

      <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
        <Button
          type="submit"
          // isLoading={loading}
          // isDisabled={!nextStepEnabled}
          textTransform="uppercase"
          size={buttonSize}
          fontFamily="mono"
          fontWeight="bold"
        >
          Next: {ESCROW_STEPS[2].next}
        </Button>
      </Grid>
    </Box>
  );
}
