import {
  Checkbox,
  Flex,
  Link,
  SimpleGrid,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useContext, useState } from 'react';

import { CreateContext } from '../context/CreateContext';
import { OrderedInput, OrderedSelect } from '../shared/OrderedInput';
import { RESOLVER_INFO, RESOLVERS, TOKENS } from '../utils/constants';
import { getResolverString, getToken, isKnownResolver } from '../utils/helpers';

export const PaymentDetailsForm = () => {
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
  const tokenData = getToken(paymentToken);
  const { decimals, symbol } = tokenData;
  const [arbitrationProviderType, setArbitrationProviderType] = useState('0');
  const [paymentDueInput, setPaymentDueInput] = useState('');
  const isSmallScreen = useBreakpointValue({ base: true, sm: false });
  return (
    <VStack w="100%" spacing="1rem">
      <OrderedInput
        label="Client Address"
        value={clientAddress}
        setValue={setClientAddress}
        tooltip="This will be the address used to access the invoice"
      />
      <OrderedInput
        label="Provider Address"
        value={paymentAddress}
        setValue={setPaymentAddress}
        tooltip="Recipient of the funds"
      />
      <SimpleGrid w="100%" columns={isSmallScreen ? 2 : 3} spacing="1rem">
        <OrderedInput
          label="Total Payment Due"
          type="number"
          value={paymentDueInput}
          setValue={v => {
            setPaymentDueInput(v);
            if (v && !isNaN(Number(v))) {
              setPaymentDue(utils.parseUnits(v, decimals));
            } else {
              setPaymentDue(BigNumber.from(0));
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
              {getToken(token).symbol}
            </option>
          ))}
        </OrderedSelect>
        {!isSmallScreen && (
          <OrderedInput
            label="Number of Payments"
            type="number"
            value={milestones}
            setValue={v => {
              const numMilestones = v ? Number(v) : 1;
              setMilestones(numMilestones);
              setPayments(
                Array(numMilestones)
                  .fill(1)
                  .map(() => {
                    return BigNumber.from(0);
                  }),
              );
            }}
            tooltip="Number of milestones in which the total payment will be processed"
          />
        )}
      </SimpleGrid>
      {isSmallScreen && (
        <OrderedInput
          label="Number of Payments"
          type="number"
          value={milestones}
          setValue={v => {
            const numMilestones = v ? Number(v) : 1;
            setMilestones(numMilestones);
            setPayments(
              Array(numMilestones)
                .fill(1)
                .map(() => {
                  return BigNumber.from(0);
                }),
            );
          }}
          tooltip="Number of milestones in which the total payment will be processed"
        />
      )}
      <SimpleGrid w="100%" columns={2} spacing="1rem">
        <OrderedSelect
          tooltip="Arbitration provider that will be used incase of a dispute"
          value={arbitrationProviderType}
          setValue={v => {
            setArbitrationProviderType(v);
            if (isKnownResolver(v)) {
              setArbitrationProvider(v);
              setTermsAccepted(false);
            } else {
              setArbitrationProvider('');
              setTermsAccepted(true);
            }
          }}
          label="Arbitration Provider"
        >
          {RESOLVERS.map(res => (
            <option value={res}>RESOLVER_INFO[res].name</option>
          ))}
          <option value="custom">Custom</option>
        </OrderedSelect>
        <OrderedInput
          label="Max Fee"
          type="text"
          value={`${utils.formatUnits(paymentDue.div(20), decimals)} ${symbol}`}
          setValue={() => undefined}
          tooltip="A 5% arbitration fee will be deducted from remaining funds during dispute resolution"
          isDisabled
        />
      </SimpleGrid>
      {!isKnownResolver(arbitrationProvider) ? (
        <OrderedInput
          tooltip="This will be the address used to resolve any disputes on the invoice"
          label="Arbitration Provider Address"
          value={arbitrationProvider}
          setValue={setArbitrationProvider}
        />
      ) : (
        <Flex w="100%" direction="column">
          <Checkbox
            isChecked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
            colorScheme="red"
            border="none"
            size="lg"
            fontSize="1rem"
            color="white"
          >
            {`I agree to ${getResolverString(arbitrationProvider)} `}
            <Link
              href={RESOLVER_INFO[arbitrationProvider].termsUrl}
              isExternal
              textDecor="underline"
            >
              terms of service
            </Link>
          </Checkbox>
        </Flex>
      )}
    </VStack>
  );
};
