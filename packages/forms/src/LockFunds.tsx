import {
  Alert,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { KLEROS_GOOGLE_FORM } from '@smartinvoicexyz/constants';
import {
  FormLock,
  QUERY_KEY_INVOICE_DETAILS,
  useLock,
} from '@smartinvoicexyz/hooks';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import {
  AccountLink,
  LinkInput,
  Textarea,
  useToast,
} from '@smartinvoicexyz/ui';
import { lockFundsSchema } from '@smartinvoicexyz/utils';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { formatUnits, Hex } from 'viem';
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

  const { resolver, resolverFee, resolverInfo, tokenBalance } = _.pick(
    invoice,
    [
      'resolver',
      'resolverFee',
      'resolverInfo',
      'tokenBalance',
      'resolutionRate',
    ],
  );
  const localForm = useForm<FormLock>({
    resolver: yupResolver(lockFundsSchema),
  });
  const { watch, handleSubmit } = localForm;

  const description = watch('description');

  const onTxSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY_INVOICE_DETAILS],
    });

    onClose();
  };

  const { writeAsync: lockFunds, isLoading } = useLock({
    invoice,
    localForm,
    onTxSuccess,
    toast,
  });

  const onSubmit = async () => {
    lockFunds?.();
  };

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
          address={resolver as Hex}
          chainId={chainId}
          resolverInfo={resolverInfo}
        />{' '}
        will review your case, the project agreement and dispute reasoning
        before making a decision on how to fairly distribute remaining funds.
      </Text>
      <Textarea
        name="description"
        tooltip="Why do you want to lock these funds?"
        label="Dispute Reason"
        placeholder="Dispute Reason"
        localForm={localForm}
      />

      <LinkInput
        name="document"
        label="Dispute Attachment"
        tooltip="A URL linking to more details for this dispute. This is optional."
        placeholder="github.com/AcmeAcademy/buidler"
        localForm={localForm}
      />

      <Text textAlign="center">
        {`Upon resolution, a fee of ${resolverFee} will be deducted from the locked fund amount and sent to `}
        <AccountLink
          address={resolver as Hex}
          chainId={chainId}
          resolverInfo={resolverInfo}
        />{' '}
        for helping resolve this dispute.
      </Text>
      <Button
        type="submit"
        isDisabled={
          !description || !lockFunds || tokenBalance?.value === BigInt(0)
        }
        isLoading={isLoading}
        textTransform="uppercase"
        variant="solid"
      >
        {`Lock ${formatUnits(tokenBalance?.value ?? BigInt(0), tokenBalance?.decimals ?? 18)} ${tokenBalance?.symbol}`}
      </Button>
      {resolverInfo?.id === 'kleros' && (
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
      {!!resolverInfo && (
        <Flex justify="center">
          <Link
            href={resolverInfo.termsUrl}
            isExternal
            color="primary.300"
            textDecor="underline"
          >
            Learn about {resolverInfo.name} dispute process & terms
          </Link>
        </Flex>
      )}
    </Stack>
  );
}
