import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { ChainId } from '@smart-invoice/constants';
import { TokenData } from '@smart-invoice/types';
import { Input, Select } from '@smart-invoice/ui';
import { formatDate, getTokenInfo, getTokens } from '@smart-invoice/utils';
import React, { useContext, useMemo, useState } from 'react';
import { Address, isAddress, parseUnits } from 'viem';
import { useWalletClient } from 'wagmi';

export type InstantPaymentDetailsFormProps = {
  display: string;
  tokenData: Record<ChainId, Record<Address, TokenData>>;
  allTokens: Record<ChainId, Address[]>;
};

export function InstantPaymentDetailsForm({
  display,
  tokenData,
  allTokens,
}: InstantPaymentDetailsFormProps) {
  const { data: walletClient } = useWalletClient();
  const chain = walletClient?.chain?.id;

  // const deadlineDateString = deadline ? formatDate(deadline) : '';

  const TOKENS = useMemo(() => getTokens(allTokens, chain), [chain, allTokens]);

  // const { decimals } = useMemo(
  //   () => getTokenInfo(chain, paymentToken, tokenData),
  //   [chain, paymentToken, tokenData],
  // );
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
      {/* <Input
        label="Client Address"
        value={clientAddress}
        isInvalid={clientInvalid}
        setValue={v => {
          setClientAddress(v);
          setClientInvalid(!isAddress(v));
        }}
        error={clientInvalid ? 'Invalid Address' : ''}
        tooltip="This is the wallet address your client uses to access the invoice, pay with, & release escrow funds with. It’s essential your client has control of this address. (Do NOT use a multi-sig address)."
        required="required"
      />

      <Input
        label="Service Provider Address"
        value={paymentAddress}
        isInvalid={providerInvalid}
        setValue={v => {
          setPaymentAddress(v);
          setProviderInvalid(!isAddress(v));
        }}
        error={providerInvalid ? 'Invalid Address' : ''}
        tooltip="This is the address of the recipient/provider. It’s how you access this invoice & where you’ll receive funds released from escrow. It’s essential you have control of this address. (Do NOT use a multi-sig address)."
        required="required"
      /> */}

      <SimpleGrid
        w="100%"
        columns={{ base: 2, sm: 2 }}
        spacing="1rem"
        mb={paymentInvalid ? '-0.5rem' : ''}
      >
        {/* <Input
          label="Total Payment Due"
          type="number"
          value={paymentDueInput}
          isInvalid={paymentInvalid}
          setValue={v => {
            setPaymentDueInput(v);
            if (v && !Number.isNaN(Number(v))) {
              const p = parseUnits(v, decimals);
              setPaymentDue(p);
              setPaymentInvalid(p <= 0);
            } else {
              setPaymentDue(BigInt(0));
              setPaymentInvalid(true);
            }
          }}
          required="required"
          tooltip="This is the total payment for the entire invoice. This number is not based on fiat, but rather the number of tokens you’ll receive in your chosen cryptocurrency. (e.g. 7.25 WETH, 100 USDC, etc)."
        />

        <Select
          value={paymentToken}
          setValue={setPaymentToken}
          label="Payment Token"
          required="required"
          tooltip="This is the cryptocurrency you’ll receive payment in. The network your wallet is connected to determines which tokens display here. (If you change your wallet network now, you’ll be forced to start the invoice over)."
        >
          {TOKENS.map(token => (
            <option value={token} key={token}>
              {getTokenInfo(chain, token, tokenData).symbol}
            </option>
          ))}
        </Select> */}
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
        {/* <Input
          label="Deadline"
          type="date"
          value={deadlineDateString}
          setValue={v => setDeadline(Date.parse(v))}
          required="optional"
          tooltip="A specific date when the total payment is due."
        />

        <Input
          label="Late Fee"
          type="text"
          value={lateFeeInput}
          setValue={v => {
            setLateFeeInput(v);
            if (v && !Number.isNaN(Number(v))) {
              const p = parseUnits(v, decimals);
              setLateFee(p);
            } else {
              setLateFee(BigInt(0));
            }
          }}
          required="optional"
          tooltip="A fee imposed if the client does not pay by the deadline."
        />

        <Select
          label="Late Fee Interval"
          value={lateFeeIntervalInput}
          setValue={v => {
            setLateFeeIntervalInput(v);
            // eslint-disable-next-line radix
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
        </Select> */}
      </SimpleGrid>
    </VStack>
  );
}
