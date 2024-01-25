import {
  invoiceFactory,
  SMART_INVOICE_FACTORY_ABI,
  wrappedNativeToken,
} from '@smart-invoice/constants';
import { getTokenInfo } from '@smart-invoice/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { encodeAbiParameters, Hex, parseUnits, toHex } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';

import { useFetchTokens } from '.';
import { useDetailsPin } from './useDetailsPin';

interface UseInvoiceCreate {
  projectName: string;
  projectDescription: string;
  projectAgreement: any[];
  client: Hex;
  provider: Hex;
  startDate: number;
  endDate: number;
  safetyValveDate: bigint;
  resolver: Hex;
  customResolver: Hex;
  milestones: { value: number }[];
  token: Hex;
  toast: any;
}

const REQUIRES_VERIFICATION = true;

export const useInvoiceCreate = ({
  projectName,
  projectDescription,
  projectAgreement,
  client,
  provider,
  startDate,
  endDate,
  safetyValveDate,
  resolver,
  customResolver,
  milestones,
  token,
  toast,
}: UseInvoiceCreate) => {
  const chainId = useChainId();

  const localInvoiceFactory = invoiceFactory(chainId);
  const { data } = useFetchTokens();
  const { tokenData } = _.pick(data, ['tokenData']);

  const invoiceToken = getTokenInfo(chainId, token, tokenData);

  const detailsData = {
    projectName,
    projectDescription,
    projectAgreement: _.get(_.first(projectAgreement), 'src'),
    startDate,
    endDate,
  };

  const { data: details } = useDetailsPin({ ...detailsData });

  const escrowData = useMemo(() => {
    if (
      !client ||
      !resolver ||
      !token ||
      !safetyValveDate ||
      !wrappedNativeToken(chainId) ||
      !details ||
      !localInvoiceFactory ||
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
      ],
      [
        client,
        1,
        resolver, // address _resolver (LEX DAO resolver address)
        token, // address _token (payment token address)
        BigInt(new Date(safetyValveDate.toString()).getTime() / 1000), // safety valve date
        details, // bytes32 _details detailHash
        wrappedNativeToken(chainId),
        REQUIRES_VERIFICATION,
        localInvoiceFactory,
      ],
    );
  }, [
    client,
    resolver,
    token,
    details,
    safetyValveDate,
    wrappedNativeToken,
    localInvoiceFactory,
  ]);

  const { config, error: prepareError } = usePrepareContractWrite({
    address: localInvoiceFactory,
    abi: SMART_INVOICE_FACTORY_ABI,
    functionName: 'create',
    args: [
      client,
      _.map(milestones, milestone =>
        parseUnits(_.toString(milestone?.value), invoiceToken?.decimals),
      ),
      escrowData,
      toHex('escrow', { size: 32 }),
    ],
    enabled: escrowData !== '0x' && !!client && !_.isEmpty(milestones),
  });

  const {
    writeAsync,
    error: writeError,
    isLoading,
  } = useContractWrite({
    ...config,
    onSuccess: result => {
      // TODO handle tx catch, subgraph result, and invalidate cache
      console.log(result);
    },
    onError: error => {
      if (
        error.name === 'TransactionExecutionError' &&
        error.message.includes('User rejected the request')
      ) {
        toast.error({
          title: 'Signature rejected!',
          description: 'Please accept the transaction in your wallet',
        });
      } else {
        toast.error({
          title: 'Error occurred!',
          description: 'An error occurred while processing the transaction.',
        });
      }
    },
  });

  return {
    writeAsync,
    prepareError,
    writeError,
    isLoading,
  };
};
