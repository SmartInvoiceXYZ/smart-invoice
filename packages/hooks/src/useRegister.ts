import { SMART_INVOICE_FACTORY_ABI } from '@smart-invoice/constants';
import _ from 'lodash';
import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { encodeAbiParameters, Hex, parseUnits, stringToHex } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';

// import INVOICE_FACTORY_ABI from './contracts/InvoiceFactory.json';
// import useDetailsPin from './useDetailsPin';

const REQUIRES_VERIFICATION = true;

export const useRegister = ({
  raidId,
  escrowForm,
  detailsData,
  enabled = true,
}: {
  raidId: string;
  escrowForm: UseFormReturn;
  detailsData: any; // ProjectDetails;
  enabled?: boolean;
}) => {
  const { watch } = escrowForm;
  const {
    milestones,
    safetyValveDate,
    provider,
    client: clientAddress,
    token,
  } = watch();

  const chainId = useChainId();

  const providerReceiver: Hex = provider;

  const details = '0x';
  // const { data: details } = useDetailsPin({ ...detailsData });

  const resolver = '0x';
  const tokenAddress = '0x';
  const wrappedNativeToken = '0x';
  const factoryAddress = '0x';
  // const resolver = _.first(
  //   _.keys(_.get(NETWORK_CONFIG[chainId], 'RESOLVERS'))
  // ) as Hex;
  // const tokenAddress = _.get(
  //   NETWORK_CONFIG[chainId],
  //   `TOKENS.${token}.address`
  // );
  // const wrappedNativeToken = _.get(
  //   NETWORK_CONFIG[chainId],
  //   'WRAPPED_NATIVE_TOKEN'
  // );
  // const factoryAddress = _.get(NETWORK_CONFIG[chainId], 'INVOICE_FACTORY');
  const terminationTime = BigInt(Math.floor(safetyValveDate.getTime() / 1000));

  // TODO handle token decimals
  const paymentsInWei = _.map(milestones, ({ value }: { value: string }) =>
    parseUnits(value, 18),
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
  ]);

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: factoryAddress,
    functionName: 'create',
    abi: SMART_INVOICE_FACTORY_ABI,
    args: [
      provider, // address recipient,
      paymentsInWei, // uint256[] memory amounts,
      escrowData, // bytes memory escrowData,
      type, // bytes32 escrowType,
    ],
    enabled:
      !!terminationTime && !_.isEmpty(paymentsInWei) && !!escrowData && enabled,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async tx => {
      // eslint-disable-next-line no-console
      console.log('success', tx);
      // TODO parse invoice address
      const smartInvoiceId = _.get(tx, 'events[0].args.invoice');
      console.log('smartInvoiceId', smartInvoiceId);
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
