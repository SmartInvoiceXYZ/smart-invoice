import {
  Button,
  Card,
  Divider,
  Flex,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { Dispute, Resolution } from '@smartinvoicexyz/graphql';
import {
  InvoiceDetails,
  ModalTypes,
  OverlayContextType,
} from '@smartinvoicexyz/types';
import { AccountLink, Modal, QuestionIcon } from '@smartinvoicexyz/ui';
import {
  commify,
  getDateString,
  getIpfsLink,
  getTxLink,
  isEmptyIpfsHash,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { formatUnits, Hex } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import { AddMilestones } from './AddMilestones';

type DisputeWithResolution = {
  dispute: Dispute;
  resolution: Resolution | null;
  resolutionDetails:
    | { distributee: string | undefined; amount: bigint | undefined }[]
    | null;
};

const getDisputesWithResolution = (
  disputes: Dispute[] | undefined,
  resolutions: Resolution[] | undefined,
  resolver: string | undefined,
  client: string | undefined,
  provider: string | undefined,
): DisputeWithResolution[] => {
  const parsed = _.map(disputes, (dispute, i) => {
    const resolution = resolutions?.[i] || null;
    const resolutionDetails = resolution
      ? [
          { distributee: resolver, amount: resolution.resolutionFee },
          { distributee: client, amount: resolution.clientAward },
          { distributee: provider, amount: resolution.providerAward },
        ]
      : null;

    return { dispute, resolution, resolutionDetails };
  });

  return _.reverse([...parsed]);
};

export function InvoicePaymentDetails({
  invoice,
  modals,
  openModal,
  closeModals,
}: {
  invoice: Partial<InvoiceDetails>;
} & OverlayContextType) {
  const { address } = useAccount();
  const isConnected = !!address;
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
    releasedTxs,
    disputes,
    resolutions,
    isReleasable,
    isExpired,
    tokenMetadata,
    depositedMilestonesDisplay,
    depositedTxs,
    metadata,
    isLocked,
    dispute: latestDispute,
    resolution: latestResolution,
  } = _.pick(invoice, [
    'client',
    'provider',
    'deposited',
    'due',
    'total',
    'resolver',
    'releasedTxs',
    'released',
    'amounts',
    'currentMilestoneAmount',
    'isLocked',
    'token',
    'tokenBalance',
    'dispute',
    'disputes',
    'resolution',
    'resolutions',
    'isReleasable',
    'isExpired',
    'tokenMetadata',
    'depositedMilestonesDisplay',
    'depositedTxs',
    'metadata',
  ]);

  const details = [];
  if (deposited) {
    details.push({ label: 'Total Deposited', value: deposited });
  }
  if (released) {
    details.push({ label: 'Total Released', value: released });
  }
  if (due) {
    details.push({ label: 'Remaining Amount Due', value: due });
  }

  let nextAmount = 0n;
  if (currentMilestoneAmount) {
    nextAmount = isReleasable
      ? currentMilestoneAmount
      : currentMilestoneAmount - (tokenBalance?.value ?? 0n);
  }

  const disputesWithResolution = useMemo(
    () =>
      getDisputesWithResolution(
        disputes,
        resolutions,
        resolver,
        client,
        provider,
      ),
    [disputes, resolutions, resolver, client, provider],
  );

  const isValidConnection = isConnected && chainId === invoice?.chainId;

  const isDisputed = (!!latestDispute || !!latestResolution) ?? false;

  const isParty =
    _.toLower(address) === _.toLower(client) ||
    _.toLower(address) === _.toLower(provider);

  const canAddMilestones =
    !isDisputed && !isExpired && !isLocked && isParty && isValidConnection;

  return (
    <>
      <Stack w="100%" spacing={6}>
        {canAddMilestones && (
          <Flex justify="flex-end">
            <Button
              textTransform="uppercase"
              variant="outline"
              onClick={() => openModal(ModalTypes.ADD_MILESTONES)}
            >
              Add Milestone
            </Button>
          </Flex>
        )}
        <Card py={6} direction="column" w="100%">
          <Stack width="100%">
            <Stack w="100%" px={6} spacing={4}>
              <HStack width="100%" justifyContent="space-between">
                <Heading size="md">Total Project Amount</Heading>
                {!!total && (
                  <Heading size="md">
                    {commify(
                      formatUnits(
                        total,
                        tokenBalance?.decimals || tokenMetadata?.decimals || 18,
                      ),
                    )}{' '}
                    {tokenBalance?.symbol || tokenMetadata?.symbol}
                  </Heading>
                )}
              </HStack>
              <Stack align="stretch" spacing="0.25rem">
                {_.map(amounts, (amt, index) => {
                  const depositedText = depositedMilestonesDisplay?.[index];
                  const release = releasedTxs?.[index];
                  const deposit = depositedTxs?.[index];
                  const milestoneMetadata = metadata?.milestones?.[index];
                  const title =
                    milestoneMetadata?.title ?? `Milestone ${index + 1}`;

                  return (
                    <Flex
                      key={title + index}
                      justify="space-between"
                      align="stretch"
                      direction="row"
                    >
                      <HStack align="center" justify="flex-start">
                        <Text>{title}</Text>
                        {milestoneMetadata?.description && (
                          <Tooltip
                            label={milestoneMetadata?.description}
                            placement="auto-start"
                          >
                            <QuestionIcon boxSize="0.75rem" color="gray" />
                          </Tooltip>
                        )}
                      </HStack>

                      <HStack align="center" justify="flex-end">
                        {release && (
                          <Link
                            fontSize="xs"
                            isExternal
                            color="grey"
                            fontStyle="italic"
                            href={getTxLink(invoice?.chainId, release.txHash)}
                          >
                            Released{' '}
                            {new Date(
                              Number(release.timestamp) * 1000,
                            ).toLocaleDateString()}
                          </Link>
                        )}
                        {deposit && !release && (
                          <Link
                            fontSize="xs"
                            isExternal
                            color="grey"
                            fontStyle="italic"
                            href={getTxLink(invoice?.chainId, deposit?.txHash)}
                          >
                            {`${_.capitalize(depositedText)} `}
                            {new Date(
                              Number(deposit?.timestamp) * 1000,
                            ).toLocaleDateString()}
                          </Link>
                        )}

                        <Text textAlign="right" fontWeight="500">
                          {`${commify(
                            formatUnits(
                              BigInt(amt),
                              tokenBalance?.decimals ||
                                tokenMetadata?.decimals ||
                                18,
                            ),
                          )} ${tokenBalance?.symbol || tokenMetadata?.symbol}`}
                        </Text>
                      </HStack>
                    </Flex>
                  );
                })}
              </Stack>
            </Stack>
            <Divider my="1rem" />
            {details && _.size(details) > 0 && (
              <>
                <Stack px={6}>
                  {_.map(_.compact(details), (detail, index) => (
                    <HStack
                      justifyContent="space-between"
                      key={detail.label + index}
                    >
                      <Text>{detail.label}</Text>
                      <Text>
                        {commify(
                          formatUnits(
                            detail.value,
                            tokenBalance?.decimals || 18,
                          ),
                        )}{' '}
                        {tokenBalance?.symbol}
                      </Text>
                    </HStack>
                  ))}
                </Stack>

                <Divider my="1rem" />
              </>
            )}

            {_.size(disputes) === _.size(resolutions) && (
              <>
                <Flex justify="space-between" align="center" px={6}>
                  {isExpired || (due === BigInt(0) && !isReleasable) ? (
                    <>
                      <Heading size="md">Remaining Balance</Heading>
                      <Heading size="md">
                        {`${formatUnits(tokenBalance?.value ?? BigInt(0), tokenBalance?.decimals ?? 18)} ${tokenBalance?.symbol}`}
                      </Heading>
                    </>
                  ) : (
                    <>
                      <Heading size="md">
                        {isReleasable
                          ? 'Next Amount to Release'
                          : 'Total Due Today'}
                      </Heading>
                      <Heading size="md">
                        {`${commify(
                          formatUnits(nextAmount, tokenBalance?.decimals ?? 18),
                        )} ${tokenBalance?.symbol}`}
                      </Heading>
                    </>
                  )}
                </Flex>
                {_.size(disputes) > 0 && <Divider my="1rem" />}
              </>
            )}

            {_.map(
              disputesWithResolution,
              ({ dispute, resolution, resolutionDetails }, i) => (
                <Stack w="100%" px={0} spacing={4} key={dispute.id + i}>
                  {dispute && !resolution && (
                    <Stack px={6}>
                      <Flex
                        justify="space-between"
                        align="center"
                        fontWeight="bold"
                        fontSize="lg"
                      >
                        <Text>
                          Dispute Raised on {getDateString(dispute.timestamp)}
                        </Text>
                        <Text textAlign="right">
                          {`${formatUnits(tokenBalance?.value ?? BigInt(0), tokenBalance?.decimals ?? 18)} ${tokenBalance?.symbol}`}
                        </Text>
                      </Flex>
                      <Text color="black">
                        {`A dispute is in progress with `}
                        <AccountLink
                          address={resolver as Hex}
                          chainId={invoice?.chainId}
                        />
                        <br />
                        {!isEmptyIpfsHash(dispute.ipfsHash) && (
                          <>
                            <Link
                              href={getIpfsLink(dispute.ipfsHash)}
                              color="blue.1"
                              isExternal
                            >
                              <u>View dispute details</u>
                            </Link>
                            <br />
                          </>
                        )}
                        <Link
                          href={getTxLink(invoice?.chainId, dispute.txHash)}
                          color="blue.1"
                          isExternal
                        >
                          <u>View transaction</u>
                        </Link>
                      </Text>
                    </Stack>
                  )}

                  {resolution && (
                    <Stack
                      align="stretch"
                      spacing="1rem"
                      color="primary.300"
                      px={6}
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        fontWeight="bold"
                        fontSize="lg"
                      >
                        <Text>
                          Dispute Resolved on{' '}
                          {getDateString(resolution.timestamp)}
                        </Text>
                        <Text textAlign="right">{`${formatUnits(
                          resolution.clientAward +
                            resolution.providerAward +
                            (resolution.resolutionFee ?? 0n),
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
                              chainId={invoice?.chainId}
                            />
                            {
                              ' has resolved the dispute and dispersed remaining funds'
                            }
                            <br />
                            <br />
                            {!isEmptyIpfsHash(dispute.ipfsHash) && (
                              <>
                                <Link
                                  href={getIpfsLink(dispute.ipfsHash)}
                                  color="blue.1"
                                  isExternal
                                >
                                  <u>View dispute details</u>
                                </Link>
                                <br />
                              </>
                            )}
                            {!isEmptyIpfsHash(resolution.ipfsHash) && (
                              <>
                                <Link
                                  href={getIpfsLink(resolution.ipfsHash)}
                                  isExternal
                                >
                                  <u>View resolution details</u>
                                </Link>
                                <br />
                              </>
                            )}
                            <Link
                              href={getTxLink(
                                invoice?.chainId,
                                resolution.txHash,
                              )}
                              isExternal
                            >
                              <u>View transaction</u>
                            </Link>
                          </Text>
                        </Flex>
                        <Stack spacing="0.5rem" mt={{ base: '1rem', sm: '0' }}>
                          {_.map(
                            _.compact(resolutionDetails),
                            (detail, index) => (
                              <Text
                                textAlign="right"
                                color="purpleLight"
                                key={
                                  (detail.distributee ?? 'distributee') + index
                                }
                              >
                                {`${formatUnits(
                                  detail.amount ?? 0n,
                                  tokenMetadata?.decimals ?? 18,
                                )} ${tokenMetadata?.symbol} to `}
                                <AccountLink
                                  address={detail.distributee as Hex}
                                  chainId={invoice?.chainId}
                                />
                              </Text>
                            ),
                          )}
                        </Stack>
                      </Flex>
                    </Stack>
                  )}
                  {i !== disputesWithResolution.length - 1 && (
                    <Divider my="1rem" />
                  )}
                </Stack>
              ),
            )}
          </Stack>
        </Card>
      </Stack>
      <Modal isOpen={modals?.addMilestones} onClose={closeModals}>
        <AddMilestones invoice={invoice} onClose={closeModals} />
      </Modal>
    </>
  );
}
