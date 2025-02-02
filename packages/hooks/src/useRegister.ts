import { SMART_INVOICE_FACTORY_ABI } from '@smartinvoicexyz/constants';
import { logDebug, logError } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useCallback, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { encodeAbiParameters, Hex, parseUnits, stringToHex } from 'viem';
import { useSimulateContract, useWriteContract } from 'wagmi';

import { SimulateContractErrorType, WriteContractErrorType } from './types';

const REQUIRES_VERIFICATION = true;

interface UseRegister {
  escrowForm: UseFormReturn;
  netwrokConfig: {
    resolver: Hex;
    tokenAddress: Hex;
    wrappedNativeToken: Hex;
    tokenDecimals: number;
    factoryAddress: Hex;
  };
  onSuccess: (invoiceId: string | undefined) => Promise<void>;
  enabled?: boolean;
  details?: `0x${string}` | null;
}

export const useRegister = ({
  escrowForm,
  enabled = true,
  details,
  onSuccess,
  netwrokConfig,
}: UseRegister): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const { watch } = escrowForm;
  const {
    milestones,
    safetyValveDate,
    provider,
    client: clientAddress,
  } = watch();

  const providerReceiver: Hex = provider;

  const { resolver } = netwrokConfig;
  const { tokenAddress } = netwrokConfig;
  const { wrappedNativeToken } = netwrokConfig;
  const { tokenDecimals } = netwrokConfig;
  const { factoryAddress } = netwrokConfig;
  const terminationTime = BigInt(Math.floor(safetyValveDate.getTime() / 1000));

  // TODO handle token decimals
  const paymentsInWei = _.map(milestones, ({ value }: { value: string }) =>
    parseUnits(value, tokenDecimals),
  );

  const resolverType = 0; // 0 for individual, 1 for erc-792 arbitrator
  const type = stringToHex('updatable', { size: 32 });

  const escrowData = useMemo(() => {
    if (
      !clientAddress ||
      !(resolverType === 0 || resolverType === 1) ||
      !resolver ||
      !tokenAddress ||
      !terminationTime ||
      !wrappedNativeToken ||
      !details ||
      !factoryAddress ||
      !provider
    ) {
      return '0x';
    }

    return encodeAbiParameters(
      [
        { type: 'address' }, //     _client,
        { type: 'uint8' }, //       _resolverType,
        { type: 'address' }, //     _resolver,
        { type: 'address' }, //     _token,
        { type: 'uint256' }, //     _terminationTime, // exact termination date in seconds since epoch
        { type: 'bytes32' }, //     _details,
        { type: 'address' }, //     _wrappedNativeToken,
        { type: 'bool' }, //        _requireVerification, // warns the client not to deposit funds until verifying they can release or lock funds
        { type: 'address' }, //     _factory,
        { type: 'address' }, //     _providerReceiver,
      ],
      [
        clientAddress,
        resolverType,
        resolver, // address _resolver (LEX DAO resolver address)
        tokenAddress, // address _token (payment token address)
        terminationTime, // safety valve date
        details, // bytes32 _details detailHash
        wrappedNativeToken,
        REQUIRES_VERIFICATION,
        factoryAddress,
        providerReceiver,
      ],
    );
  }, [
    clientAddress,
    resolverType,
    resolver,
    tokenAddress,
    terminationTime,
    wrappedNativeToken,
    factoryAddress,
    providerReceiver,
    details,
  ]);

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: factoryAddress,
    functionName: 'create',
    abi: SMART_INVOICE_FACTORY_ABI,
    args: [
      provider, // address recipient,
      paymentsInWei, // uint256[] memory amounts,
      escrowData, // bytes memory escrowData,
      type, // bytes32 escrowType,
    ],
    query: {
      enabled:
        !!terminationTime &&
        !_.isEmpty(paymentsInWei) &&
        escrowData !== '0x' &&
        enabled,
    },
  });

  const {
    writeContractAsync,
    isPending: writeLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async tx => {
        logDebug('success', tx);
        const smartInvoiceId = _.get(tx, 'events[0].args.invoice');
        await onSuccess(smartInvoiceId);
      },
      onError: error => {
        logError('error', error);
      },
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      logError('useRegister error', error);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};
