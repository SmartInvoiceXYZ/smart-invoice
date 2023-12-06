import { BigNumber, utils } from 'ethers';
import React, { useContext, useMemo, useState } from 'react';

/* eslint-disable radix */
/* eslint-disable no-restricted-globals */
import { SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { CreateContext } from '../../context/CreateContext';
import { Web3Context } from '../../context/Web3Context';
import { OrderedInput, OrderedSelect } from '../../shared/OrderedInput';
import { formatDate, getTokenInfo, getTokens } from '../../utils/helpers';

export function InstantPaymentDetailsForm({
  display,
  tokenData,
  allTokens
}: any) {
  const { chainId } = useContext(Web3Context);

  const {
    clientAddress,
    setClientAddress,
    paymentAddress,
    setPaymentAddress,
    paymentToken,
    setPaymentToken,
    setPaymentDue,
    setLateFee,
    setLateFeeInterval,
    deadline,
    setDeadline,
  } = useContext(CreateContext);

  const deadlineDateString = deadline ? formatDate(deadline) : '';

  const TOKENS = useMemo(
    () => getTokens(chainId, allTokens),
    [chainId, allTokens],
  );

  const { decimals } = useMemo(
    () => getTokenInfo(chainId, paymentToken, tokenData),
    [chainId, paymentToken, tokenData],
  );
  const [paymentDueInput, setPaymentDueInput] = useState('');

  const [clientInvalid, setClientInvalid] = useState(false);
  const [providerInvalid, setProviderInvalid] = useState(false);
  const [paymentInvalid, setPaymentInvalid] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [milestonesInvalid, setMilestonesInvalid] = useState(false);
  // const [symbols, setSymbols] = useState([]);
  const [lateFeeInput, setLateFeeInput] = useState('');
  const [lateFeeIntervalInput, setLateFeeIntervalInput] = useState('');
  const lateFeeIntervalOptions = [1, 2, 7, 14, 28];

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
        tooltip="This is the wallet address your client uses to access the invoice, pay with, & release escrow funds with. It’s essential your client has control of this address. (Do NOT use a multi-sig address)."
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
          value={deadlineDateString}
          setValue={(v: any) => setDeadline(Date.parse(v))}
          required="optional"
          tooltip="A specific date when the total payment is due."
        />
        
        <OrderedInput
          label="Late Fee"
          type="text"
          value={lateFeeInput}
          setValue={(v: any) => {
            setLateFeeInput(v);
            if (v && !isNaN(Number(v))) {
              const p = utils.parseUnits(v, decimals);
              setLateFee(p);
            } else {
              setLateFee(BigNumber.from(0));
            }
          }}
          required="optional"
          tooltip="A fee imposed if the client does not pay by the deadline."
        />
        
        <OrderedSelect
          label="Late Fee Interval"
          value={lateFeeIntervalInput}
          setValue={(v: any) => {
            setLateFeeIntervalInput(v);
            setLateFeeInterval(parseInt(v) * 1000 * 60 * 60 * 24);
          }}
          required="optional"
          tooltip="The time interval in which the late fee will be charged past the deadline continuously until paid off."
        >
          {lateFeeIntervalOptions.map(interval => (
            <option value={interval} key={interval}>
              {interval > 1 ? `Every ${interval} days` : 'Every day'}
            </option>
          ))}
        </OrderedSelect>
      </SimpleGrid>
    </VStack>
  );
}
