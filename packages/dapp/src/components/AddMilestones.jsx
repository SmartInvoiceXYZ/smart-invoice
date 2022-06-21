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
import { BigNumber, utils } from 'ethers';
import React, { useContext, useState } from 'react';

import { OrderedInput, OrderedLinkInput } from '../shared/OrderedInput';

import { Web3Context } from '../context/Web3Context';
import {
  getHexChainId,
  getTokenInfo,
  getTxLink,
  logError,
} from '../utils/helpers';

import { addMilestones, addMilestonesWithDetails } from '../utils/invoice';
import { uploadMetadata } from '../utils/ipfs';

export const AddMilestones = ({ invoice, due }) => {
  const { chainId, provider } = useContext(Web3Context);
  const {
    address,
    token,
    network,
    amounts,
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
  } = invoice;
  const { decimals, symbol } = getTokenInfo(chainId, token);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();

  const [addedTotal, setAddedTotal] = useState(0);
  const [addedTotalInput, setAddedTotalInput] = useState(0);
  const [addedMilestones, setAddedMilestones] = useState(0);
  const [milestoneAmountsInput, setMilestoneAmountsInput] = useState([]);
  const [milestoneAmounts, setMilestoneAmounts] = useState([]);
  const [addedTotalInvalid, setAddedTotalInvalid] = useState(false);
  const [addedMilestonesInvalid, setAddedMilestonesInvalid] = useState(false);
  const [revisedProjectAgreement, setRevisedProjectAgreement] = useState(
    projectAgreement,
  );

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const addNewMilestones = async () => {
    if (!milestoneAmounts.length) return;
    try {
      setLoading(true);
      let detailsHash;
      if (revisedProjectAgreement && projectAgreement.startsWith('ipfs')) {
        detailsHash = await uploadMetadata({
          projectName,
          projectDescription,
          revisedProjectAgreement,
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
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
      >
        Add New Payment Milestones
      </Heading>

      {projectAgreement.startsWith('ipfs') ? (
        <OrderedLinkInput
          label="Link to Project Agreement (if updated)"
          value={revisedProjectAgreement}
          setValue={setRevisedProjectAgreement}
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
                  bg="black"
                  type="text"
                  color="white"
                  border="none"
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
                <InputRightElement color="white" w="3.5rem">
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
      <Flex color="white" justify="space-between" w="100%" fontSize="sm">
        {due && (
          <HStack>
            <Text fontWeight="bold" color="red.500">
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
      <Button
        onClick={addNewMilestones}
        isLoading={loading}
        colorScheme="red"
        isDisabled={
          milestoneAmountsInput.reduce((t, v) => t + v, 0) !== addedTotalInput
        }
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="normal"
        w="100%"
      >
        Add
      </Button>
      {transaction && (
        <Text color="white" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chainId, transaction.hash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )}
    </VStack>
  );
};
