import { SMART_INVOICE_ESCROW_ABI } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { Hex, TransactionReceipt } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

// TODO fix pin

export const useResolve = ({
  invoice,
  awards: {
    client: clientAward,
    provider: providerAward,
    resolver: resolverAward,
  },
  comments,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  awards: {
    client: bigint;
    provider: bigint;
    resolver: bigint;
  };
  comments: string;
  onTxSuccess: (tx: TransactionReceipt) => void;
  toast: UseToastReturn;
}) => {
  const detailsHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  const chainId = useChainId();
  const { tokenBalance } = _.pick(invoice, ['tokenBalance']);

  const fullBalance =
    tokenBalance?.value === clientAward + providerAward + resolverAward;

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: invoice?.address as Hex,
    functionName: 'resolve',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [clientAward, providerAward, detailsHash],
    enabled:
      !!invoice?.address &&
      fullBalance &&
      // invoice?.isLocked &&
      // balance.value > BigInt(0) &&
      !!comments,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }) => {
      const data = await waitForTransaction({ hash, chainId });

      onTxSuccess?.(data);
    },
    onError: error => errorToastHandler('useResolve', error, toast),
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};
