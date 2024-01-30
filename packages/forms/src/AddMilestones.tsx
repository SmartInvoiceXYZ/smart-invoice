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
  Link,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChainId } from '@smart-invoice/constants';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { useAddMilestones } from '@smart-invoice/hooks';
import { TokenData } from '@smart-invoice/types';
import {
  Input,
  LinkInput,
  NumberInput,
  QuestionIcon,
  useToast,
} from '@smart-invoice/ui';
import {
  calculateResolutionFeePercentage,
  commify,
  getTokenInfo,
  getTxLink,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { formatUnits, Hex } from 'viem';
import { useChainId } from 'wagmi';

export type AddMilestonesProps = {
  invoice: InvoiceDetails;
};

export function AddMilestones({ invoice }: AddMilestonesProps) {
  const chainId = useChainId();
  const toast = useToast();
  const localForm = useForm({
    defaultValues: {
      milestones: [{ value: '' }, { value: '' }],
    },
  });
  const {
    watch,
    setValue,
    formState: { errors },
    control,
  } = localForm;
  const {
    address,
    tokenMetadata,
    // amounts,
    // deposits,
    // projectName,
    // projectDescription,
    // projectAgreement,
    // resolutionRate,
    // startDate,
    // endDate,
  } = _.pick(invoice, ['address', 'tokenMetadata']);

  const {
    fields: milestonesFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    name: 'milestones',
    control,
  });
  console.log(watch());

  const total = useMemo(() => {
    console.log(milestonesFields);
    if (!milestonesFields) return 0;
    return milestonesFields.reduce((t, v) => t + parseInt(v.id), 0);
  }, [milestonesFields]);

  const onTxSuccess = () => {
    // TODO: handle tx success, cache invalidation, close modal
  };

  const { writeAsync, isLoading } = useAddMilestones({
    address: address as Hex,
    chainId,
    toast,
    onTxSuccess,
  });

  const due = BigInt(0);

  // const [addedTotal, setAddedTotal] = useState(BigInt(0));
  // const [addedTotalInput, setAddedTotalInput] = useState(0);
  // const [addedMilestones, setAddedMilestones] = useState(0);
  // const [milestoneAmountsInput, setMilestoneAmountsInput] = useState(
  //   [] as number[],
  // );
  // const [milestoneAmounts, setMilestoneAmounts] = useState([] as bigint[]);
  // const [addedTotalInvalid, setAddedTotalInvalid] = useState(false);
  // const [addedMilestonesInvalid, setAddedMilestonesInvalid] = useState(false);
  // const [revisedProjectAgreement, setRevisedProjectAgreement] =
  //   useState(projectAgreement);
  // const defaultSrc =
  //   projectAgreement && projectAgreement.length > 0
  //     ? projectAgreement[projectAgreement.length - 1].src
  //     : '';
  // const [revisedProjectAgreementSrc, setRevisedProjectAgreementSrc] =
  //   useState(defaultSrc);
  // const defaultProjectType =
  //   projectAgreement && projectAgreement.length > 0
  //     ? projectAgreement[projectAgreement.length - 1].type
  //     : '';

  // const [revisedProjectAgreementType, setRevisedProjectAgreementType] =
  //   useState(defaultProjectType);
  // const [remainingFunds, setRemainingFunds] = useState(0);

  // useEffect(() => {
  //   if (!amounts) return;

  //   const totalAmounts = formatUnits(
  //     amounts.reduce((a: any, b: any) => a + BigInt(b), BigInt(0)),
  //     decimals,
  //   );

  //   if (deposits && deposits.length > 0) {
  //     const depositAmounts = [] as bigint[];

  //     for (let i = 0; i < deposits.length; i++) {
  //       depositAmounts.push(deposits[i].amount);
  //     }
  //     const totalDeposits = formatUnits(
  //       depositAmounts.reduce((a, b) => a + b),
  //       decimals,
  //     );

  //     const remaining = parseInt(totalAmounts) - parseInt(totalDeposits);
  //     setRemainingFunds(remaining);
  //   } else {
  //     setRemainingFunds(parseInt(totalAmounts));
  //   }
  // }, [amounts, deposits, decimals]);

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  // useEffect(() => {
  //   const createdAt = BigInt(Date.now());
  //   const newProjectAgreement = {
  //     id: createdAt.toString(),
  //     type: revisedProjectAgreementType,
  //     src: revisedProjectAgreementSrc,
  //     createdAt,
  //   };
  //   setRevisedProjectAgreement([
  //     ...(projectAgreement ?? []),
  //     newProjectAgreement,
  //   ]);
  // }, [
  //   revisedProjectAgreementSrc,
  //   revisedProjectAgreementType,
  //   projectAgreement,
  // ]);

  // * add milestones click handler
  const addNewMilestones = async () => {
    // if (!milestoneAmounts.length) return;
    // try {
    //   setLoading(true);
    //   let detailsHash: Hash | undefined;
    //   if (revisedProjectAgreementType === 'ipfs') {
    //     const localProjectAgreement = revisedProjectAgreement;
    //     detailsHash = '0x';
    //     // detailsHash = await uploadMetadata({
    //     //   projectName,
    //     //   projectDescription,
    //     //   projectAgreement: localProjectAgreement,
    //     //   startDate: Math.floor(Number(startDate) / 1000),
    //     //   endDate: Math.floor(Number(endDate) / 1000),
    //     // });
    //   }
    //   if (walletClient) {
    //     let hash: Hash | undefined;
    //     const validAddress = address && isAddress(address);
    //     if (!validAddress) return;
    //     if (detailsHash) {
    //       hash = '0x'; // await addMilestonesWithDetails(
    //       //   walletClient,
    //       //   validAddress,
    //       //   milestoneAmounts,
    //       //   detailsHash,
    //       // );
    //     } else {
    //       hash = '0x'; // await addMilestones(
    //       //   walletClient,
    //       //   validAddress,
    //       //   milestoneAmounts,
    //       // );
    //     }
    //     setTxHash(hash);
    //     const { chain } = walletClient;
    //     // await waitForTransaction(chain, hash);
    //     window.location.href = `/invoice/${chain.id.toString(16)}/${address}`;
    //   }
    // } catch (addMilestonesError) {
    //   setLoading(false);
    //   logError({ addMilestonesError });
    // }
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
        name="revisedProjectAgreementLink"
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
              Total: {commify(total || 0)} {tokenMetadata?.symbol}
            </Text>
          </Flex>
        </Stack>
      </FormControl>

      {!!due && (
        <Stack>
          <Flex color="black" justify="space-between" w="100%" fontSize="sm">
            <HStack>
              <Text fontWeight="bold" color="black">
                Potential Dispute Fee:
              </Text>

              {/* <Text>
              {`${
                addedTotalInput
                  ? (
                      (remainingFunds + addedTotalInput) *
                      calculateResolutionFeePercentage(resolutionRate)
                    ).toFixed(5)
                  : (
                      remainingFunds *
                      calculateResolutionFeePercentage(resolutionRate)
                    ).toFixed(5)
              } ${symbol}`}
            </Text> */}
            </HStack>
          </Flex>

          <Flex color="black" justify="space-between" w="100%" fontSize="sm">
            <HStack>
              <Text fontWeight="bold" color="black">
                Expected Total Due:
              </Text>

              {/* <Text>{`${
                addedTotalInput
                  ? parseFloat(formatUnits(due, tokenMetadata?.decimals || 18)) + addedTotalInput
                  : formatUnits(due, tokenMetadata?.decimals || 18)
              } ${symbol}`}</Text> */}
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
        isDisabled={false}
        textTransform="uppercase"
        size={buttonSize}
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
