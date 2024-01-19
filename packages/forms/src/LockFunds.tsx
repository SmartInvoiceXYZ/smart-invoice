import {
  Button,
  Flex,
  Heading,
  Image,
  Link,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Invoice } from '@smart-invoice/graphql';
import { useLock } from '@smart-invoice/hooks';
// import LockImage from '../../assets/lock.svg';
import { AccountLink } from '@smart-invoice/ui';
import {
  getResolverInfo,
  getResolverString,
  getTxLink,
  isKnownResolver,
  // NETWORK_CONFIG,
  // uploadDisputeDetails,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { formatUnits, Hex } from 'viem';
import { useChainId } from 'wagmi';

const parseTokenAddress = (chainId: number, address: Hex) => address;
// eslint-disable-next-line no-restricted-syntax
// for (const [key, value] of Object.entries(NETWORK_CONFIG[chainId].TOKENS)) {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   if ((value as any).address === _.toLower(address)) {
//     return key;
//   }
// }

export function LockFunds({
  invoice,
  balance,
}: {
  invoice: Invoice;
  balance: bigint;
}) {
  const chainId = useChainId();
  const { resolver, token, resolutionRate } = _.pick(invoice, [
    'resolver',
    'token',
    'resolutionRate',
  ]);

  const localForm = useForm();
  const { watch, handleSubmit } = localForm;

  const fee = formatUnits(
    !resolutionRate || resolutionRate === BigInt(0)
      ? BigInt(0)
      : BigInt(balance) / BigInt(resolutionRate),
    18,
  );
  const feeDisplay =
    token && `${fee} ${parseTokenAddress(chainId, token as Hex)}`;

  const disputeReason = watch('disputeReason');
  const amount = formatUnits(BigInt(balance), 18);

  // const onSuccess = () => {
  //   // handle tx success
  //   // mark locked
  // };

  const {
    writeAsync: lockFunds,
    writeLoading,
    txHash,
  } = useLock({
    invoice,
    disputeReason,
    amount,
  });

  const resolverInfo = getResolverInfo(resolver as Hex, chainId);
  const resolverDisplayName = isKnownResolver(resolver as Hex, chainId)
    ? resolverInfo.name
    : resolver;

  if (writeLoading) {
    return (
      <VStack w="100%" spacing="1rem">
        <Heading
          color="white"
          as="h3"
          fontSize="2xl"
          transition="all ease-in-out .25s"
          _hover={{ cursor: 'pointer', color: 'raid' }}
        >
          Locking Funds
        </Heading>
        {txHash && (
          <Text color="white" textAlign="center" fontSize="sm">
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
        )}
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
      </VStack>
    );
  }

  return (
    <VStack
      w="100%"
      spacing="1rem"
      as="form"
      // onSubmit={handleSubmit(lockFunds)}
    >
      <Heading
        color="white"
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Lock Funds
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem" fontFamily="texturina">
        Locking freezes all remaining funds in the contract and initiates a
        dispute.
      </Text>
      <Text textAlign="center" fontSize="sm" mb="1rem" fontFamily="texturina">
        {'Once a dispute has been initiated, '}
        {/* <AccountLink
          name={resolverDisplayName}
          address={resolver}
          chainId={chainId}
        /> */}
        {
          ' will review your case, the project agreement and dispute reasoning before making a decision on how to fairly distribute remaining funds.'
        }
      </Text>

      {/* <Textarea
        name="disputeReason"
        tooltip="Why do you want to lock these funds?"
        label="Dispute Reason"
        placeholder="Dispute Reason"
        localForm={localForm}
      /> */}
      <Text color="white" textAlign="center" fontFamily="texturina">
        {`Upon resolution, a fee of ${feeDisplay} will be deducted from the locked fund amount and sent to `}
        {/* <AccountLink
          name={resolverDisplayName}
          address={resolver}
          chainId={chainId}
        /> */}
        {' for helping resolve this dispute.'}
      </Text>
      <Button
        type="submit"
        isDisabled={!disputeReason || !lockFunds}
        textTransform="uppercase"
        variant="solid"
      >
        {`Lock ${formatUnits(BigInt(balance), 18)} ${
          token ? parseTokenAddress(chainId, token as Hex) : ''
        }`}
      </Button>
      {/* {isKnownResolver(chainId, resolver) && (
        <Link
          href={getResolverInfo(chainId, resolver).termsUrl}
          isExternal
          color="primary.300"
          textDecor="underline"
        >
          Learn about {getResolverString(chainId, resolver)} dispute process &
          terms
        </Link>
      )} */}
    </VStack>
  );
}
