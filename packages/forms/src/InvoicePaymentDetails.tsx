import {
  Button,
  Card,
  Divider,
  Flex,
  HStack,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { Modals } from '@smart-invoice/types';
import { AccountLink, Modal } from '@smart-invoice/ui';
import { commify, getIpfsLink, getTxLink } from '@smart-invoice/utils';
import _ from 'lodash';
import { formatUnits, Hex } from 'viem';
import { useChainId } from 'wagmi';

import { AddMilestones } from './AddMilestones';

// ! technically not a form

export function InvoicePaymentDetails({
  invoice,
  modals,
  setModals,
}: {
  invoice: InvoiceDetails;
  modals: Modals;
  setModals: (m: Partial<Modals>) => void;
}) {
  const chainId = useChainId();
  const {
    client,
    provider,
    released,
    deposited,
    due,
    total,
    resolver,
    tokenBalance,
    amounts,
    currentMilestoneAmount,
    releases,
    dispute,
    resolution,
    isReleasable,
    isExpired,
    tokenMetadata,
    depositedMilestonesDisplay,
    depositedTxs,
  } = _.pick(invoice, [
    'client',
    'provider',
    'deposited',
    'due',
    'total',
    'resolver',
    'releases',
    'released',
    'amounts',
    'currentMilestoneAmount',
    'tokenBalance',
    'dispute',
    'resolution',
    'isReleasable',
    'isExpired',
    'tokenMetadata',
    'depositedMilestonesDisplay',
    'depositedTxs',
  ]);

  const details = [
    deposited && { label: 'Total Deposited', value: deposited },
    released && { label: 'Total Released', value: released },
    due && { label: 'Remaining Amount Due', value: due },
  ];

  const resolutionDetails = [
    resolution.resolutionFee && {
      distributee: resolver,
      amount: resolution.resolutionFee,
    },
    { distributee: client, amount: resolution.clientAward },
    { distributee: provider, amount: resolution.providerAward },
  ];

  return (
    <>
      <Stack w="100%" spacing={6}>
        <Flex justify="flex-end">
          <Button
            textTransform="uppercase"
            variant="outline"
            onClick={() => setModals({ addMilestones: true })}
          >
            Add Milestone
          </Button>
        </Flex>
        <Card py={6} direction="column" width="100%">
          <Stack width="100%">
            <Stack w="100%" px={6} spacing={4}>
              <HStack width="100%" justifyContent="space-between">
                <Text variant="textOne">Total Project Amount</Text>
                {!!total && (
                  <Text variant="textOne">
                    {commify(formatUnits(total, tokenBalance?.decimals || 18))}{' '}
                    {tokenBalance?.symbol}
                  </Text>
                )}
              </HStack>
              <Stack align="stretch" spacing="0.25rem">
                {_.map(amounts, (amt, index) => {
                  const depositedText = depositedMilestonesDisplay?.[index];
                  const release = releases?.[index];
                  const deposit = depositedTxs?.[index];

                  return (
                    <Flex
                      // eslint-disable-next-line react/no-array-index-key
                      key={index.toString()}
                      justify="space-between"
                      align="stretch"
                      direction="row"
                    >
                      <Text>Milestone #{index + 1}</Text>

                      <HStack align="center" justify="flex-end">
                        {release && (
                          <Link
                            fontSize="xs"
                            isExternal
                            color="grey"
                            fontStyle="italic"
                            href={getTxLink(chainId, release.txHash)}
                          >
                            Released{' '}
                            {new Date(
                              _.toNumber(release.timestamp) * 1000,
                            ).toLocaleDateString()}
                          </Link>
                        )}
                        {deposit && !release && (
                          <Link
                            fontSize="xs"
                            isExternal
                            color="grey"
                            fontStyle="italic"
                            href={getTxLink(chainId, deposit?.txHash)}
                          >
                            {`${_.capitalize(depositedText)} `}
                            {new Date(
                              _.toNumber(deposit?.timestamp) * 1000,
                            ).toLocaleDateString()}
                          </Link>
                        )}

                        <Text textAlign="right" fontWeight="500">
                          {`${commify(
                            formatUnits(
                              BigInt(amt),
                              tokenBalance?.decimals || 18,
                            ),
                          )} ${tokenBalance?.symbol}`}
                        </Text>
                      </HStack>
                    </Flex>
                  );
                })}
              </Stack>
            </Stack>
            <Divider my="1rem" />
            <Stack px={6}>
              {_.map(_.compact(details), detail => (
                <HStack justifyContent="space-between" key={detail.label}>
                  <Text>{detail.label}</Text>
                  <Text>
                    {commify(
                      formatUnits(detail.value, tokenBalance?.decimals || 18),
                    )}{' '}
                    {tokenBalance?.symbol}
                  </Text>
                </HStack>
              ))}
            </Stack>

            <Divider my="1rem" />

            {!dispute && !resolution && (
              <Flex
                justify="space-between"
                align="center"
                fontWeight="bold"
                fontSize="lg"
                px={6}
              >
                {isExpired || (due === BigInt(0) && !isReleasable) ? (
                  <>
                    <Text>Remaining Balance</Text>
                    <Text textAlign="right">
                      {`${tokenBalance?.formatted} ${tokenBalance?.symbol}`}{' '}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text>
                      {isReleasable && 'Next Amount to Release'}
                      {!isReleasable && 'Total Due Today'}
                    </Text>
                    {!!currentMilestoneAmount && (
                      <Text textAlign="right">
                        {`${
                          tokenBalance?.value &&
                          commify(
                            formatUnits(
                              isReleasable
                                ? BigInt(currentMilestoneAmount)
                                : BigInt(currentMilestoneAmount) -
                                    tokenBalance.value,
                              18,
                            ),
                          )
                        } ${tokenBalance?.symbol}`}
                      </Text>
                    )}
                  </>
                )}
              </Flex>
            )}

            {dispute && (
              <Stack w="100%" align="stretch" spacing="1rem">
                <Flex
                  justify="space-between"
                  align="center"
                  fontWeight="bold"
                  fontSize="lg"
                >
                  <Text>Amount Locked</Text>
                  <Text textAlign="right">{`${tokenBalance?.formatted} ${tokenBalance?.symbol}`}</Text>
                </Flex>
                <Text color="purple">
                  {`A dispute is in progress with `}
                  <AccountLink address={resolver as Hex} chainId={chainId} />
                  <br />
                  <Link href={getIpfsLink(dispute.ipfsHash)} isExternal>
                    <u>View details on IPFS</u>
                  </Link>
                  <br />
                  <Link href={getTxLink(chainId, dispute.txHash)} isExternal>
                    <u>View transaction</u>
                  </Link>
                </Text>
              </Stack>
            )}

            {resolution && (
              <Stack align="stretch" spacing="1rem" color="primary.300">
                <Flex
                  justify="space-between"
                  align="center"
                  fontWeight="bold"
                  fontSize="lg"
                >
                  <Text>Amount Dispersed</Text>
                  <Text textAlign="right">{`${formatUnits(
                    BigInt(resolution.clientAward) +
                      resolution.providerAward +
                      resolution.resolutionFee
                      ? resolution.resolutionFee
                      : 0,
                    18,
                  )} ${tokenBalance?.symbol}`}</Text>
                </Flex>
                <Flex
                  justify="space-between"
                  direction={{ base: 'column', sm: 'row' }}
                >
                  <Flex flex={1}>
                    <Text maxW="300px" color="purple">
                      <AccountLink
                        address={resolver as Hex}
                        chainId={chainId}
                      />
                      {
                        ' has resolved the dispute and dispersed remaining funds'
                      }
                      <br />
                      <br />
                      <Link href={getIpfsLink(resolution.ipfsHash)} isExternal>
                        <u>View details on IPFS</u>
                      </Link>
                      <br />
                      <Link
                        href={getTxLink(chainId, resolution.txHash)}
                        isExternal
                      >
                        <u>View transaction</u>
                      </Link>
                    </Text>
                  </Flex>
                  <Stack spacing="0.5rem" mt={{ base: '1rem', sm: '0' }}>
                    {_.map(_.compact(resolutionDetails), detail => (
                      <Text
                        textAlign="right"
                        color="purpleLight"
                        key={detail.distributee}
                      >
                        {`${formatUnits(
                          BigInt(detail.amount),
                          tokenMetadata?.decimals || 18,
                        )} ${tokenMetadata?.symbol} to `}
                        <AccountLink
                          address={detail.distributee as Hex}
                          chainId={chainId}
                        />
                      </Text>
                    ))}
                  </Stack>
                </Flex>
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
      <Modal isOpen={modals?.addMilestones} onClose={() => setModals({})}>
        <AddMilestones invoice={invoice} />
      </Modal>
    </>
  );
}
