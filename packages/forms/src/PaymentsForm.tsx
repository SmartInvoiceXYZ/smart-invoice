import {
  Button,
  Card,
  Flex,
  FormControl,
  Heading,
  HStack,
  Icon,
  IconButton,
  NumberInput,
  // RadioBox,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Invoice } from '@smart-invoice/graphql';
import { commify } from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect } from 'react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
// import { FaInfoCircle, FaPlusCircle, FaRegTrashAlt } from 'react-icons/fa';
import { useChainId } from 'wagmi';
import * as Yup from 'yup';

// TODO migrate to design system

const tokens = (chainId: number) => {
  if (chainId === 100) {
    return ['WETH', 'WXDAI'];
  }
  if (chainId === 1) {
    return ['WETH', 'DAI'];
  }
  return ['WETH', 'DAI', 'TEST'];
};

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
  const { milestones, token, raidPartySplit } = watch();
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

  const setEscrowValues = (values: Partial<Invoice>) => {
    // set values in escrow form
    // setValue('milestones', values?.milestones);
    setValue('token', values?.token);
  };

  const onSubmit = (values: any) => {
    setEscrowValues(values);
    // navigate form
    updateStep();
  };

  const onBack = () => {
    const values = getValues();
    setEscrowValues(values as Partial<Invoice>);

    if (raidPartySplit) backStep();
    else backStep(2);
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
    localSetValue('token', token || tokens(chainId)[0]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = _.sumBy(
    localMilestones,
    (milestone: any) => _.toNumber(milestone.value) || 0,
  );

  return (
    <Card variant="filled" as="form" onSubmit={handleSubmit(onSubmit)} p={6}>
      <Flex w="100%">
        <FormControl isRequired>
          {/* <RadioBox
            options={tokens(chainId)}
            label="Payment Token"
            tooltip="Token to be used for escrow payments"
            name="token"
            localForm={localForm}
          /> */}
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
                {/* <NumberInput
                  name={`milestones.${index}.value`}
                  step={50}
                  min={0}
                  max={1_000_000}
                  placeholder="500"
                  variant="outline"
                  localForm={localForm}
                /> */}
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

      <Flex direction="row" width="100%" mt="1rem">
        <Button
          variant="outline"
          minW="25%"
          p="5px"
          mr=".5rem"
          onClick={onBack}
        >
          Back
        </Button>
        <Button type="submit" variant="solid" width="100%" isDisabled={false}>
          Next: Confirmation
        </Button>
      </Flex>
    </Card>
  );
}
