import { Flex, Link, Text } from '@chakra-ui/react';
import {
  getAddressLink,
  getProfile,
  getResolverInfo,
  getResolverString,
  isKnownResolver,
} from '@smart-invoice/utils';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { useChainId } from 'wagmi';

export type AccountLinkProps = {
  address?: Address;
  chainId?: number;
};

export function AccountLink({
  address: inputAddress,
  chainId: inputChainId,
}: AccountLinkProps) {
  const walletChainId = useChainId();
  const address = _.toLower(inputAddress) as Address;
  const [profile, setProfile] =
    useState<Awaited<ReturnType<typeof getProfile>>>();
  const chainId = inputChainId || walletChainId;
  const isResolver = isKnownResolver(address, chainId);

  useEffect(() => {
    let isSubscribed = true;
    if (!isResolver && isAddress(address)) {
      getProfile(address).then(p => (isSubscribed ? setProfile(p) : undefined));
    }
    return () => {
      isSubscribed = false;
    };
  }, [address, isResolver]);

  let displayString = getResolverString(address, chainId);

  let imageUrl = isResolver
    ? getResolverInfo(address, chainId).logoUrl
    : undefined;

  if (!isResolver && profile) {
    if (profile.name) {
      displayString = profile.name;
    }
    if (profile.imageUrl) {
      imageUrl = profile.imageUrl;
    }
  }

  return (
    <Link
      href={getAddressLink(chainId, address)}
      isExternal
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
        bgImage={imageUrl && `url(${imageUrl})`}
        border="1px solid"
        borderColor="white20"
        bgSize="cover"
        bgRepeat="no-repeat"
        bgPosition="center center"
      />

      <Text as="span" pl="0.25rem" fontSize="sm">
        {displayString}
      </Text>
    </Link>
  );
}
