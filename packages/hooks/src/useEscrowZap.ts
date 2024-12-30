import {
  ESCROW_ZAP_ABI,
  NETWORK_CONFIG,
  NetworkConfig,
} from '@smartinvoicexyz/constants';
import { logDebug } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useCallback, useMemo } from 'react';
import { encodeAbiParameters, Hex, isAddress, parseUnits } from 'viem';
import { useChainId, useSimulateContract, useWriteContract } from 'wagmi';

import { SimulateContractErrorType, WriteContractErrorType } from './types';

type OwnerAndAllocation = { address: string; percent: number };

const separateOwnersAndAllocations = (
  ownersAndAllocations: OwnerAndAllocation[],
) => {
  const sortedOwnersAndAllocations = _.sortBy(ownersAndAllocations, 'address');

  return {
    owners: _.map(sortedOwnersAndAllocations, 'address'),
    percentAllocations: _.map(
      sortedOwnersAndAllocations,
      (o: OwnerAndAllocation) => _.toNumber(o.percent) * 1e4,
    ),
  };
};

export const useEscrowZap = ({
  ownersAndAllocations,
  provider,
  milestones,
  client,
  threshold,
  arbitration = 0,
  projectTeamSplit = false,
  daoSplit = false,
  safetyValveDate,
  details,
  enabled = true,
  networkConfig = NETWORK_CONFIG,
  token,
  onSuccess,
}: UseEscrowZapProps): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const chainId = useChainId();

  const { owners, percentAllocations } =
    separateOwnersAndAllocations(ownersAndAllocations);
  const saltNonce = Math.floor(new Date().getTime() / 1000);

  const tokenDecimals =
    _.get(networkConfig[chainId], `TOKENS.${token}.decimals`) ?? 18;

  const milestoneAmounts = _.map(
    NETWORK_CONFIG[chainId] ? milestones : [],
    (a: { value: string }) => a.value && parseUnits(a.value, tokenDecimals),
  );

  const tokenAddress =
    _.get(networkConfig[chainId], `TOKENS.${token}.address`) ?? '0x0';

  const resolver = daoSplit
    ? (_.first(_.keys(_.get(networkConfig[chainId], 'RESOLVERS'))) as Hex)
    : (networkConfig[chainId].DAO_ADDRESS ?? '');

  const encodedSafeData = useMemo(() => {
    if (!threshold || !saltNonce)
      return encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'uint256' }],
        [BigInt(0), BigInt(0)],
      );

    return encodeAbiParameters(
      [{ type: 'uint256' }, { type: 'uint256' }],
      [BigInt(threshold), BigInt(saltNonce)],
    );
  }, [threshold, saltNonce]);
  logDebug('encodeSafeData - ', {
    threshold,
    saltNonce,
    compiledData: !!encodedSafeData,
  });

  const encodedSplitData = useMemo(
    () =>
      encodeAbiParameters(
        [{ type: 'bool' }, { type: 'bool' }],
        [projectTeamSplit, daoSplit],
      ),
    [projectTeamSplit, daoSplit],
  );
  logDebug('encodeSplitData - ', {
    projectTeamSplit,
    daoSplit,
    compiledData: !!encodedSplitData,
  });

  const encodedEscrowData = useMemo(() => {
    if (
      !isAddress(client) ||
      !(arbitration === 0 || arbitration === 1) ||
      !details ||
      !isAddress(resolver) ||
      !isAddress(tokenAddress) ||
      !safetyValveDate
    )
      return undefined;

    return encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'uint32' },
        { type: 'address' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'bytes32' },
      ],
      [
        client as Hex,
        arbitration,
        resolver,
        tokenAddress,
        BigInt(Math.floor(_.toNumber(safetyValveDate) / 1000)),
        BigInt(saltNonce),
        details,
      ],
    );
  }, [tokenAddress, safetyValveDate, details, client, arbitration, resolver]);
  logDebug('encodeEscrowData - ', {
    client,
    arbitration,
    resolver,
    tokenAddress,
    safetyValveDate,
    saltNonce,
    details,
    milestoneAmounts,
    compiledData: !!encodedEscrowData,
  });

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
    status,
  } = useSimulateContract({
    chainId,
    address: networkConfig[chainId].ZAP_ADDRESS ?? '0x0',
    abi: ESCROW_ZAP_ABI,
    functionName: 'createSafeSplitEscrow',
    args: [
      owners,
      percentAllocations,
      milestoneAmounts,
      encodedSafeData,
      provider, // _safeAddress
      encodedSplitData,
      encodedEscrowData,
    ],
    query: {
      enabled:
        _.isEqual(_.size(percentAllocations), _.size(owners)) &&
        !_.isEmpty(milestoneAmounts) &&
        !!encodedSafeData &&
        !!provider && // _safeAddress
        !!encodedSplitData &&
        !!encodedEscrowData &&
        enabled,
    },
  });
  logDebug('prepareError', prepareError, status);

  const {
    writeContractAsync,
    isPending: writeLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        onSuccess?.(hash);
      },
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    if (!data) {
      logDebug('writeAsync - no data');
      return undefined;
    }
    return writeContractAsync(data.request);
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading || !details,
    prepareError,
    writeError,
  };
};

interface UseEscrowZapProps {
  ownersAndAllocations: OwnerAndAllocation[];
  provider: Hex | undefined;
  milestones: { value?: string }[];
  client: string;
  threshold?: number;
  arbitration?: number;
  projectTeamSplit?: boolean;
  daoSplit?: boolean;
  token: { value?: string; label?: string };
  safetyValveDate: Date;
  details?: `0x${string}` | null;
  enabled?: boolean;
  networkConfig?: { [key: number]: NetworkConfig }; // to override the default network config
  onSuccess?: (hash: Hex) => void;
}
