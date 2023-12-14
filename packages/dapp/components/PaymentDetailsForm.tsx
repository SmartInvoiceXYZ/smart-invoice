import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Address, formatUnits, isAddress, parseUnits, zeroAddress } from 'viem';
import { useWalletClient } from 'wagmi';

import { Checkbox, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { ChainId } from '../constants/config';
import { CreateContext } from '../context/CreateContext';
import { OrderedInput, OrderedSelect } from '../shared/OrderedInput';
import { TokenData } from '../types';
import {
  getResolverInfo,
  getResolverString,
  getResolvers,
  getTokenInfo,
  getTokens,
  isKnownResolver,
} from '../utils/helpers';
import { getResolutionRateFromFactory } from '../utils/invoice';

export type PaymentDetailsFormProps = {
  display: any;
  tokenData: Record<ChainId, Record<Address, TokenData>>;
  allTokens: Record<ChainId, Address[]>;
};

export function PaymentDetailsForm({ display, tokenData, allTokens }: PaymentDetailsFormProps) {
  const { data: walletClient } = useWalletClient(); 
  const {chain} = walletClient || {};
  const {id:chainId} =chain || {};
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

  const TOKENS = useMemo(() => getTokens(allTokens, chainId), [chainId, allTokens]);

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
    if (!chain || !arbitrationProvider) return;
    getResolutionRateFromFactory(chain, arbitrationProvider).then(
      setResolutionRate,
    );
  }, [arbitrationProvider, chain]);

  useEffect(() => {
    if (paymentDueInput && !Number.isNaN(Number(paymentDueInput))) {
      const p = parseUnits(paymentDueInput, decimals);
      setPaymentDue(p);
      setPaymentInvalid(p <= (0));
    } else {
      setPaymentDue(BigInt(0));
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
          setClientInvalid(!isAddress(v));
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
          setProviderInvalid(!isAddress(v));
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
            if (v && !Number.isNaN(Number(v))) {
              const p = parseUnits(v, decimals);
              setPaymentDue(p);
              setPaymentInvalid(p <= (0));
            } else {
              setPaymentDue(BigInt(0));
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
          {TOKENS.map((token: any) => (
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
          setValue={(v: any) => {
            const numMilestones = v ? Number(v) : 1;
            setMilestones(v);
            setPayments(
              Array(numMilestones)
                .fill(1)
                .map(() => BigInt(0)),
            );
            setMilestonesInvalid(Number.isNaN(Number(v)) || Number(v) === 0);
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
          setValue={(v: Address) => {
            setArbitrationProviderType(v);
            if (isKnownResolver(v, chainId)) {
              setArbitrationProvider(v);
              setTermsAccepted(false);
            } else {
              setArbitrationProvider(zeroAddress);
              setResolverInvalid(false);
              setTermsAccepted(true);
            }
          }}
          label="Arbitration Provider"
        >
          {RESOLVERS.map(res => (
            <option key={res} value={res}>
              {getResolverInfo(res, chainId).name}
            </option>
          ))}
          <option value="custom">Custom</option>
        </OrderedSelect>

        {paymentDue ? (<OrderedInput
          label="Potential Dispute Fee"
          type="text"
          value={`${formatUnits(
            paymentDue * BigInt(resolutionRate) / BigInt(100),
            decimals,
          )} ${symbol}`}
          setValue={() => undefined}
          tooltip={`If a disputed milestone payment goes to arbitration, ${
            resolutionRate / 100
          }% of that milestone’s escrowed funds are automatically deducted as an arbitration fee to resolve the dispute.`}
          isDisabled
        />) : null}
      </SimpleGrid>
      {!arbitrationProvider || !isKnownResolver(arbitrationProvider, chainId) ? (
        <OrderedInput
          tooltip="This arbitrator will be used in case of dispute."
          label="Arbitration Provider Address"
          value={arbitrationProvider}
          setValue={(v: any) => {
            setArbitrationProvider(v);
            setResolverInvalid(!isAddress(v));
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
          {`I agree to ${getResolverString(arbitrationProvider, chainId)} `}

          <Link
            href={getResolverInfo(arbitrationProvider, chainId).termsUrl}
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
