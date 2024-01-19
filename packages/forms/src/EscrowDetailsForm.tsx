import {
  Box,
  Button,
  Card,
  // Checkbox,
  // DatePicker,
  Flex,
  HStack,
  // Input,
  Stack,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { SUPPORTED_NETWORKS } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import _ from 'lodash';
import { useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';
import * as Yup from 'yup';

const unsupportedNetwork = (chainId: number) =>
  !_.includes(SUPPORTED_NETWORKS, chainId);

export const sevenDaysFromNow = () => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() + 7);
  return localDate;
};

const schema = Yup.object().shape({
  client: Yup.string().required('Client address is required'),
  // TODO handle nested when for provider !== client
  provider: Yup.string().when(
    'raidPartySplit',
    (raidPartySplit: any, localSchema: any) => {
      if (_.first(raidPartySplit)) return localSchema;
      return localSchema.required('Raid party address is required');
    },
  ),
  safetyValveDate: Yup.date()
    .required('Safety valve date is required')
    .min(
      sevenDaysFromNow(),
      'Safety valve date must be at least a week in the future',
    ),
  daoSplit: Yup.boolean().required('DAO split is required'),
  spoilsPercent: Yup.string(),
  raidPartySplit: Yup.boolean().required('Raid party split is required'),
});

export function EscrowDetailsForm({
  escrowForm,
  raid,
  updateStep,
  backStep,
}: {
  escrowForm: UseFormReturn;
  raid: any; // IRaid;
  updateStep: (i?: number) => void;
  backStep: () => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = escrowForm;
  const { provider, client, safetyValveDate, raidPartySplit } = watch();
  const localForm = useForm({
    resolver: yupResolver(schema),
  });
  const {
    handleSubmit,
    setValue: localSetValue,
    watch: localWatch,
  } = localForm;
  const {
    // safetyValveDate: localSafetyValveDate,
    daoSplit: localDaoSplit,
    spoilsPercent: localSpoilsPercent,
    raidPartySplit: localRaidPartySplit,
  } = localWatch();

  const saveEscrowValues = (values: Partial<Invoice>) => {
    // update values in escrow form
    setValue('client', values?.client);
    setValue('provider', values?.provider);
    // setValue('safetyValveDate', values?.safetyValveDate);
    // setValue('raidPartySplit', values?.raidPartySplit);
    // setValue('daoSplit', values?.daoSplit);
  };

  // values: Partial<Invoice>
  const onSubmit = (values: any) => {
    saveEscrowValues(values);

    // move form
    if (localRaidPartySplit) updateStep(1);
    else updateStep(2);
  };

  const onBack = () => {
    const values = watch();
    saveEscrowValues(values);

    backStep();
  };

  useEffect(() => {
    // set initial local values
    localSetValue('client', client || '');
    if (provider) localSetValue('provider', provider);
    localSetValue('safetyValveDate', safetyValveDate || sevenDaysFromNow());
    if (_.isUndefined(raidPartySplit)) localSetValue('raidPartySplit', true);
    else localSetValue('raidPartySplit', raidPartySplit);
    // set daoSplit for zap, not used in form explicitly
    localSetValue('daoSplit', !_.isUndefined(raid));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, raid]);

  useEffect(() => {
    localSetValue('spoilsPercent', localDaoSplit ? '10' : '0');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDaoSplit]);

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} variant="filled" p={6}>
      <Stack spacing={4} w="100%">
        <Stack spacing={4}>
          {/* <Input
            label="Client Address"
            tooltip="This will be the address used to release funds from the invoice. This does not need to be the same address that funds the escrow."
            placeholder="0x..."
            name="client"
            isDisabled={!raid}
            localForm={localForm}
          /> */}
        </Stack>

        <Flex>
          <Box w="50%">
            {/* <DatePicker
              label="Safety Valve Date"
              name="safetyValveDate"
              tooltip="The funds can be withdrawn by the client after 00:00:00 GMT on this date"
              localForm={localForm}
            /> */}
          </Box>

          <Stack w="50%">
            {/* <Checkbox
              label="Raid Party Split"
              name="raidPartySplit"
              tooltip="Automatically split the funds between the raid party members on release from escrow"
              localForm={localForm}
              options={['Add Raid Party split']}
            /> */}
          </Stack>
        </Flex>

        {!localRaidPartySplit && (
          <Flex>
            {/* <Input
              label="Raid Party Address"
              tooltip="Recipient of the funds"
              placeholder="0x..."
              name="provider"
              localForm={localForm}
              registerOptions={{ required: true }}
            /> */}
          </Flex>
        )}

        <Flex>
          {/* <Input
            name="resolver"
            label="Arbitration Provider"
            value={localDaoSplit ? 'LexDAO' : 'RaidGuild DAO'}
            localForm={localForm}
            isDisabled
          />

          <Input
            name="spoilsPercent"
            label="Spoils"
            value={`${localSpoilsPercent}%`}
            localForm={localForm}
            isDisabled
          /> */}
        </Flex>

        <Flex justify="center">
          <HStack>
            {!raid && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="solid"
              isDisabled={unsupportedNetwork(chainId)}
            >
              Next:{' '}
              {localRaidPartySplit
                ? 'Set Raid Party Split'
                : 'Set Payment Amounts'}
            </Button>
          </HStack>
        </Flex>
      </Stack>
    </Card>
  );
}
