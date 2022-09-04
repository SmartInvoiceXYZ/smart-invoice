import { Checkbox, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import { CreateContext } from '../context/CreateContext';
import { Web3Context } from '../context/Web3Context';
import { OrderedInput, OrderedSelect } from '../shared/OrderedInput';
import {
  getResolverInfo,
  getResolvers,
  getResolverString,
  getTokenInfo,
  getTokens,
  isKnownResolver,
} from '../utils/helpers';
import { getResolutionRateFromFactory } from '../utils/invoice';

export const PaymentDetailsForm = ({ display, tokenData, allTokens }) => {
  const { chainId, provider } = useContext(Web3Context);
  const RESOLVERS = useMemo(() => getResolvers(chainId), [chainId]);

  const {
    clientAddress,
    setClientAddress,
    paymentAddress,
    setPaymentAddress,
    paymentToken,
    setPaymentToken,
    paymentDue,
    setPaymentDue,
    milestones,
    setMilestones,
    arbitrationProvider,
    setArbitrationProvider,
    setPayments,
    termsAccepted,
    setTermsAccepted,
  } = useContext(CreateContext);

  const TOKENS = useMemo(
    () => getTokens(chainId, allTokens),
    [chainId, allTokens],
  );

  const { decimals, symbol, image } = useMemo(
    () => getTokenInfo(chainId, paymentToken, tokenData),
    [chainId, paymentToken, tokenData],
  );
  const [arbitrationProviderType, setArbitrationProviderType] = useState('0');
  const [paymentDueInput, setPaymentDueInput] = useState('');

  const [clientInvalid, setClientInvalid] = useState(false);
  const [providerInvalid, setProviderInvalid] = useState(false);
  const [resolverInvalid, setResolverInvalid] = useState(false);
  const [paymentInvalid, setPaymentInvalid] = useState(false);
  const [milestonesInvalid, setMilestonesInvalid] = useState(false);
  const [resolutionRate, setResolutionRate] = useState(20);
  // const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    getResolutionRateFromFactory(chainId, provider, arbitrationProvider).then(
      setResolutionRate,
    );
  }, [chainId, provider, arbitrationProvider]);

  return (
    <VStack w="100%" spacing="1rem" display={display}>
      <OrderedInput
        label="Client Address"
        value={clientAddress}
        isInvalid={clientInvalid}
        setValue={v => {
          setClientAddress(v);
          setClientInvalid(!utils.isAddress(v));
        }}
        error={clientInvalid ? 'Invalid Address' : ''}
        tooltip="This will be the address used to access the invoice"
      />
      <OrderedInput
        label="Service Provider Address"
        value={paymentAddress}
        isInvalid={providerInvalid}
        setValue={v => {
          setPaymentAddress(v);
          setProviderInvalid(!utils.isAddress(v));
        }}
        error={providerInvalid ? 'Invalid Address' : ''}
        tooltip="Recipient of the funds"
      />
      <SimpleGrid
        w="100%"
        columns={{ base: 2, sm: 3 }}
        spacing="1rem"
        mb={paymentInvalid ? '-0.5rem' : ''}
      >
        <OrderedInput
          label="Total Payment Due"
          type="number"
          value={paymentDueInput}
          isInvalid={paymentInvalid}
          setValue={v => {
            setPaymentDueInput(v);
            if (v && !isNaN(Number(v))) {
              const p = utils.parseUnits(v, decimals);
              setPaymentDue(p);
              setPaymentInvalid(p.lte(0));
            } else {
              setPaymentDue(BigNumber.from(0));
              setPaymentInvalid(true);
            }
          }}
        />
        <OrderedSelect
          value={paymentToken}
          setValue={setPaymentToken}
          label="Payment Token"
        >
          {TOKENS.map(token => (
            <option value={token} key={token}>
              {getTokenInfo(chainId, token, tokenData).symbol}
            </option>
          ))}
        </OrderedSelect>
        <OrderedInput
          gridArea={{ base: '2/1/2/span 2', sm: 'auto/auto/auto/auto' }}
          label="Number of Payments"
          type="number"
          value={milestones}
          isInvalid={milestonesInvalid}
          setValue={v => {
            const numMilestones = v ? Number(v) : 1;
            setMilestones(v);
            setPayments(
              Array(numMilestones)
                .fill(1)
                .map(() => {
                  return BigNumber.from(0);
                }),
            );
            setMilestonesInvalid(isNaN(Number(v)) || Number(v) === 0);
          }}
          tooltip="Number of milestones in which the total payment will be processed"
        />
      </SimpleGrid>
      {(paymentInvalid || milestonesInvalid) && (
        <Text
          w="100%"
          color="red"
          textAlign="right"
          fontSize="xs"
          fontWeight="700"
        >
          Payment must be greater than 0
        </Text>
      )}
      <SimpleGrid w="100%" columns={2} spacing="1rem">
        <OrderedSelect
          tooltip="Arbitration provider that will be used in case of a dispute"
          value={arbitrationProviderType}
          setValue={v => {
            setArbitrationProviderType(v);
            if (isKnownResolver(chainId, v)) {
              setArbitrationProvider(v);
              setTermsAccepted(false);
            } else {
              setArbitrationProvider('');
              setResolverInvalid(false);
              setTermsAccepted(true);
            }
          }}
          label="Arbitration Provider"
        >
          {RESOLVERS.map(res => (
            <option key={res} value={res}>
              {getResolverInfo(chainId, res).name}
            </option>
          ))}
          <option value="custom">Custom</option>
        </OrderedSelect>
        <OrderedInput
          label="Potential Dispute Fee"
          type="text"
          value={`${utils.formatUnits(
            paymentDue.div(resolutionRate),
            decimals,
          )} ${symbol}`}
          setValue={() => undefined}
          tooltip={`In case a dispute arises, ${
            100 / resolutionRate
          }% of the remaining funds will be deducted towards dispute resolution as an arbitration fee`}
          isDisabled
        />
      </SimpleGrid>
      {!isKnownResolver(chainId, arbitrationProvider) ? (
        <OrderedInput
          tooltip="This will be the address used to resolve any disputes on the invoice"
          label="Arbitration Provider Address"
          value={arbitrationProvider}
          setValue={v => {
            setArbitrationProvider(v);
            setResolverInvalid(!utils.isAddress(v));
          }}
          isInvalid={resolverInvalid}
          error={resolverInvalid ? 'Invalid Address' : ''}
        />
      ) : (
        <Checkbox
          isChecked={termsAccepted}
          onChange={e => setTermsAccepted(e.target.checked)}
          colorScheme="blue"
          size="lg"
          fontSize="1rem"
          color="#323C47"
          borderColor="lightgrey"
        >
          {`I agree to ${getResolverString(chainId, arbitrationProvider)} `}
          <Link
            href={getResolverInfo(chainId, arbitrationProvider).termsUrl}
            isExternal
            textDecor="underline"
          >
            terms of service
          </Link>
        </Checkbox>
      )}
    </VStack>
  );
};
