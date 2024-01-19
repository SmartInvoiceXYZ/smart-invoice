import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import _ from 'lodash';
import { useState } from 'react';
import { Hex } from 'viem';
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

export const useLock = ({
  invoice,
  disputeReason,
  amount,
}: {
  invoice: Invoice;
  disputeReason: string;
  amount: string;
}) => {
  console.log('useLock', invoice);

  const detailsHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);

  // const detailsHash = await uploadDisputeDetails({
  //   reason: disputeReason,
  //   invoice: address,
  //   amount: balance.toString(),
  // });

  const { data: txResult } = useWaitForTransaction({ hash: txHash });

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: invoice?.address as Hex,
    functionName: 'lock',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [detailsHash],
    enabled: !!invoice?.address && !!disputeReason,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async data => {
      console.log('success', data);
      const { hash } = _.pick(data, 'hash');
      setTxHash(hash);

      const result = await waitForTransaction({ hash });

      // handle success
      // close modal
      // update invoice with status
    },
    onError: error => {
      console.log('error', error);
    },
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    txHash,
    writeLoading,
    prepareError,
    writeError,
  };
};
