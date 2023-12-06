import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import { ChainId } from '@/constants';
/* eslint-disable no-restricted-globals */
import { Checkbox, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { CreateContext } from '../context/CreateContext';
import { Web3Context } from '../context/Web3Context';
import { OrderedInput, OrderedSelect } from '../shared/OrderedInput';
import {
  getResolverInfo,
  getResolverString,
  getResolvers,
  getTokenInfo,
  getTokens,
  isKnownResolver,
} from '../utils/helpers';
import { getResolutionRateFromFactory } from '../utils/invoice';

export function PaymentDetailsForm({
  display,
  tokenData,
  allTokens
}: any) {
  const { chainId, provider } = useContext(Web3Context);
  const RESOLVERS = useMemo(() => getResolvers(chainId as ChainId), [chainId]);

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

  const { decimals, symbol } = useMemo(
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

  useEffect(() => {
    getResolutionRateFromFactory(chainId, provider, arbitrationProvider).then(
      setResolutionRate,
    );
  }, [chainId, provider, arbitrationProvider]);

  useEffect(() => {
    if (paymentDueInput && !isNaN(Number(paymentDueInput))) {
      const p = utils.parseUnits(paymentDueInput, decimals);
      setPaymentDue(p);
      setPaymentInvalid(p.lte(0));
    } else {
      setPaymentDue(BigNumber.from(0));
      setPaymentInvalid(true);
    }
  }, [paymentToken, paymentDueInput, setPaymentDue, decimals]);

  return (
    
    <VStack w="100%" spacing="1rem" display={display}>
      
      <OrderedInput
        label="Client Address"
        value={clientAddress}
        isInvalid={clientInvalid}
        setValue={(v: any) => {
          setClientAddress(v);
          setClientInvalid(!utils.isAddress(v));
        }}
        error={clientInvalid ? 'Invalid Address' : ''}
        tooltip="This is the wallet address your client uses to access the invoice, pay with, & release escrow funds with. It’s essential your client has control of this address."
        required="required"
      />
      
      <OrderedInput
        label="Service Provider Address"
        value={paymentAddress}
        isInvalid={providerInvalid}
        setValue={(v: any) => {
          setPaymentAddress(v);
          setProviderInvalid(!utils.isAddress(v));
        }}
        error={providerInvalid ? 'Invalid Address' : ''}
        tooltip="This is the address of the recipient/provider. It’s how you access this invoice & where you’ll receive funds released from escrow. It’s essential you have control of this address."
        required="required"
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
          setValue={(v: any) => {
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
          required="required"
          tooltip="This is the total payment for the entire invoice. This number is not based on fiat, but rather the number of tokens you’ll receive in your chosen cryptocurrency. (e.g. 7.25 WETH, 100 USDC, etc)."
        />
        
        <OrderedSelect
          value={paymentToken}
          setValue={setPaymentToken}
          label="Payment Token"
          required="required"
          tooltip="This is the cryptocurrency you’ll receive payment in. The network your wallet is connected to determines which tokens display here. (If you change your wallet network now, you’ll be forced to start the invoice over)."
        >
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          {TOKENS.map((token: any) => <option value={token} key={token}>
            {getTokenInfo(chainId, token, tokenData).symbol}
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          </option>)}
        </OrderedSelect>
        
        <OrderedInput
          gridArea={{ base: '2/1/2/span 2', sm: 'auto/auto/auto/auto' }}
          label="Number of Payments"
          type="number"
          value={milestones}
          isInvalid={milestonesInvalid}
          setValue={(v: any) => {
            const numMilestones = v ? Number(v) : 1;
            setMilestones(v);
            setPayments(
              Array(numMilestones)
                .fill(1)
                .map(() => BigNumber.from(0)),
            );
            setMilestonesInvalid(isNaN(Number(v)) || Number(v) === 0);
          }}
          tooltip="How many milestone payments will there be for this invoice? (You'll be able to customize the payment amount for each milestone in the next step)."
          required="required"
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
          tooltip="This arbitrator will be used in case of dispute. LexDAO is recommended, but you may include the wallet address of your preferred arbitrator."
          value={arbitrationProviderType}
          setValue={(v: any) => {
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
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          {RESOLVERS.map((res: any) => <option key={res} value={res}>
            {getResolverInfo(chainId as ChainId, res).name}
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          </option>)}
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
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
          tooltip={`If a disputed milestone payment goes to arbitration, ${
            100 / resolutionRate
          }% of that milestone’s escrowed funds are automatically deducted as an arbitration fee to resolve the dispute.`}
          isDisabled
        />
      </SimpleGrid>
      {!isKnownResolver(chainId, arbitrationProvider) ? (
        
        <OrderedInput
          tooltip="This arbitrator will be used in case of dispute."
          label="Arbitration Provider Address"
          value={arbitrationProvider}
          setValue={(v: any) => {
            setArbitrationProvider(v);
            setResolverInvalid(!utils.isAddress(v));
          }}
          isInvalid={resolverInvalid}
          error={resolverInvalid ? 'Invalid Address' : ''}
        />
      ) : (
        
        <Checkbox
          isChecked={termsAccepted}
          onChange={(e: any) => setTermsAccepted(e.target.checked)}
          colorScheme="blue"
          size="lg"
          fontSize="1rem"
          color="#323C47"
          borderColor="lightgrey"
        >
          {`I agree to ${getResolverString(chainId, arbitrationProvider)} `}
          
          <Link
            href={getResolverInfo(chainId as ChainId, arbitrationProvider).termsUrl}
            isExternal
            textDecor="underline"
          >
            terms of service
          </Link>
        </Checkbox>
      )}
    </VStack>
  );
}
