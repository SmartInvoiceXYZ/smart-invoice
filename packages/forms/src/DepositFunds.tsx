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
import { PAYMENT_TYPES, TOASTS } from '@smartinvoicexyz/constants';
import {
  QUERY_KEY_INVOICE_DETAILS,
  QUERY_KEY_INVOICES,
  useDeposit,
  useTokenBalance,
} from '@smartinvoicexyz/hooks';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import { NumberInput, QuestionIcon, useToast } from '@smartinvoicexyz/ui';
import {
  commify,
  getNativeTokenSymbol,
  getTxLink,
  getUpdatedCheckAmount,
  getWrappedNativeToken,
} from '@smartinvoicexyz/utils';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatUnits, Hex, parseUnits } from 'viem';
import { useAccount, useBalance, useChainId } from 'wagmi';

export function DepositFunds({
  invoice,
  onClose,
}: {
  invoice: Partial<InvoiceDetails>;
  onClose: () => void;
}) {
  const {
    tokenMetadata,
    amounts,
    deposited,
    currentMilestoneNumber,
    currentMilestoneAmount,
    depositedMilestones,
  } = _.pick(invoice, [
    'tokenMetadata',
    'amounts',
    'deposited',
    'currentMilestoneNumber',
    'currentMilestoneAmount',
    'depositedMilestones',
  ]);
  const chainId = useChainId();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const toast = useToast();

  const TOKEN_DATA = useMemo(
    () => ({
      nativeSymbol: getNativeTokenSymbol(chainId),
      wrappedToken: getWrappedNativeToken(chainId),
      isWrapped: _.eq(
        _.toLower(tokenMetadata?.address),
        getWrappedNativeToken(chainId),
      ),
    }),
    [chainId, tokenMetadata?.address],
  );

  const [transaction, setTransaction] = useState<Hex | undefined>();

  const localForm = useForm();
  const { watch, setValue } = localForm;

  const paymentType = watch('paymentType');
  const amount = parseUnits(
    watch('amount', '0'),
    tokenMetadata?.decimals || 18,
  );
  const checked = watch('checked');

  const totalAmount =
    amounts?.reduce((acc, val) => acc + BigInt(val), BigInt(0)) ?? BigInt(0);
  const amountsSum = Number(
    formatUnits(totalAmount, tokenMetadata?.decimals || 18),
  );

  const { data: nativeBalance } = useBalance({ address, chainId });
  const { data: tokenBalance } = useTokenBalance({
    address: address as Hex,
    tokenAddress: tokenMetadata?.address as Hex,
    chainId,
  });

  const balance =
    paymentType?.value === PAYMENT_TYPES.NATIVE
      ? nativeBalance?.value
      : tokenBalance;
  const displayBalance =
    paymentType?.value === PAYMENT_TYPES.NATIVE
      ? formatUnits(
          nativeBalance?.value ?? BigInt(0),
          nativeBalance?.decimals ?? 18,
        )
      : formatUnits(tokenBalance ?? BigInt(0), tokenMetadata?.decimals ?? 18);
  const hasAmount = !!balance && balance > amount; // (+ gasForChain)

  const onTxSuccess = () => {
    toast.success(TOASTS.useDeposit.success);
    // close modal
    onClose();
    // invalidate cache
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY_INVOICE_DETAILS, { address, chainId }],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY_INVOICES],
    });
  };

  const { handleDeposit, isLoading, prepareError } = useDeposit({
    invoice,
    amount,
    hasAmount,
    paymentType: paymentType?.value,
    onTxSuccess,
    toast,
  });

  const depositHandler = async () => {
    const result = await handleDeposit();
    if (!result) return;
    setTransaction(result);
  };
  const paymentTypeOptions = [
    {
      value: PAYMENT_TYPES.TOKEN,
      label: tokenMetadata?.symbol,
    },
    { value: PAYMENT_TYPES.NATIVE, label: TOKEN_DATA.nativeSymbol },
  ];

  useEffect(() => {
    setValue('paymentType', paymentTypeOptions?.[0]);
    setValue('amount', '0');
    if (depositedMilestones) {
      setValue('checked', depositedMilestones);
    }
  }, []);

  return (
    <Stack w="100%" spacing="1rem" color="black" align="center">
      <Heading
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer' }}
      >
        Pay Invoice
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem" color="blackAlpha.700">
        At a minimum, you&apos;ll need to deposit enough to cover the{' '}
        {currentMilestoneNumber === 0 ? 'first' : 'next'} project payment.
      </Text>
      <Text textAlign="center" color="blue.400">
        How much will you be depositing today?
      </Text>
      <Stack spacing="0.5rem" align="center">
        {_.map(amounts, (localAmount: number, i: number) => (
          <Checkbox
            mx="auto"
            key={i.toString()}
            isChecked={checked?.[i]}
            isDisabled={depositedMilestones?.[i]}
            onChange={e => {
              const { updateChecked, updateAmount } = getUpdatedCheckAmount({
                e,
                i,
                previousChecked: checked,
                invoice,
              });

              // update form values
              setValue('checked', updateChecked);
              setValue(
                'amount',
                formatUnits(updateAmount, tokenMetadata?.decimals || 18),
              );
            }}
            color="blue.900"
            border="none"
            size="lg"
            fontSize="1rem"
          >
            <Text>
              Payment #{i + 1} -{'  '}
              {commify(
                formatUnits(BigInt(localAmount), tokenMetadata?.decimals || 18),
              )}{' '}
              {tokenMetadata?.symbol}
            </Text>
          </Checkbox>
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
              label={`Your ${TOKEN_DATA.nativeSymbol} will be automagically wrapped to ${tokenMetadata?.symbol} tokens`}
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
            minW="300px"
            min={0}
            max={amountsSum}
            localForm={localForm}
            rightElement={
              <Flex minW="130px" ml={4}>
                {TOKEN_DATA.isWrapped ? (
                  <Select
                    value={paymentType?.value}
                    onChange={e => {
                      setValue(
                        'paymentType',
                        _.find(
                          paymentTypeOptions,
                          o => o.value === e.target.value,
                        ),
                      );
                    }}
                  >
                    {_.map(paymentTypeOptions, option => (
                      <option key={option.value} value={option.value}>
                        {option.label as string}
                      </option>
                    ))}
                  </Select>
                ) : (
                  tokenMetadata?.symbol
                )}
              </Flex>
            }
          />
        </Flex>
        <Stack gap={4} mt={4}>
          {!!currentMilestoneAmount && amount > currentMilestoneAmount && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertTitle fontSize="sm">
                Your deposit is greater than the total amount due!
              </AlertTitle>
            </Alert>
          )}

          {!hasAmount && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle fontSize="sm">
                Your balance is less than the amount you are trying to deposit!
              </AlertTitle>
            </Alert>
          )}
        </Stack>
      </Stack>
      <Flex
        color="blackAlpha.700"
        justify="space-between"
        w={currentMilestoneAmount ? '70%' : '50%'}
        fontSize="sm"
      >
        {!!deposited && (
          <Stack align="flex-start">
            <Text fontWeight="bold">Total Deposited</Text>
            <Text>
              {commify(
                _.toNumber(
                  formatUnits(BigInt(deposited), tokenMetadata?.decimals || 18),
                ).toFixed(4),
              )}
              {` `}
              {tokenMetadata?.symbol}
            </Text>
          </Stack>
        )}
        {!!currentMilestoneAmount && (
          <Stack>
            <Text fontWeight="bold">Total Due</Text>
            <Text>
              {`${_.toNumber(formatUnits(BigInt(currentMilestoneAmount), tokenMetadata?.decimals || 18)).toFixed(4)} ${tokenMetadata?.symbol}`}
            </Text>
          </Stack>
        )}
        {displayBalance && (
          <Stack align="flex-end">
            <Text fontWeight="bold">Your Balance</Text>
            <Text>
              {`${_.toNumber(displayBalance).toFixed(4)} ${
                paymentType?.value === PAYMENT_TYPES.TOKEN
                  ? tokenMetadata?.symbol
                  : TOKEN_DATA.nativeSymbol
              }`}
            </Text>
          </Stack>
        )}
      </Flex>

      <Button
        onClick={depositHandler}
        isDisabled={amount <= 0 || !!prepareError || !hasAmount}
        isLoading={isLoading}
        textTransform="uppercase"
        variant="solid"
      >
        Deposit
      </Button>
      {transaction && (
        <Text textAlign="center" fontSize="sm">
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
