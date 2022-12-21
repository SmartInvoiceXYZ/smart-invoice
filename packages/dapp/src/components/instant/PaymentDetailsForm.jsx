import { Checkbox, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useContext, useMemo, useState } from 'react';

import { CreateContext } from '../../context/CreateContext';
import { Web3Context } from '../../context/Web3Context';
import { OrderedInput, OrderedSelect } from '../../shared/OrderedInput';
import { getTokenInfo, getTokens } from '../../utils/helpers';

import { formatDate } from '../../utils/helpers';

export const InstantPaymentDetailsForm = ({
  display,
  tokenData,
  allTokens,
}) => {
  const { chainId, provider } = useContext(Web3Context);

  const {
    clientAddress,
    setClientAddress,
    paymentAddress,
    setPaymentAddress,
    paymentToken,
    setPaymentToken,
    paymentDue,
    setPaymentDue,
    lateFee,
    setLateFee,
    lateFeeInterval,
    setLateFeeInterval,
    invoiceType,
  } = useContext(CreateContext);

  const lateFeeIntervalString = lateFeeInterval
    ? formatDate(lateFeeInterval)
    : '';

  const TOKENS = useMemo(
    () => getTokens(chainId, allTokens),
    [chainId, allTokens],
  );

  const { decimals, symbol } = useMemo(
    () => getTokenInfo(chainId, paymentToken, tokenData),
    [chainId, paymentToken, tokenData],
  );
  const [paymentDueInput, setPaymentDueInput] = useState('');

  const [clientInvalid, setClientInvalid] = useState(false);
  const [providerInvalid, setProviderInvalid] = useState(false);
  const [paymentInvalid, setPaymentInvalid] = useState(false);
  const [milestonesInvalid, setMilestonesInvalid] = useState(false);
  // const [symbols, setSymbols] = useState([]);

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
        tooltip="This is the wallet address your client uses to access the invoice, pay with, & release escrow funds with. It’s essential your client has control of this address. (Do NOT use a multi-sig address)."
        required="required"
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
        tooltip="This is the address of the recipient/provider. It’s how you access this invoice & where you’ll receive funds released from escrow. It’s essential you have control of this address. (Do NOT use a multi-sig address)."
        required="required"
      />
      <SimpleGrid
        w="100%"
        columns={{ base: 2, sm: 2 }}
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
          {TOKENS.map(token => (
            <option value={token} key={token}>
              {getTokenInfo(chainId, token, tokenData).symbol}
            </option>
          ))}
        </OrderedSelect>
        {/* <OrderedInput
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
          tooltip="How many milestone payments will there be for this invoice? (You'll be able to customize the payment amount for each milestone in the next step)."
          required="required"
        /> */}
      </SimpleGrid>
      {(paymentInvalid || milestonesInvalid) && (
        <Text
          w="100%"
          color="red"
          textAlign="left"
          fontSize="xs"
          fontWeight="700"
        >
          Payment must be greater than 0
        </Text>
      )}
      <SimpleGrid w="100%" columns={3} spacing="1rem">
        <OrderedInput
          label="Deadline"
          type="date"
          value={lateFeeIntervalString}
          setValue={v => setLateFeeInterval(Date.parse(v))}
          required="optional"
          tooltip="A specific date when the total payment is due."
        />
        <OrderedInput
          label="Late Fee"
          type="text"
          value={lateFee}
          setValue={e => setLateFee(e)}
          required="optional"
          tooltip={`A fee imposed if the client does not pay by the deadline.`}
        />
        <OrderedInput
          label="Late Fee Interval"
          type="date"
          value={lateFeeIntervalString}
          setValue={v => setLateFeeInterval(Date.parse(v))}
          required="optional"
          tooltip="The time interval in which the late fee will be charged past the deadline continuously until paid off."
        />
      </SimpleGrid>
    </VStack>
  );
};
