import { fetchTypedQuery } from './client';
import { _SubgraphErrorPolicy_ } from './zeus';

const GRAPH_POLL_INTERVAL = 5000;
const GRAPH_NUM_RETRIES = 20;

export const timeout = (ms: number): Promise<void> => {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
};

export type SubgraphStatus = {
  syncedBlockNumber: number;
  hasIndexingErrors: boolean;
};

export const getSubgraphStatus = async (
  chainId: number,
): Promise<SubgraphStatus> => {
  const data = await fetchTypedQuery(chainId)(
    {
      _meta: [
        {},
        {
          block: {
            number: true,
          },
          hasIndexingErrors: true,
        },
      ],
    },
    {
      fetchPolicy: 'network-only',
    },
  );

  const status = {
    // eslint-disable-next-line no-underscore-dangle
    syncedBlockNumber: data?._meta?.block?.number ?? 0,
    // eslint-disable-next-line no-underscore-dangle
    hasIndexingErrors: data?._meta?.hasIndexingErrors ?? false,
  };

  setCachedSubgraphStatus(chainId, status);

  return status;
};

const getSubgraphBlockNumber = async (chainId: number) => {
  try {
    const status = getCachedSubgraphStatus(chainId);
    if (status) return status.syncedBlockNumber;
    const { syncedBlockNumber } = await getSubgraphStatus(chainId);
    return syncedBlockNumber;
  } catch (e) {
    console.error(
      `Failed to get subgraph block number for chain ${chainId}: `,
      e,
    );
    return BigInt(0);
  }
};

export const waitForSubgraphSync = async (
  chainId: number,
  transactionBlockNumber: bigint,
): Promise<boolean> => {
  let subgraphBlockNumber = await getSubgraphBlockNumber(chainId);

  let tries = 0;
  while (
    subgraphBlockNumber < transactionBlockNumber &&
    tries < GRAPH_NUM_RETRIES
  ) {
    // eslint-disable-next-line no-await-in-loop
    await timeout(GRAPH_POLL_INTERVAL);
    tries += 1;
    // eslint-disable-next-line no-await-in-loop
    subgraphBlockNumber = await getSubgraphBlockNumber(chainId);
  }
  return subgraphBlockNumber >= transactionBlockNumber;
};

const createStorageKey = (chainId: number) =>
  `smart-invoice-subgraph-health-${chainId}`;

export const getCachedSubgraphStatus = (
  chainId: number,
): SubgraphStatus | null => {
  const value = window.localStorage.getItem(createStorageKey(chainId));
  if (value) return JSON.parse(value) as SubgraphStatus;
  return null;
};

export const setCachedSubgraphStatus = (
  chainId: number,
  health: SubgraphStatus,
): void =>
  window.localStorage.setItem(
    createStorageKey(chainId),
    JSON.stringify(health),
  );
