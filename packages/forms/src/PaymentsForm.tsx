import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS } from '@smartinvoicexyz/constants';
import { useFetchTokens } from '@smartinvoicexyz/hooks';
import { FormInvoice, IToken } from '@smartinvoicexyz/types';
import {
  Input,
  NumberInput,
  QuestionIcon,
  Select,
  Textarea,
  useMediaStyles,
} from '@smartinvoicexyz/ui';
import {
  commify,
  escrowPaymentsSchema,
  getDecimals,
  getWrappedNativeToken,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useMemo } from 'react';
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
  const { milestones } = watch();

  const { data: allTokens } = useFetchTokens();

  const tokens = useMemo(
    () => (allTokens ? _.filter(allTokens, t => t.chainId === chainId) : []),
    [chainId, allTokens],
  ) as IToken[];

  const nativeWrappedToken = getWrappedNativeToken(chainId) || '0x';

  const localForm = useForm({
    defaultValues: {
      token: nativeWrappedToken.toLowerCase(),
      milestones: milestones || [
        { value: '1', title: 'Milestone 1' },
        { value: '1', title: 'Milestone 2' },
      ],
    },
    resolver: yupResolver(escrowPaymentsSchema),
  });
  const {
    handleSubmit,
    watch: localWatch,
    control,
    formState: { errors, isValid },
  } = localForm;
  const { milestones: localMilestones, token: localToken } = localWatch();

  const invoiceTokenData = _.filter(
    tokens,
    t => t.address.toLowerCase() === localToken?.toLowerCase(),
  )[0];

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
        <FormControl isRequired>
          <Select
            name="token"
            label="Payment Token"
            tooltip={
              <Text>
                {`This is the cryptocurrency you'll receive payment in. The
                network your wallet is connected to determines which allTokens
                display here.`}
                <br />
                {`If you change your wallet network now,
                you'll be forced to start the invoice over.`}
              </Text>
            }
            localForm={localForm}
          >
            {tokens?.map(t => {
              return (
                <option
                  value={t.address.toLowerCase()}
                  key={t.address.toLowerCase()}
                >
                  {`${t.name} (${t.symbol})`}
                </option>
              );
            })}
          </Select>
        </FormControl>
      </Flex>
      <FormControl isInvalid={!!errors?.milestones} w="100%" isRequired>
        <Stack w="100%">
          <HStack spacing={4}>
            <FormLabel m={0}>Milestones</FormLabel>
            <Tooltip
              label="Amounts of each milestone for the escrow. Additional milestones can be added later."
              placement="right"
              hasArrow
              shouldWrapChildren
            >
              <Icon as={QuestionIcon} boxSize={3} borderRadius="full" />
            </Tooltip>
          </HStack>
          <Accordion w="100%" alignItems="stretch" allowMultiple>
            {_.map(milestonesFields, (field, index) => (
              <HStack
                key={field.id}
                spacing={4}
                w="100%"
                justify="space-between"
              >
                <AccordionItem w="100%">
                  {({ isExpanded }) => (
                    <>
                      <AccordionButton
                        w="100%"
                        px={2}
                        justifyContent="space-between"
                      >
                        <Text>{localMilestones?.[index].title ?? ''}</Text>
                        <HStack>
                          {!isExpanded && (
                            <Text fontWeight="bold" fontSize="lg">
                              {localMilestones?.[index].value}
                              {` `}
                              {invoiceTokenData?.symbol}
                            </Text>
                          )}
                          <AccordionIcon
                            color="blue.1"
                            w="2rem"
                            h="2rem"
                            m={0}
                          />
                        </HStack>
                      </AccordionButton>
                      <AccordionPanel px={2}>
                        <SimpleGrid columns={2} spacing={4} w="100%" mb={2}>
                          <Input
                            label="Title"
                            name={`milestones.${index}.title`}
                            localForm={localForm}
                          />
                          <NumberInput
                            label="Amount"
                            required
                            name={`milestones.${index}.value`}
                            step={50}
                            min={0}
                            max={1_000_000}
                            placeholder="500"
                            variant="outline"
                            localForm={localForm}
                            w="100%"
                            rightElement={
                              <Text p={2}>{invoiceTokenData?.symbol}</Text>
                            }
                          />
                        </SimpleGrid>
                        <Textarea
                          label="Description"
                          name={`milestones.${index}.description`}
                          localForm={localForm}
                        />
                      </AccordionPanel>
                    </>
                  )}
                </AccordionItem>
                <IconButton
                  icon={<Icon as={DeleteIcon} />}
                  aria-label="remove milestone"
                  variant="outline"
                  onClick={() => removeMilestone(index)}
                />
              </HStack>
            ))}
          </Accordion>
          <Flex>
            <FormErrorMessage mb={4}>
              {errors?.milestones?.message?.toString()}
            </FormErrorMessage>
          </Flex>

          <Button
            variant="outline"
            w="100%"
            onClick={() => {
              appendMilestone({
                value: '1',
                title: `Milestone ${milestonesFields.length + 1}`,
              });
            }}
            rightIcon={<Icon as={AddIcon} boxSize={3} />}
          >
            Add a new milestone
          </Button>
        </Stack>
      </FormControl>
      <Divider />

      <HStack
        w="100%"
        justify="space-between"
        pl={2}
        pr={6}
        fontSize="xl"
        fontWeight="bold"
        my={4}
      >
        <Text>
          Total {milestonesFields.length} Milestones:{' '}
          {commify(total.toFixed(decimals), decimals)}
          {` `}
          {invoiceTokenData?.symbol}
        </Text>
      </HStack>

      <Grid templateColumns="1fr" gap="1rem" w="100%">
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
