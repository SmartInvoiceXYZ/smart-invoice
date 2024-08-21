import {
  Alert,
  Button,
  Flex,
  Heading,
  // Image,
  Link,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { KLEROS_GOOGLE_FORM } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { useLock } from '@smartinvoicexyz/hooks';
// import LockImage from '../../assets/lock.svg';
import { AccountLink, Textarea, useToast } from '@smartinvoicexyz/ui';
import {
  getResolverInfo,
  isKnownResolver,
  logDebug,
} from '@smartinvoicexyz/utils';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { Hex } from 'viem';
import { useChainId } from 'wagmi';

export function LockFunds({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetails;
  onClose: () => void;
}) {
  const chainId = useChainId();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { resolver, resolverFee, resolverName, tokenBalance, klerosCourt } =
    _.pick(invoice, [
      'resolver',
      'resolverFee',
      'resolverName',
      'tokenBalance',
      'resolutionRate',
      'klerosCourt',
    ]);
  const localForm = useForm();
  const { watch, handleSubmit } = localForm;

  const disputeReason = watch('disputeReason');
  const amount = tokenBalance?.formatted;

  const onTxSuccess = () => {
    // TODO handle tx success

    // invalidate cache
    queryClient.invalidateQueries({
      queryKey: ['invoiceDetails'],
    });
    queryClient.invalidateQueries({ queryKey: ['extendedInvoiceDetails'] });
    // close modal
    onClose();
  };

  const { writeAsync: lockFunds, writeLoading } = useLock({
    invoice,
    disputeReason,
    amount,
    onTxSuccess,
    toast,
  });

  const onSubmit = async (values: unknown) => {
    logDebug('LockFunds onSubmit', values);

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
          court={klerosCourt}
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
          court={klerosCourt}
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
      {klerosCourt && (
        <Alert bg="red.300" borderRadius="md" color="red.600" gap={2}>
          Note: For Kleros Arbitration you also need to fill out
          <Link
            href={KLEROS_GOOGLE_FORM}
            isExternal
            fontWeight={600}
            color="red.700"
            textDecor="underline"
          >
            this google form
          </Link>
        </Alert>
      )}
      <Flex justify="center">
        {isKnownResolver(resolver as Hex, chainId) && (
          <Link
            href={getResolverInfo(resolver as Hex, chainId).termsUrl}
            isExternal
            color="primary.300"
            textDecor="underline"
          >
            Learn about {resolverName} dispute process & terms
          </Link>
        )}
      </Flex>
    </Stack>
  );
}
