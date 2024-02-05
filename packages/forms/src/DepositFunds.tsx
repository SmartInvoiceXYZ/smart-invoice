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
import { PAYMENT_TYPES, TOASTS } from '@smart-invoice/constants';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { useDeposit } from '@smart-invoice/hooks';
import { NumberInput, QuestionIcon, useToast } from '@smart-invoice/ui';
import {
  commify,
  getNativeTokenSymbol,
  getTxLink,
  getUpdatedCheckAmount,
  getWrappedNativeToken,
} from '@smart-invoice/utils';
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
  invoice: InvoiceDetails;
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
      nativeSymbol: getNativeTokenSymbol(chainId)?.symbol,
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

  const amountsSum = _.sumBy(amounts, _.toNumber); // number, not parsed

  const { data: nativeBalance } = useBalance({ address });
  const { data: tokenBalance } = useBalance({
    address,
    token: tokenMetadata?.address as Hex,
  });
  const balance =
    paymentType?.value === PAYMENT_TYPES.NATIVE
      ? nativeBalance?.value
      : tokenBalance?.value;
  const displayBalance =
    paymentType?.value === PAYMENT_TYPES.NATIVE
      ? nativeBalance?.formatted
      : tokenBalance?.formatted;
  const hasAmount = !!balance && balance > amount; // (+ gasForChain)

  const onTxSuccess = () => {
    toast.success(TOASTS.useDeposit.success);
    // invalidate cache
    queryClient.invalidateQueries({ queryKey: ['invoiceDetails'] });
    queryClient.invalidateQueries({ queryKey: ['extendedInvoiceDetails'] });
    // close modal
    onClose();
  };

  const { handleDeposit, isLoading, isReady } = useDeposit({
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
    setTransaction(result.hash);
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
              <Flex minW="130px">
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
        {!!currentMilestoneAmount && amount > currentMilestoneAmount && (
          <Alert bg="yellow.500" borderRadius="md" mt={4} color="white">
            <AlertIcon color="whiteAlpha.800" />
            <AlertTitle fontSize="sm">
              Your deposit is greater than the total amount due!
            </AlertTitle>
          </Alert>
        )}
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
              {`${commify(
                formatUnits(BigInt(deposited), tokenMetadata?.decimals || 18),
              )} ${tokenMetadata?.symbol}`}
            </Text>
          </Stack>
        )}
        {!!currentMilestoneAmount && (
          <Stack>
            <Text fontWeight="bold">Total Due</Text>
            <Text>
              {`${formatUnits(BigInt(currentMilestoneAmount), tokenMetadata?.decimals || 18)} ${tokenMetadata?.symbol}`}
            </Text>
          </Stack>
        )}
        {displayBalance && (
          <Stack align="flex-end">
            <Text fontWeight="bold">Your Balance</Text>
            <Text>
              {`${_.toNumber(displayBalance).toFixed(2)} ${
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
        isDisabled={amount <= 0 || !isReady || !hasAmount}
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
