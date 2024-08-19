/* eslint-disable no-plusplus */
/* eslint-disable radix */
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { useAddMilestones } from '@smartinvoicexyz/hooks';
import {
  LinkInput,
  NumberInput,
  QuestionIcon,
  useMediaStyles,
  useToast,
} from '@smartinvoicexyz/ui';
import {
  commify,
  // getTxLink,
  resolutionFeePercentage,
} from '@smartinvoicexyz/utils';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Hex } from 'viem';
import { useChainId } from 'wagmi';

export const getDecimals = (value: string) => {
  const [, decimal] = value.split('.');
  return decimal?.length || 0;
};

export function AddMilestones({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetails;
  onClose: () => void;
}) {
  const chainId = useChainId();
  const toast = useToast();
  const localForm = useForm({
    defaultValues: {
      milestones: [{ value: '' }, { value: '' }],
    },
  });
  const {
    watch,
    formState: { errors },
    control,
  } = localForm;
  const { address, tokenMetadata, resolutionRate, total, deposited } = _.pick(
    invoice,
    ['address', 'tokenMetadata', 'resolutionRate', 'total', 'deposited'],
  );

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
      queryKey: ['invoiceDetails'],
    });
    queryClient.invalidateQueries({ queryKey: ['extendedInvoiceDetails'] });
    // close modal
    onClose();
  };

  const { writeAsync, isLoading } = useAddMilestones({
    address: address as Hex,
    chainId,
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

  // eslint-disable-next-line no-console
  console.log('excessFunds', excessFunds);

  const newTotalDue = _.sumBy(milestones, ({ value }) => _.toNumber(value));
  const newDisputeFee =
    resolutionFeePercentage(resolutionRate.toString()) * newTotalDue;

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

  // * add milestones click handler
  const addNewMilestones = async () => {
    writeAsync?.();
  };

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
        name="projectAgreement"
        label="Link to Project Agreement (if updated)"
        tooltip="Link to the original agreement was an IPFS hash. Therefore, if any revisions were made to the agreement in correlation to the new milestones, please include the new link to it. This will be referenced in the case of a dispute."
        localForm={localForm}
      />

      <FormControl isInvalid={!!errors?.milestones}>
        <Stack w="100%">
          <HStack align="center" spacing={1}>
            <Heading size="sm">Milestone Amounts</Heading>
            <Tooltip
              label="Amounts of each milestone for the escrow. Additional milestones can be added later."
              placement="right"
              hasArrow
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
                    step={1}
                    min={0}
                    max={1_000_000}
                    w="97%"
                    placeholder="500"
                    variant="outline"
                    localForm={localForm}
                  />
                  <Text>{tokenMetadata?.symbol}</Text>
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
              {errors?.milestones?.message as string}
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
              Total: {commify(totalNew.toFixed(decimals), decimals)}{' '}
              {tokenMetadata?.symbol}
            </Text>
          </Flex>
        </Stack>
      </FormControl>

      {!!newTotalDue && (
        <Stack>
          <Flex color="black" justify="space-between" w="100%" fontSize="sm">
            <HStack>
              <Text fontWeight="bold" color="black">
                Potential Dispute Fee:
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
          </Flex>

          <Flex color="black" justify="space-between" w="100%" fontSize="sm">
            <HStack>
              <Text fontWeight="bold" color="black">
                Expected Total Due:
              </Text>

              <Text>
                {commify(totalNew.toFixed(decimals), decimals)}{' '}
                {tokenMetadata?.symbol}
              </Text>
            </HStack>
          </Flex>
        </Stack>
      )}

      <Text>
        Note: new milestones may take a few minutes to appear in the list
      </Text>

      <Button
        onClick={addNewMilestones}
        isLoading={isLoading}
        isDisabled={!writeAsync}
        textTransform="uppercase"
        size={primaryButtonSize}
        w="100%"
      >
        Add
      </Button>
      {/* {walletClient?.chain?.id && txHash && (
        <Text color="black" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(walletClient?.chain?.id, txHash)}
            isExternal
            color="blue.1"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )} */}
    </Stack>
  );
}
