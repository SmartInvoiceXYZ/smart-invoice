import {
  DEFAULT_CHAIN_ID,
  graphUrls,
  isOfTypeChainId,
} from '@smart-invoice/constants';

export * from './log';

export const getGraphUrl = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? graphUrls(chainId)
    : graphUrls(DEFAULT_CHAIN_ID);
