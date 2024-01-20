/* eslint-disable no-plusplus */
/* eslint-disable radix */
import {
  Button,
  Flex,
  Heading,
  HStack,
  Input as ChakraInput,
  InputGroup,
  InputRightElement,
  Link,
  SimpleGrid,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { ChainId } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { TokenData } from '@smart-invoice/types';
import { Input, LinkInput } from '@smart-invoice/ui';
import {
  calculateResolutionFeePercentage,
  getTokenInfo,
  getTxLink,
  logDebug,
  logError,
  // addMilestones,
  // addMilestonesWithDetails,
  uploadMetadata,
  // waitForTransaction,
} from '@smart-invoice/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits, Hash, isAddress, parseUnits } from 'viem';
import { useWalletClient } from 'wagmi';

export type AddMilestonesProps = {
  invoice: Invoice;
  due: bigint;
  tokenData: Record<ChainId, Record<string, TokenData>>;
};

export function AddMilestones({ invoice, due, tokenData }: AddMilestonesProps) {
  const { data: walletClient } = useWalletClient();
  const {
    address,
    token,
    amounts,
    deposits,
    projectName,
    projectDescription,
    projectAgreement,
    resolutionRate,
    startDate,
    endDate,
  } = invoice ?? {};
  const { decimals, symbol } = useMemo(
    () => getTokenInfo(walletClient?.chain?.id, token, tokenData),
    [walletClient, token, tokenData],
  );
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash>();

  const [addedTotal, setAddedTotal] = useState(BigInt(0));
  const [addedTotalInput, setAddedTotalInput] = useState(0);
  const [addedMilestones, setAddedMilestones] = useState(0);
  const [milestoneAmountsInput, setMilestoneAmountsInput] = useState(
    [] as number[],
  );
  const [milestoneAmounts, setMilestoneAmounts] = useState([] as bigint[]);
  const [addedTotalInvalid, setAddedTotalInvalid] = useState(false);
  const [addedMilestonesInvalid, setAddedMilestonesInvalid] = useState(false);
  const [revisedProjectAgreement, setRevisedProjectAgreement] =
    useState(projectAgreement);
  const defaultSrc =
    projectAgreement && projectAgreement.length > 0
      ? projectAgreement[projectAgreement.length - 1].src
      : '';
  const [revisedProjectAgreementSrc, setRevisedProjectAgreementSrc] =
    useState(defaultSrc);
  const defaultProjectType =
    projectAgreement && projectAgreement.length > 0
      ? projectAgreement[projectAgreement.length - 1].type
      : '';

  const [revisedProjectAgreementType, setRevisedProjectAgreementType] =
    useState(defaultProjectType);
  const [remainingFunds, setRemainingFunds] = useState(0);

  useEffect(() => {
    if (!amounts) return;

    const totalAmounts = formatUnits(
      amounts.reduce((a: any, b: any) => a + BigInt(b), BigInt(0)),
      decimals,
    );

    if (deposits && deposits.length > 0) {
      const depositAmounts = [] as bigint[];

      for (let i = 0; i < deposits.length; i++) {
        depositAmounts.push(deposits[i].amount);
      }
      const totalDeposits = formatUnits(
        depositAmounts.reduce((a, b) => a + b),
        decimals,
      );

      const remaining = parseInt(totalAmounts) - parseInt(totalDeposits);
      setRemainingFunds(remaining);
    } else {
      setRemainingFunds(parseInt(totalAmounts));
    }
  }, [amounts, deposits, decimals]);

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const createdAt = BigInt(Date.now());
    const newProjectAgreement = {
      id: createdAt.toString(),
      type: revisedProjectAgreementType,
      src: revisedProjectAgreementSrc,
      createdAt,
    };
    setRevisedProjectAgreement([
      ...(projectAgreement ?? []),
      newProjectAgreement,
    ]);
  }, [
    revisedProjectAgreementSrc,
    revisedProjectAgreementType,
    projectAgreement,
  ]);
  const addNewMilestones = async () => {
    if (!milestoneAmounts.length) return;
    try {
      setLoading(true);
      let detailsHash: Hash | undefined;
      if (revisedProjectAgreementType === 'ipfs') {
        const localProjectAgreement = revisedProjectAgreement;
        detailsHash = '0x';
        // detailsHash = await uploadMetadata({
        //   projectName,
        //   projectDescription,
        //   projectAgreement: localProjectAgreement,
        //   startDate: Math.floor(Number(startDate) / 1000),
        //   endDate: Math.floor(Number(endDate) / 1000),
        // });
      }

      if (walletClient) {
        let hash: Hash | undefined;
        const validAddress = address && isAddress(address);
        if (!validAddress) return;
        if (detailsHash) {
          hash = '0x'; // await addMilestonesWithDetails(
          //   walletClient,
          //   validAddress,
          //   milestoneAmounts,
          //   detailsHash,
          // );
        } else {
          hash = '0x'; // await addMilestones(
          //   walletClient,
          //   validAddress,
          //   milestoneAmounts,
          // );
        }

        setTxHash(hash);
        const { chain } = walletClient;
        // await waitForTransaction(chain, hash);
        window.location.href = `/invoice/${chain.id.toString(16)}/${address}`;
      }
    } catch (addMilestonesError) {
      setLoading(false);
      logError({ addMilestonesError });
    }
  };

  return (
    <VStack w="100%" spacing="1rem">
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

      {revisedProjectAgreementType === 'ipfs' ? (
        <div />
      ) : (
        // <LinkInput
        //   label="Link to Project Agreement (if updated)"
        //   setValue={setRevisedProjectAgreementSrc}
        //   linkType={revisedProjectAgreementType}
        //   setLinkType={setRevisedProjectAgreementType}
        //   backgroundColor="white"
        //   tooltip="Link to the original agreement was an IPFS hash. Therefore, if any revisions were made to the agreement in correlation to the new milestones, please include the new link to it. This will be referenced in the case of a dispute."
        // />
        ''
      )}

      <SimpleGrid
        w="100%"
        columns={{ base: 2, sm: 2 }}
        spacing="1rem"
        mb={addedTotalInvalid ? '-0.5rem' : ''}
      >
        {/* <Input
          label="Total Payment Added"
          type="number"
          color="black"
          value={addedTotalInput}
          isInvalid={addedTotalInvalid}
          setValue={v => {
            if (v && !Number.isNaN(Number(v))) {
              setAddedTotalInput(Number(v));
              const p = parseUnits(v, decimals);
              setAddedTotal(p);
              setAddedTotalInvalid(p < 0);
            } else {
              setAddedTotalInput(Number(v));
              setAddedTotal(BigInt(0));
              setAddedTotalInvalid(true);
            }
          }}
        />

        <Input
          gridArea={{ base: '2/1/2/span 2', sm: 'auto/auto/auto/auto' }}
          label="Number of Payments"
          color="black"
          type="number"
          value={addedMilestones}
          isInvalid={addedMilestonesInvalid}
          setValue={v => {
            const numMilestones = v ? Number(v) : 1;
            setAddedMilestones(numMilestones);
            setMilestoneAmounts(
              Array(numMilestones)
                .fill(1)
                .map(() => BigInt(0)),
            );
            setMilestoneAmountsInput(
              Array(numMilestones)
                .fill(1)
                .map(() => 0),
            );
            setAddedMilestonesInvalid(
              Number.isNaN(Number(v)) || Number(v) === 0,
            );
          }}
          tooltip="Number of milestones in which the total payment will be processed"
        /> */}
      </SimpleGrid>

      <VStack
        w="100%"
        spacing="1rem"
        display={addedMilestones ? 'flex' : 'none'}
      >
        {Array.from(Array(Number(addedMilestones))).map((_val, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <VStack w="100%" spacing="0.5rem" key={index.toString()}>
            <Flex justify="space-between" w="100%">
              <Text fontWeight="700">
                Payment #{amounts?.length ?? 0 + index + 1}
              </Text>

              <Flex />
            </Flex>

            <InputGroup>
              <ChakraInput
                bg="white"
                type="text"
                color="black"
                border="1px"
                borderColor="lightgrey"
                _hover={{ borderColor: 'lightgrey' }}
                pr="3.5rem"
                onChange={e => {
                  if (!e.target.value || Number.isNaN(Number(e.target.value)))
                    return;
                  const amount = parseUnits(e.target.value, decimals);
                  const newAmounts = milestoneAmounts.slice();
                  newAmounts[index] = amount;
                  setMilestoneAmounts(newAmounts);
                  const newAmountsInput = [...milestoneAmountsInput];
                  newAmountsInput[index] = Number(e.target.value);
                  setMilestoneAmountsInput(newAmountsInput);
                  logDebug('Sum of addMilestones: ', milestoneAmounts);
                  logDebug('addedTotal: ', addedTotal);
                }}
              />

              <InputRightElement color="black" w="3.5rem">
                {symbol}
              </InputRightElement>
            </InputGroup>
          </VStack>
        ))}

        <Text w="100%" textAlign="right" color="grey" fontWeight="bold">
          Amounts Must Add Up to {formatUnits(addedTotal, decimals)} {symbol}
        </Text>
      </VStack>

      <Flex color="black" justify="space-between" w="100%" fontSize="sm">
        {due ? (
          <HStack>
            <Text fontWeight="bold" color="black">
              Potential Dispute Fee:
            </Text>

            <Text>
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
            </Text>
          </HStack>
        ) : null}
      </Flex>

      <Flex color="black" justify="space-between" w="100%" fontSize="sm">
        {due ? (
          <HStack>
            <Text fontWeight="bold" color="black">
              Expected Total Due:
            </Text>

            <Text>{`${
              addedTotalInput
                ? parseFloat(formatUnits(due, decimals)) + addedTotalInput
                : formatUnits(due, decimals)
            } ${symbol}`}</Text>
          </HStack>
        ) : null}
      </Flex>

      <Text>
        Note: new milestones may take a few minutes to appear in the list
      </Text>

      <Button
        onClick={addNewMilestones}
        isLoading={loading}
        _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        color="white"
        backgroundColor="blue.1"
        isDisabled={
          milestoneAmountsInput.reduce((t, v) => t + v, 0) !== addedTotalInput
        }
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="bold"
        w="100%"
      >
        Add
      </Button>
      {walletClient?.chain?.id && txHash && (
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
      )}
    </VStack>
  );
}
