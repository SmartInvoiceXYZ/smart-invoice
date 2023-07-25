import {
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  useBreakpointValue,
  VStack,
  HStack,
  SimpleGrid,
} from '@chakra-ui/react';
import { BigNumber, ethers, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import { OrderedInput, OrderedLinkInput } from '../shared/OrderedInput';

import { Web3Context } from '../context/Web3Context';
import {
  getHexChainId,
  getTokenInfo,
  getTxLink,
  logError,
  calculateResolutionFeePercentage,
} from '../utils/helpers';

import { addMilestones, addMilestonesWithDetails } from '../utils/invoice';
import { uploadMetadata } from '../utils/ipfs';

export const AddMilestones = ({ invoice, due, tokenData }) => {
  const { chainId, provider } = useContext(Web3Context);
  const {
    address,
    token,
    network,
    amounts,
    deposits,
    projectName,
    projectDescription,
    projectAgreement,
    resolutionRate,
    startDate,
    endDate,
  } = invoice;
  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();

  const [addedTotal, setAddedTotal] = useState(0);
  const [addedTotalInput, setAddedTotalInput] = useState(0);
  const [addedMilestones, setAddedMilestones] = useState(0);
  const [milestoneAmountsInput, setMilestoneAmountsInput] = useState([]);
  const [milestoneAmounts, setMilestoneAmounts] = useState([]);
  const [addedTotalInvalid, setAddedTotalInvalid] = useState(false);
  const [addedMilestonesInvalid, setAddedMilestonesInvalid] = useState(false);
  const [revisedProjectAgreement, setRevisedProjectAgreement] = useState([
    ...projectAgreement,
  ]);
  const defaultSrc =
    projectAgreement.length > 0
      ? projectAgreement[projectAgreement.length - 1].src
      : '';
  const [revisedProjectAgreementSrc, setRevisedProjectAgreementSrc] =
    useState(defaultSrc);
  const defaultProjectType =
    projectAgreement.length > 0
      ? projectAgreement[projectAgreement.length - 1].type
      : '';

  const [revisedProjectAgreementType, setRevisedProjectAgreementType] =
    useState(defaultProjectType);
  const [remainingFunds, setRemainingFunds] = useState(0);

  useEffect(() => {
    const totalAmounts = utils.formatUnits(
      amounts.reduce(
        (a, b) =>
          parseInt(ethers.utils.formatEther(a)) +
          parseInt(ethers.utils.formatEther(b)),
      ),
      decimals,
    );

    if (deposits.length > 0) {
      let depositAmounts = [];

      for (let i = 0; i < deposits.length; i++) {
        depositAmounts.push(deposits[i].amount);
      }
      const totalDeposits = utils.formatUnits(
        depositAmounts.reduce(
          (a, b) =>
            parseInt(ethers.utils.formatEther(a)) +
            parseInt(ethers.utils.formatEther(b)),
        ),
        decimals,
      );

      const remaining = totalAmounts - totalDeposits;
      setRemainingFunds(remaining);
    } else {
      setRemainingFunds(totalAmounts);
    }
  }, [amounts, deposits, decimals]);

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    setRevisedProjectAgreement([
      ...projectAgreement,
      {
        type: revisedProjectAgreementType,
        src: revisedProjectAgreementSrc,
        createdAt: Date.now().toString(),
      },
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
      let detailsHash;
      if (revisedProjectAgreementType === 'ipfs') {
        let projectAgreement = revisedProjectAgreement;
        detailsHash = await uploadMetadata({
          projectName,
          projectDescription,
          projectAgreement,
          startDate: Math.floor(startDate / 1000),
          endDate: Math.floor(endDate / 1000),
        });
      }

      let tx;
      if (detailsHash) {
        tx = await addMilestonesWithDetails(
          provider,
          address,
          milestoneAmounts,
          detailsHash,
        );
      } else {
        tx = await addMilestones(provider, address, milestoneAmounts);
      }
      setTransaction(tx);
      await tx.wait();
      window.location.href = `/invoice/${getHexChainId(network)}/${address}`;
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
        <OrderedLinkInput
          label="Link to Project Agreement (if updated)"
          value={revisedProjectAgreementSrc}
          setValue={setRevisedProjectAgreementSrc}
          linkType={revisedProjectAgreementType}
          setLinkType={setRevisedProjectAgreementType}
          backgroundColor="white"
          tooltip="Link to the original agreement was an IPFS hash. Therefore, if any revisions were made to the agreement in correlation to the new milestones, please include the new link to it. This will be referenced in the case of a dispute."
        />
      ) : (
        ''
      )}
      <SimpleGrid
        w="100%"
        columns={{ base: 2, sm: 2 }}
        spacing="1rem"
        mb={addedTotalInvalid ? '-0.5rem' : ''}
      >
        <OrderedInput
          label="Total Payment Added"
          type="number"
          color="black"
          value={addedTotalInput}
          isInvalid={addedTotalInvalid}
          setValue={v => {
            if (v && !isNaN(Number(v))) {
              setAddedTotalInput(Number(v));
              const p = utils.parseUnits(v, decimals);
              setAddedTotal(p);
              setAddedTotalInvalid(p.lte(0));
            } else {
              setAddedTotalInput(v);
              setAddedTotal(BigNumber.from(0));
              setAddedTotalInvalid(true);
            }
          }}
        />
        <OrderedInput
          gridArea={{ base: '2/1/2/span 2', sm: 'auto/auto/auto/auto' }}
          label="Number of Payments"
          color="black"
          type="number"
          value={addedMilestones}
          isInvalid={addedMilestonesInvalid}
          setValue={v => {
            const numMilestones = v ? Number(v) : 1;
            setAddedMilestones(v);
            setMilestoneAmounts(
              Array(numMilestones)
                .fill(1)
                .map(() => {
                  return BigNumber.from(0);
                }),
            );
            setMilestoneAmountsInput(
              Array(numMilestones)
                .fill(1)
                .map(() => {
                  return 0;
                }),
            );
            setAddedMilestonesInvalid(isNaN(Number(v)) || Number(v) === 0);
          }}
          tooltip="Number of milestones in which the total payment will be processed"
        />
      </SimpleGrid>

      <VStack
        w="100%"
        spacing="1rem"
        display={addedMilestones ? 'flex' : 'none'}
      >
        {Array.from(Array(Number(addedMilestones))).map((_val, index) => {
          return (
            <VStack w="100%" spacing="0.5rem" key={index.toString()}>
              <Flex justify="space-between" w="100%">
                <Text fontWeight="700">
                  Payment #{amounts.length + index + 1}
                </Text>
                <Flex />
              </Flex>
              <InputGroup>
                <Input
                  bg="white"
                  type="text"
                  color="black"
                  border="1px"
                  borderColor="lightgrey"
                  _hover={{ borderColor: 'lightgrey' }}
                  pr="3.5rem"
                  onChange={e => {
                    if (!e.target.value || isNaN(Number(e.target.value)))
                      return;
                    const amount = utils.parseUnits(e.target.value, decimals);
                    const newAmounts = milestoneAmounts.slice();
                    newAmounts[index] = amount;
                    setMilestoneAmounts(newAmounts);
                    const newAmountsInput = [...milestoneAmountsInput];
                    newAmountsInput[index] = Number(e.target.value);
                    setMilestoneAmountsInput(newAmountsInput);
                    console.log('Sum of addMilestones: ', milestoneAmounts);
                    console.log('addedTotal: ', addedTotal);
                  }}
                />
                <InputRightElement color="black" w="3.5rem">
                  {symbol}
                </InputRightElement>
              </InputGroup>
            </VStack>
          );
        })}
        <Text w="100%" textAlign="right" color="grey" fontWeight="bold">
          Amounts Must Add Up to {utils.formatUnits(addedTotal, decimals)}{' '}
          {symbol}
        </Text>
      </VStack>
      <Flex color="black" justify="space-between" w="100%" fontSize="sm">
        {due && (
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
        )}
      </Flex>
      <Flex color="black" justify="space-between" w="100%" fontSize="sm">
        {due && (
          <HStack>
            <Text fontWeight="bold" color="black">
              Expected Total Due:
            </Text>
            <Text>{`${
              addedTotalInput
                ? parseFloat(utils.formatUnits(due, decimals)) +
                  parseFloat(addedTotalInput)
                : utils.formatUnits(due, decimals)
            } ${symbol}`}</Text>
          </HStack>
        )}
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
      {transaction && (
        <Text color="black" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chainId, transaction.hash)}
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
};
