import { ISmartInvoiceEscrowAbi } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { Hex } from 'viem';
import { useBalance, useContractWrite, usePrepareContractWrite } from 'wagmi';

// TODO fix pin

export const useResolve = ({
  invoice,
  awards: {
    client: clientAward,
    provider: providerAward,
    resolver: resolverAward,
  },
  comments,
}: {
  invoice: Invoice;
  awards: {
    client: bigint;
    provider: bigint;
    resolver: bigint;
  };
  comments: string;
}) => {
  const detailsHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  const { data: balance } = useBalance({
    address: invoice?.address as Hex,
    token: invoice?.token as Hex,
  });

  const fullBalance = true;
  // balance.value === clientAward + providerAward + resolverAward;

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: invoice?.address as Hex,
    functionName: 'resolve',
    abi: ISmartInvoiceEscrowAbi,
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
    onSuccess: () => {
      // TODO handle success
    },
    onError: error => {
      // eslint-disable-next-line no-console
      console.log('error', error);
    },
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};
