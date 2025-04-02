import {
  NETWORK_CONFIG,
  SUPPORTED_CHAIN_IDS,
  SupportedChainId,
} from '@smartinvoicexyz/constants';
import { getSubgraphStatus } from '@smartinvoicexyz/graphql';
import { publicClients } from '@smartinvoicexyz/utils';
import useSWR from 'swr';

const SUBGRAPH_STATUS_UPDATE_INTERVAL = 10000;

const getLatestBlockNumber = async (
  chainId: SupportedChainId,
): Promise<number> => {
  const publicClient = publicClients[chainId];
  if (!publicClient) return 0;
  const blockNumber = await publicClient.getBlockNumber();
  return Number(blockNumber);
};

const getSubgraphHealth = async (
  chainId: SupportedChainId,
): Promise<SubgraphHealth> => {
  const [status, latestBlockNumber] = await Promise.all([
    getSubgraphStatus(chainId),
    getLatestBlockNumber(chainId),
  ]);
  const threshold = NETWORK_CONFIG[chainId].SUBGRAPH_HEALTH_THRESHOLD;
  return {
    hasIndexingErrors: status.hasIndexingErrors,
    hasSynced: status.syncedBlockNumber >= latestBlockNumber - threshold,
  };
};

// Create a SWR fetcher
const fetchHealths = async () => {
  const statuses = await Promise.all(
    SUPPORTED_CHAIN_IDS.map(chainId => getSubgraphHealth(chainId)),
  );
  return statuses.reduce(
    (
      acc: Record<SupportedChainId, SubgraphHealth>,
      status: SubgraphHealth,
      index: number,
    ) => {
      acc[SUPPORTED_CHAIN_IDS[index]] = status;
      return acc;
    },
    {} as Record<SupportedChainId, SubgraphHealth>,
  );
};

export type SubgraphHealth = {
  hasIndexingErrors: boolean;
  hasSynced: boolean;
};

export type SubgraphHealthReturnType = {
  health: Record<SupportedChainId, SubgraphHealth> | undefined;
  isLoading: boolean;
  error: Error | null;
};

export const useSubgraphHealth = (): SubgraphHealthReturnType => {
  const { data, error, isValidating, isLoading } = useSWR(
    'subgraph-status',
    fetchHealths,
    {
      refreshInterval: SUBGRAPH_STATUS_UPDATE_INTERVAL,
      revalidateOnFocus: false,
      dedupingInterval: SUBGRAPH_STATUS_UPDATE_INTERVAL / 2,
    },
  );

  return {
    health: data,
    isLoading: (!data && isValidating) || isLoading,
    error: error ?? null,
  };
};
