/* eslint-disable react/no-array-index-key */
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Link,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { PAYMENT_TYPES } from '@smart-invoice/constants/src';
import {
  // checkedAtIndex,
  // depositedMilestones,
  Invoice,
  // PAYMENT_TYPES,
} from '@smart-invoice/graphql';
import { useDeposit, useFetchTokens } from '@smart-invoice/hooks';
import { NumberInput, QuestionIcon } from '@smart-invoice/ui';
import {
  commify,
  depositedMilestones,
  getNativeTokenSymbol,
  getTokenSymbol,
  getTxLink,
  getWrappedNativeToken,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatUnits, Hex, parseUnits } from 'viem';
import { useAccount, useBalance, useChainId } from 'wagmi';

const checkedAtIndex = (index: number, checked: boolean[]) =>
  _.map(checked, (_c, i) => i <= index);

export function DepositFunds({
  invoice,
  deposited,
  due,
}: {
  invoice: Invoice;
  deposited: bigint | undefined;
  due: bigint | undefined;
}) {
  const { token, amounts, currentMilestone } = _.pick(invoice, [
    'token',
    'amounts',
    'currentMilestone',
  ]);
  const chainId = useChainId();
  const { address } = useAccount();
  const { data } = useFetchTokens();
  const { tokenData } = _.pick(data, ['tokenData']);

  const TOKEN_DATA = useMemo(
    () => ({
      nativeSymbol: getNativeTokenSymbol(chainId)?.symbol,
      wrappedToken: getWrappedNativeToken(chainId),
      isWrapped: _.eq(_.toLower(token), getWrappedNativeToken(chainId)),
    }),
    [chainId, token],
  );

  const [transaction, setTransaction] = useState<Hex | undefined>();

  const localForm = useForm();
  const { watch, setValue } = localForm;

  const paymentType = watch('paymentType');
  const amount = watch('amount', '0');
  const checked = watch('checked');

  const amountsSum = _.sumBy(amounts, _.toNumber); // number, not parsed
  const parsedAmounts = _.map(amounts, a =>
    _.toNumber(formatUnits(BigInt(a), 18)),
  );

  const paidMilestones =
    deposited && parsedAmounts
      ? depositedMilestones(BigInt(deposited), parsedAmounts)
      : undefined;

  const { data: nativeBalance } = useBalance({ address });
  const { data: tokenBalance } = useBalance({ address, token: token as Hex });
  const balance =
    paymentType?.value === PAYMENT_TYPES.NATIVE
      ? nativeBalance?.value
      : tokenBalance?.value;
  const displayBalance =
    paymentType?.value === PAYMENT_TYPES.NATIVE
      ? nativeBalance?.formatted
      : tokenBalance?.formatted;
  const decimals =
    paymentType?.value === PAYMENT_TYPES.NATIVE ? 18 : tokenBalance?.decimals;
  const hasAmount =
    !!balance && balance > BigInt(amount) * BigInt(10) ** BigInt(decimals || 0);

  const { handleDeposit, isLoading, isReady } = useDeposit({
    invoice,
    amount,
    hasAmount, // (+ gas)
    paymentType: paymentType?.value,
  });

  const depositHandler = async () => {
    const result = await handleDeposit();
    if (!result) return;
    setTransaction(result.hash);
  };
  const paymentTypeOptions = [
    {
      value: PAYMENT_TYPES.TOKEN,
      label: getTokenSymbol(chainId, token, tokenData),
    },
    { value: PAYMENT_TYPES.NATIVE, label: TOKEN_DATA.nativeSymbol },
  ];

  useEffect(() => {
    setValue('paymentType', paymentTypeOptions?.[0]);
    setValue('amount', '0');
  }, []);

  useEffect(() => {
    if (!amount || !deposited) return;

    setValue(
      'checked',
      depositedMilestones(deposited + parseUnits(amount, 18), parsedAmounts),
    );
  }, [amount, deposited, amounts, setValue]);

  return (
    <Stack w="100%" spacing="1rem" color="black" align="center">
      <Heading
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Pay Invoice
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem" color="blackAlpha.700">
        At a minimum, you&apos;ll need to deposit enough to cover the{' '}
        {currentMilestone === BigInt(0) ? 'first' : 'next'} project payment.
      </Text>
      <Text textAlign="center" color="blue.400">
        How much will you be depositing today?
      </Text>
      <Stack spacing="0.5rem" align="center">
        {_.map(amounts, (a: number, i: number) => (
          <HStack>
            <Checkbox
              mx="auto"
              key={i.toString()}
              isChecked={checked?.[i]}
              isDisabled={paidMilestones?.[i]}
              onChange={e => {
                const newChecked = e.target.checked
                  ? checkedAtIndex(i, checked)
                  : checkedAtIndex(i - 1, checked);
                const totAmount = amounts?.reduce(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tot: any, cur: any, ind: any) =>
                    newChecked[ind] ? tot + BigInt(cur) : tot,
                  BigInt(0),
                );
                const newAmount =
                  deposited && totAmount > BigInt(deposited)
                    ? totAmount - BigInt(deposited)
                    : BigInt(0);

                setValue('amount', formatUnits(newAmount, 18));
              }}
              color="blue.900"
              border="none"
              size="lg"
              fontSize="1rem"
            >
              <Text>
                Payment #{i + 1} -{'  '}
                {commify(formatUnits(BigInt(a), 18))}{' '}
                {getTokenSymbol(chainId, token, tokenData)}
              </Text>
            </Checkbox>
          </HStack>
        ))}
      </Stack>

      <Text>OR</Text>

      <Stack spacing="0.5rem" align="center">
        <HStack>
          <Text fontWeight="500" color="blackAlpha.700">
            Enter a Manual Deposit Amount
          </Text>
          {paymentType === PAYMENT_TYPES.NATIVE ? (
            <Tooltip
              label={`Your ${
                TOKEN_DATA.nativeSymbol
              } will be automagically wrapped to ${getTokenSymbol(
                chainId,
                token,
                tokenData,
              )} tokens`}
              placement="top"
              hasArrow
            >
              <QuestionIcon boxSize="0.75rem" />
            </Tooltip>
          ) : (
            <Box boxSize="0.75rem" />
          )}
        </HStack>

        <Flex>
          <NumberInput
            name="amount"
            type="number"
            variant="outline"
            placeholder="0"
            defaultValue="0"
            min={0}
            max={amountsSum}
            localForm={localForm}
          />

          <Flex width={250}>
            {TOKEN_DATA.isWrapped ? (
              <Select
                value={paymentType?.value}
                onChange={e => {
                  setValue(
                    'paymentType',
                    _.find(paymentTypeOptions, o => o.value === e.target.value),
                  );
                }}
                // width='100%'
              >
                {_.map(paymentTypeOptions, option => (
                  <option key={option.value} value={option.value}>
                    {option.label as string}
                  </option>
                ))}
              </Select>
            ) : (
              getTokenSymbol(chainId, token, tokenData)
            )}
          </Flex>
        </Flex>
        {!!due &&
          BigInt(amount) * BigInt(10) ** BigInt(decimals || 0) > due && (
            <Alert bg="purple.900" borderRadius="md" mt={4}>
              <AlertIcon color="primary.300" />
              <AlertTitle fontSize="sm">
                Your deposit is greater than the total amount due!
              </AlertTitle>
            </Alert>
          )}
      </Stack>
      <Flex
        color="blackAlpha.700"
        justify="space-between"
        w={due ? '70%' : '50%'}
        fontSize="sm"
      >
        {!!deposited && (
          <Stack align="flex-start">
            <Text fontWeight="bold">Total Deposited</Text>
            <Text>
              {`${commify(
                formatUnits(BigInt(deposited), 18),
              )} ${getTokenSymbol(chainId, token, tokenData)}`}
            </Text>
          </Stack>
        )}
        {!!due && (
          <Stack>
            <Text fontWeight="bold">Total Due</Text>
            <Text>
              {`${formatUnits(BigInt(due), 18)} ${getTokenSymbol(
                chainId,
                token,
                tokenData,
              )}`}
            </Text>
          </Stack>
        )}
        {displayBalance && (
          <Stack align="flex-end">
            <Text fontWeight="bold">Your Balance</Text>
            <Text>
              {`${_.toNumber(displayBalance).toFixed(2)} ${
                paymentType?.value === PAYMENT_TYPES.TOKEN
                  ? getTokenSymbol(chainId, token, tokenData)
                  : TOKEN_DATA.nativeSymbol
              }`}
            </Text>
          </Stack>
        )}
      </Flex>

      <Button
        onClick={depositHandler}
        isDisabled={amount <= 0 || !isReady || !hasAmount}
        isLoading={isLoading}
        textTransform="uppercase"
        variant="solid"
      >
        Deposit
      </Button>
      {transaction && (
        <Text color="white" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chainId, transaction)}
            isExternal
            color="primary.300"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )}
    </Stack>
  );
}
