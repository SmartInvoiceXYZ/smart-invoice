import {
  Button,
  Flex,
  Heading,
  // Image,
  Link,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { useLock } from '@smart-invoice/hooks';
// import LockImage from '../../assets/lock.svg';
import { AccountLink, Textarea } from '@smart-invoice/ui';
import {
  getResolverInfo,
  getResolverString,
  isKnownResolver,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { Hex, TransactionReceipt } from 'viem';
import { useChainId } from 'wagmi';

export function LockFunds({ invoice }: { invoice: InvoiceDetails }) {
  const chainId = useChainId();
  const { resolver, resolverFee, resolverName, tokenBalance } = _.pick(
    invoice,
    [
      'resolver',
      'resolverFee',
      'resolverName',
      'tokenBalance',
      'resolutionRate',
    ],
  );
  const localForm = useForm();
  const { watch, handleSubmit } = localForm;

  const disputeReason = watch('disputeReason');
  const amount = tokenBalance?.formatted;

  const onTxSuccess = (tx: TransactionReceipt) => {
    // TODO handle tx success
    console.log(tx);
    // toast
    // invalidate cache
    // close modal
  };

  const {
    writeAsync: lockFunds,
    writeLoading,
    prepareError,
  } = useLock({
    invoice,
    disputeReason,
    amount,
    onTxSuccess,
  });
  console.log(lockFunds, prepareError);

  const onSubmit = async (values: any) => {
    lockFunds?.();
  };

  if (writeLoading) {
    return (
      <Stack w="100%" spacing="1rem">
        <Heading
          as="h3"
          fontSize="2xl"
          transition="all ease-in-out .25s"
          _hover={{ cursor: 'pointer', color: 'raid' }}
        >
          Locking Funds
        </Heading>
        {/* {txHash && (
          <Text textAlign="center" fontSize="sm">
            Follow your transaction{' '}
            <Link
              href={getTxLink(chainId, txHash)}
              isExternal
              color="primary.300"
              textDecoration="underline"
            >
              here
            </Link>
          </Text>
        )} */}
        <Flex
          w="100%"
          justify="center"
          align="center"
          minH="7rem"
          my="3rem"
          position="relative"
          color="primary.300"
        >
          <Spinner size="xl" />
        </Flex>
      </Stack>
    );
  }

  return (
    <Stack w="100%" spacing="1rem" as="form" onSubmit={handleSubmit(onSubmit)}>
      <Heading
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Lock Funds
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem">
        Locking freezes all remaining funds in the contract and initiates a
        dispute.
      </Text>
      <Text textAlign="center" fontSize="sm" mb="1rem">
        Once a dispute has been initiated,{' '}
        <AccountLink
          name={resolverName}
          address={resolver as Hex}
          chainId={chainId}
        />{' '}
        will review your case, the project agreement and dispute reasoning
        before making a decision on how to fairly distribute remaining funds.
      </Text>

      <Textarea
        name="disputeReason"
        tooltip="Why do you want to lock these funds?"
        label="Dispute Reason"
        placeholder="Dispute Reason"
        localForm={localForm}
      />
      <Text textAlign="center">
        {`Upon resolution, a fee of ${resolverFee} will be deducted from the locked fund amount and sent to `}
        <AccountLink
          name={resolverName}
          address={resolver as Hex}
          chainId={chainId}
        />{' '}
        for helping resolve this dispute.
      </Text>
      {!!tokenBalance && (
        <Button
          type="submit"
          isDisabled={!disputeReason || !lockFunds}
          textTransform="uppercase"
          variant="solid"
        >
          {`Lock ${tokenBalance?.formatted} ${tokenBalance?.symbol}`}
        </Button>
      )}

      <Flex justify="center">
        {isKnownResolver(resolver as Hex, chainId) && (
          <Link
            href={getResolverInfo(resolver as Hex, chainId).termsUrl}
            isExternal
            color="primary.300"
            textDecor="underline"
          >
            Learn about {getResolverString(resolver as Hex, chainId)} dispute
            process & terms
          </Link>
        )}
      </Flex>
    </Stack>
  );
}
