import {
  Card,
  Divider,
  Flex,
  HStack,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Invoice } from '@smart-invoice/graphql';
import { useFetchTokens } from '@smart-invoice/hooks/src';
import {
  commify,
  getTokenInfo,
  getTokenSymbol,
  getTxLink,
  // ipfsUrl,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { formatUnits, Hex } from 'viem';
import { useBalance, useChainId } from 'wagmi';

export function InvoicePaymentDetails({ invoice }: { invoice: Invoice }) {
  const chainId = useChainId();

  const {
    released,
    total,
    token,
    address: invoiceAddress,
    isLocked,
    disputes,
    resolutions,
    terminationTime,
    currentMilestone,
    amounts,
    deposits,
    releases,
  } = _.pick(invoice, [
    'resolver',
    'token',
    'total',
    'address',
    'isLocked',
    'disputes',
    'resolutions',
    'terminationTime',
    'releases',
    'released',
    'deposits',
    'amounts',
    'currentMilestone',
  ]);

  // console.log(invoiceAddress, token, chainId);
  const { data: rawTokenData } = useFetchTokens();
  const { tokenData } = _.pick(rawTokenData, ['tokenData']);
  const { data } = useBalance({
    address: invoiceAddress as Hex,
    token: token as Hex,
  });
  const balance = data?.value || BigInt(0);
  // console.log('balance', balance, isLoading, error, status);

  const deposited = released && BigInt(released) + BigInt(balance);
  const due =
    deposited &&
    total &&
    (deposited > total ? BigInt(0) : BigInt(total) - deposited);
  const dispute =
    isLocked && !_.isEmpty(disputes)
      ? disputes?.[_.size(disputes) - 1]
      : undefined;
  const resolution =
    !isLocked && _.isEmpty(resolutions)
      ? undefined
      : resolutions?.[_.size(resolutions) - 1];
  const isExpired = terminationTime
    ? terminationTime <= new Date().getTime() / 1000
    : false;
  const amount =
    Number(currentMilestone) < _.size(amounts)
      ? amounts?.[Number(currentMilestone)]
      : BigInt(0);
  const isReleasable =
    !isLocked && amount ? balance >= BigInt(amount) && balance > 0 : false;
  // const sum = _.sumBy(amounts, _.toNumber);

  const tokenInfo = getTokenInfo(chainId, token, tokenData);

  const details = [
    deposited && { label: 'Total Deposited', value: deposited },
    released && { label: 'Total Released', value: released },
    due && { label: 'Remaining Amount Due', value: due },
  ];

  return (
    <Card py={6} direction="column" width="100%">
      <Stack width="100%">
        <Stack w="100%" px={6} spacing={4}>
          <HStack width="100%" justifyContent="space-between">
            <Text variant="textOne">Total Project Amount</Text>
            {!!total && (
              <Text variant="textOne">
                {commify(formatUnits(total, 18))}{' '}
                {getTokenSymbol(chainId, token, tokenData)}
              </Text>
            )}
          </HStack>
          <Stack align="stretch" spacing="0.25rem">
            {_.map(amounts, (amt, index) => {
              // let tot = BigInt(0);
              // let ind = -1;
              // let full = false;
              // if (!_.isEmpty(deposits)) {
              //   for (let i = 0; i < _.size(deposits); i += 1) {
              //     const newAmount = deposits?.[i]?.amount;
              //     if (!newAmount) break;
              //     tot += newAmount;
              //     console.log(tot);
              //     if (tot > sum) {
              //       ind = i;
              //       console.log(tot, sum, amt, full);
              //       if (tot - sum >= BigInt(amt)) {
              //         full = true;
              //         break;
              //       }
              //     }
              //   }
              // }
              // sum += BigInt(amt);
              const full = false;

              // const totalPayments = _.sum(amounts);
              // const paidPayments = _.difference(
              //   amounts,
              //   _.map(deposits, 'amount'),
              // );
              // const totalDeposits = _.sumBy(deposits, 'amount');
              // console.log(totalPayments, paidPayments, totalDeposits);

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
                    {index < _.toNumber(currentMilestone?.toString()) &&
                      _.size(releases) > index &&
                      !!releases?.[index]?.timestamp && (
                        <Link
                          fontSize="xs"
                          isExternal
                          color="grey"
                          fontStyle="italic"
                          href={getTxLink(chainId, releases?.[index].txHash)}
                        >
                          Released{' '}
                          {new Date(
                            _.toNumber(releases[index].timestamp) * 1000,
                          ).toLocaleDateString()}
                        </Link>
                      )}
                    {!(
                      _.lt(index, currentMilestone) && _.size(releases) > index
                    ) &&
                      index !== -1 &&
                      !!deposits?.[index]?.timestamp && (
                        <Link
                          fontSize="xs"
                          isExternal
                          color="grey"
                          fontStyle="italic"
                          href={getTxLink(chainId, deposits?.[index]?.txHash)}
                        >
                          {full ? '' : 'Partially '}Deposited{' '}
                          {new Date(
                            _.toNumber(deposits?.[index].timestamp) * 1000,
                          ).toLocaleDateString()}
                        </Link>
                      )}
                    <Text
                      textAlign="right"
                      fontWeight="500"
                    >{`${commify(formatUnits(BigInt(amt), 18))} ${getTokenSymbol(
                      chainId,
                      token,
                      tokenData,
                    )}`}</Text>
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
                {commify(formatUnits(detail.value, tokenInfo?.decimals))}{' '}
                {tokenInfo?.symbol}
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
                  {`${formatUnits(
                    balance,
                    18,
                  )} ${getTokenSymbol(chainId, token, tokenData)}`}{' '}
                </Text>
              </>
            ) : (
              <>
                <Text>
                  {isReleasable && 'Next Amount to Release'}
                  {!isReleasable && 'Total Due Today'}
                </Text>
                {!!amount && (
                  <Text textAlign="right">
                    {`${commify(
                      formatUnits(
                        isReleasable
                          ? BigInt(amount)
                          : BigInt(amount) - balance,
                        18,
                      ),
                    )} 
                  ${getTokenSymbol(chainId, token, tokenData)}`}
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
              <Text textAlign="right">{`${formatUnits(balance, 18)}`}</Text>
              {/* ${parseTokenAddress(chainId, invoice.token)}`}</Text> */}
            </Flex>
            <Text color="purple">
              {`A dispute is in progress with `}
              {/* <AccountLink address={resolver} chainId={chainId} /> */}
              <br />
              {/* <Link href={ipfsUrl(dispute.ipfsHash)} isExternal>
                <u>View details on IPFS</u>
              </Link> */}
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
              {/* <Text textAlign="right">{`${formatUnits(
                BigInt(resolution.clientAward) +
                  resolution.providerAward +
                  resolution.resolutionFee
                  ? resolution.resolutionFee
                  : 0,
                18,
              )}`}</Text> */}
              {/* ${parseTokenAddress(chainId, invoice.token)}`}</Text> */}
            </Flex>
            <Flex
              justify="space-between"
              direction={{ base: 'column', sm: 'row' }}
            >
              <Flex flex={1}>
                <Text maxW="300px" color="purple">
                  {/* <AccountLink address={resolver} chainId={chainId} /> */}
                  {' has resolved the dispute and dispersed remaining funds'}
                  <br />
                  <br />
                  {/* <Link href={ipfsUrl(resolution.ipfsHash)} isExternal>
                    <u>View details on IPFS</u>
                  </Link> */}
                  <br />
                  <Link href={getTxLink(chainId, resolution.txHash)} isExternal>
                    <u>View transaction</u>
                  </Link>
                </Text>
              </Flex>
              <Stack spacing="0.5rem" mt={{ base: '1rem', sm: '0' }}>
                {/* {resolution.resolutionFee && (
                  <Text textAlign="right" color="purpleLight">
                    {`${formatUnits(
                      BigInt(resolution.resolutionFee),
                      18,
                    )} ${parseTokenAddress(chainId, invoice.token)} to `}
                    <AccountLink address={resolver} chainId={chainId} />
                  </Text>
                )}
                <Text textAlign="right" color="purpleLight">
                  {`${formatUnits(
                    BigInt(resolution.clientAward),
                    18,
                  )} ${parseTokenAddress(chainId, invoice.token)} to `}
                  <AccountLink address={client} chainId={chainId} />
                </Text>
                <Text textAlign="right" color="purpleLight">
                  {`${formatUnits(
                    BigInt(resolution.providerAward),
                    18,
                  )} ${parseTokenAddress(chainId, invoice.token)} to `}
                  <AccountLink address={invoice.provider} chainId={chainId} />
                </Text> */}
              </Stack>
            </Flex>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
