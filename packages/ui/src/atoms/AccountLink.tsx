import { Flex, Text } from '@chakra-ui/react';
import { KLEROS_LOGO } from '@smart-invoice/constants/src';
import {
  getAccountString,
  getAddressLink,
  getResolverInfo,
  isKnownResolver,
} from '@smart-invoice/utils';
import blockies from 'blockies-ts';
import _ from 'lodash';
import { Address } from 'viem';
import { useChainId } from 'wagmi';

import { ChakraNextLink } from './ChakraNextLink';

export type AccountLinkProps = {
  name?: string;
  address?: Address;
  chainId?: number;
  link?: string;
  court?: number | string | undefined;
};

export function AccountLink({
  name,
  address: inputAddress,
  chainId: inputChainId,
  court,
  link,
}: AccountLinkProps) {
  const walletChainId = useChainId();
  const address = inputAddress as Address;
  const chainId = inputChainId || walletChainId;
  const isResolver = isKnownResolver(address, chainId);
  const blockie = blockies
    .create({ seed: address, size: 8, scale: 16 })
    .toDataURL();

  const displayString =
    name && !name?.startsWith('0x') ? name : getAccountString(address);

  const imageUrl = isResolver
    ? getResolverInfo(address, chainId).logoUrl
    : undefined;

  return (
    <ChakraNextLink
      href={link || getAddressLink(chainId, address)}
      isExternal={!link}
      display="inline-flex"
      textAlign="right"
      bgColor="white"
      px="0.25rem"
      _hover={{
        textDecor: 'none',
        bgColor: '#ECECF3',
      }}
      borderRadius="5px"
      alignItems="center"
      fontWeight="bold"
    >
      <Flex
        as="span"
        borderRadius="50%"
        w="1.1rem"
        h="1.1rem"
        overflow="hidden"
        justify="center"
        align="center"
        bgColor="black"
        // eslint-disable-next-line no-nested-ternary
        bgImage={court ? KLEROS_LOGO : imageUrl ? `url(${imageUrl})` : blockie}
        border="1px solid"
        borderColor="whiteAlpha.200"
        bgSize="cover"
        bgRepeat="no-repeat"
        bgPosition="center center"
      />

      <Text as="span" pl="0.25rem" fontSize="sm">
        {displayString}
      </Text>
    </ChakraNextLink>
  );
}
