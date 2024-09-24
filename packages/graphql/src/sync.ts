import { fetchTypedQuery } from './client';
import { scalars } from './scalars';
import { _SubgraphErrorPolicy_ } from './zeus';

const GRAPH_POLL_INTERVAL = 5000;
const GRAPH_NUM_RETRIES = 20;

export const timeout = (ms: number): Promise<void> => {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
};

const getSubgraphBlockNumber = async (chainId: number) => {
  try {
    const data = await fetchTypedQuery(chainId, 'query', { scalars })({
      _meta: [
        {},
        {
          block: {
            number: true,
          },
        },
      ],
    });

    // eslint-disable-next-line no-underscore-dangle
    return BigInt(data?._meta?.block?.number ?? 0);
  } catch (e) {
    console.error(
      `Failed to get subgraph block number for chain ${chainId}`,
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
