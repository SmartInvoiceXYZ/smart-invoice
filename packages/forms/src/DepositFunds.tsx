/* eslint-disable react/no-array-index-key */
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Checkbox,
  // ControlledSelect,
  Flex,
  Heading,
  HStack,
  Link,
  NumberInput,
  Stack,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import {
  // checkedAtIndex,
  // depositedMilestones,
  Invoice,
  // parseTokenAddress,
  // PAYMENT_TYPES,
} from '@smart-invoice/graphql';
import { useDeposit } from '@smart-invoice/hooks';
import { QuestionIcon } from '@smart-invoice/ui';
import {
  commify,
  getNativeTokenSymbol,
  getTxLink,
  getWrappedNativeToken,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatUnits, Hex, parseUnits } from 'viem';
import { useAccount, useBalance, useChainId } from 'wagmi';

export function DepositFunds({
  invoice,
  deposited,
  due,
}: {
  invoice: Invoice;
  deposited: bigint;
  due: bigint;
}) {
  const { token, amounts, currentMilestone } = _.pick(invoice, [
    'token',
    'amounts',
    'currentMilestone',
  ]);
  const chainId = useChainId();
  const { address } = useAccount();

  const TOKEN_DATA = useMemo(
    () => ({
      nativeSymbol: getNativeTokenSymbol(chainId),
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

  const amountsSum = _.sumBy(amounts); // number, not parsed
  // const paidMilestones = depositedMilestones(BigInt(deposited), amounts);

  // const { data: nativeBalance } = useBalance({ address });
  // const { data: tokenBalance } = useBalance({ address, token });
  // const balance =
  //   paymentType?.value === PAYMENT_TYPES.NATIVE
  //     ? nativeBalance?.value
  //     : tokenBalance?.value;
  // const displayBalance =
  //   paymentType?.value === PAYMENT_TYPES.NATIVE
  //     ? nativeBalance?.formatted
  //     : tokenBalance?.formatted;
  // const decimals =
  //   paymentType?.value === PAYMENT_TYPES.NATIVE ? 18 : tokenBalance?.decimals;
  const hasAmount = true;
  // balance > BigInt(amount) * BigInt(10) ** BigInt(decimals || 0);

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
  // const paymentTypeOptions = [
  //   { value: PAYMENT_TYPES.TOKEN, label: parseTokenAddress(chainId, token) },
  //   { value: PAYMENT_TYPES.NATIVE, label: TOKEN_DATA.nativeSymbol },
  // ];

  useEffect(() => {
    // setValue('paymentType', paymentTypeOptions[0]);
    setValue('amount', '0');
  }, []);

  useEffect(() => {
    if (!amount) return undefined;
    return undefined;

    // setValue(
    //   'checked',
    //   depositedMilestones(BigInt(deposited) + parseUnits(amount, 18), amounts),
    // );
  }, [amount, deposited, amounts, setValue]);

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        color="white"
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Pay Invoice
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem" color="whiteAlpha.700">
        At a minimum, you’ll need to deposit enough to cover the{' '}
        {currentMilestone === BigInt(0) ? 'first' : 'next'} project payment.
      </Text>
      <Text textAlign="center" color="purple.400">
        How much will you be depositing today?
      </Text>
      <VStack spacing="0.5rem" align="center">
        {_.map(amounts, (a: number, i: number) => (
          <HStack>
            {/* <Checkbox
              mx="auto"
              key={i.toString()}
              isChecked={checked?.[i]}
              isDisabled={paidMilestones[i]}
              onChange={e => {
                const newChecked = e.target.checked
                  ? checkedAtIndex(i, checked)
                  : checkedAtIndex(i - 1, checked);
                const totAmount = amounts.reduce(
                  (tot: any, cur: any, ind: any) =>
                    newChecked[ind] ? tot + BigInt(cur) : tot,
                  BigInt(0),
                );
                const newAmount =
                  totAmount > BigInt(deposited)
                    ? totAmount - BigInt(deposited)
                    : BigInt(0);

                setValue('amount', formatUnits(newAmount, 18));
              }}
              color="yellow.300"
              border="none"
              size="lg"
              fontSize="1rem"
              fontFamily="texturina"
            >
              <Text>
                Payment #{i + 1} -{'  '}
                {commify(formatUnits(BigInt(a), 18))}{' '}
                {parseTokenAddress(chainId, token)}
              </Text>
            </Checkbox> */}
          </HStack>
        ))}
      </VStack>

      <Text variant="textOne">OR</Text>

      <Stack spacing="0.5rem" align="center" fontFamily="texturina">
        <Flex justify="space-between" w="100%">
          <Text fontWeight="500" color="whiteAlpha.700">
            Enter a Manual Deposit Amount
          </Text>
          {/* {paymentType === PAYMENT_TYPES.NATIVE && (
            <Tooltip
              label={`Your ${
                TOKEN_DATA.nativeSymbol
              } will be automagically wrapped to ${parseTokenAddress(
                chainId,
                token,
              )} tokens`}
              placement="auto-start"
            >
              <QuestionIcon ml="1rem" boxSize="0.75rem" />
            </Tooltip>
          )} */}
        </Flex>

        <Flex>
          {/* <NumberInput
            localForm={localForm}
            name="amount"
            type="number"
            variant="outline"
            placeholder="0"
            color="yellow.500"
            defaultValue="0"
            min={0}
            max={amountsSum}
          /> */}

          <Flex width={250}>
            {TOKEN_DATA.isWrapped ? (
              // <ControlledSelect
              <div>test</div>
            ) : (
              //   options={paymentTypeOptions}
              //   value={paymentType}
              //   onChange={e => {
              //     setValue('paymentType', e);
              //   }}
              //   // width='100%'
              // />
              <div>test</div>
              // parseTokenAddress(chainId, token)
            )}
          </Flex>
        </Flex>
        {/* {BigInt(amount) * BigInt(10) ** BigInt(decimals || 0) > due && (
          <Alert bg="purple.900" borderRadius="md" mt={4}>
            <AlertIcon color="primary.300" />
            <AlertTitle fontSize="sm">
              Your deposit is greater than the total amount due!
            </AlertTitle>
          </Alert>
        )} */}
      </Stack>
      <Flex
        color="white"
        justify="space-between"
        w={due ? '70%' : '50%'}
        fontSize="sm"
        fontFamily="texturina"
      >
        {/* {deposited && (
          <VStack align="flex-start">
            <Text fontWeight="bold">Total Deposited</Text>
            <Text>
              {`${commify(
                formatUnits(BigInt(deposited), 18),
              )} ${parseTokenAddress(chainId, token)}`}
            </Text>
          </VStack>
        )}
        {due && (
          <VStack>
            <Text fontWeight="bold">Total Due</Text>
            <Text>
              {`${formatUnits(BigInt(due), 18)} ${parseTokenAddress(
                chainId,
                token,
              )}`}
            </Text>
          </VStack>
        )} */}
        {/* {displayBalance && (
          <VStack align="flex-end">
            <Text fontWeight="bold">Your Balance</Text>
            <Text>
              {`${_.toNumber(displayBalance).toFixed(2)} ${
                paymentType === 0
                  ? parseTokenAddress(chainId, token)
                  : TOKEN_DATA.nativeSymbol
              }`}
            </Text>
          </VStack>
        )} */}
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
    </VStack>
  );
}
