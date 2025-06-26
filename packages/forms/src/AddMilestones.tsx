import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  createInvoiceDetailsQueryKey,
  useAddMilestones,
} from '@smartinvoicexyz/hooks';
import { FormInvoice, InvoiceDetails } from '@smartinvoicexyz/types';
import {
  AddIcon,
  DeleteIcon,
  Input,
  LinkInput,
  NumberInput,
  QuestionIcon,
  Textarea,
  useMediaStyles,
  useToast,
} from '@smartinvoicexyz/ui';
import {
  addMilestonesSchema,
  commify,
  logDebug,
  resolutionFeePercentage,
} from '@smartinvoicexyz/utils';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Hex } from 'viem';

export const getDecimals = (value: string) => {
  const [, decimal] = value.split('.');
  return decimal?.length || 0;
};

export function AddMilestones({
  invoice,
  onClose,
}: {
  invoice: Partial<InvoiceDetails>;
  onClose: () => void;
}) {
  const toast = useToast();
  const {
    address,
    tokenMetadata,
    resolutionRate,
    total,
    deposited,
    amounts,
    chainId,
  } = _.pick(invoice, [
    'address',
    'tokenMetadata',
    'resolutionRate',
    'total',
    'deposited',
    'amounts',
    'chainId',
  ]);

  const localForm = useForm<Partial<FormInvoice>>({
    resolver: yupResolver(addMilestonesSchema),
    defaultValues: {
      milestones: [
        {
          value: '1',
          title: `Milestone ${(amounts?.length ?? 0) + 1}`,
          description: '',
        },
        {
          value: '1',
          title: `Milestone ${(amounts?.length ?? 0) + 2}`,
          description: '',
        },
      ],
    },
  });

  const {
    watch,
    formState: { errors },
    control,
  } = localForm;

  const {
    fields: milestonesFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    name: 'milestones',
    control,
  });
  const { milestones } = watch();
  const queryClient = useQueryClient();
  const onTxSuccess = () => {
    // invalidate cache
    queryClient.invalidateQueries({
      queryKey: createInvoiceDetailsQueryKey(chainId, address),
    });
    // close modal
    onClose();
  };

  const { writeAsync, isLoading, prepareError } = useAddMilestones({
    address: address as Hex,
    invoice,
    localForm,
    toast,
    onTxSuccess,
  });

  // TODO: handle excess funds from previous deposits
  const excessFunds = useMemo(() => {
    if (!total || !deposited) return 0;
    return deposited - total; // bigint
  }, [total, deposited, tokenMetadata]);

  if (excessFunds > 0n) {
    logDebug('excessFunds', excessFunds);
  }

  const newTotalDue = _.sumBy(milestones, ({ value }) => _.toNumber(value));
  const newDisputeFee =
    resolutionRate && resolutionRate > BigInt(0)
      ? resolutionFeePercentage(resolutionRate.toString()) * newTotalDue
      : 0;

  const [totalNew, decimals] = milestones
    ? milestones
        .map((milestone: { value: string }) => [
          _.toNumber(milestone.value) || 0,
          getDecimals(milestone.value),
        ])
        .reduce(
          ([tot, maxDecimals], [v, d]) => [tot + v, Math.max(d, maxDecimals)],
          [0, 0],
        )
    : [0, 0];

  const { primaryButtonSize } = useMediaStyles();

  const isDisabled = !!prepareError || milestones?.some(m => !m.value);

  return (
    <Stack w="100%" spacing={4}>
      <Heading
        fontWeight="bold"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
        color="black"
        size="lg"
      >
        Add New Payment Milestones
      </Heading>

      <LinkInput
        name="document"
        label="Link to Project Agreement (if updated)"
        tooltip="If any revisions were made to the agreement in correlation to the new milestones, please include the new link to it. This will be referenced in the case of a dispute."
        localForm={localForm}
      />

      <FormControl isInvalid={!!errors?.milestones}>
        <Stack w="100%">
          <HStack align="center" spacing={1}>
            <Heading size="sm">Milestones</Heading>
            <Tooltip
              label="Amounts of each milestone for the escrow. Additional milestones can be added later."
              placement="right"
              hasArrow
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
                        <Text>{milestones?.[index].title ?? ''}</Text>
                        <HStack>
                          {!isExpanded && (
                            <Text fontWeight="bold" fontSize="lg">
                              {milestones?.[index].value}
                              {` `}
                              {tokenMetadata?.symbol}
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
                              <Text p={2}>{tokenMetadata?.symbol}</Text>
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
              {errors?.milestones?.message as string}
            </FormErrorMessage>
          </Flex>

          <Button
            variant="outline"
            onClick={() => {
              appendMilestone({
                value: '1',
                title: `Milestone ${(amounts?.length ?? 0) + milestonesFields.length + 1}`,
                description: '',
              });
            }}
            rightIcon={<Icon as={AddIcon} boxSize={3} />}
          >
            Add a new milestone
          </Button>
        </Stack>
      </FormControl>

      {!!newTotalDue && (
        <Stack>
          <HStack>
            <Text fontWeight="bold" color="black">
              Total {milestones?.length} milestones:
            </Text>

            <Text>
              {commify(totalNew.toFixed(decimals), decimals)}{' '}
              {tokenMetadata?.symbol}
            </Text>
          </HStack>

          <HStack>
            <Text fontWeight="bold" color="black">
              Potential dispute fee:
            </Text>
            <Text>
              {commify(
                newDisputeFee.toFixed(
                  newDisputeFee < 1 ? decimals + 3 : decimals,
                ),
                newDisputeFee < 1 ? decimals + 3 : decimals,
              )}{' '}
              {tokenMetadata?.symbol}
            </Text>
            decimal : {getDecimals(newDisputeFee.toString())}
          </HStack>
        </Stack>
      )}

      <Text>
        Note: new milestones may take a few minutes to appear in the list
      </Text>

      <Button
        onClick={() => {
          writeAsync?.();
        }}
        isLoading={isLoading}
        isDisabled={isDisabled}
        textTransform="uppercase"
        size={primaryButtonSize}
        w="100%"
      >
        Add
      </Button>
    </Stack>
  );
}
