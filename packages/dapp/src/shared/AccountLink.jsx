import { Flex, Link, Text } from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { theme } from '../theme';
import { getProfile } from '../utils/3box';
import {
  getAddressLink,
  getResolverInfo,
  getResolverString,
  isKnownResolver,
} from '../utils/helpers';

export const AccountLink = ({
  address: inputAddress,
  chainId: inputChainId,
}) => {
  const { chainId: walletChainId } = useContext(Web3Context);
  const address = inputAddress.toLowerCase();
  const [profile, setProfile] = useState();
  const chainId = inputChainId || walletChainId;
  const isResolver = isKnownResolver(chainId, address);

  useEffect(() => {
    let isSubscribed = true;
    if (!isResolver && utils.isAddress(address)) {
      getProfile(address).then(p => (isSubscribed ? setProfile(p) : undefined));
    }
    return () => {
      isSubscribed = false;
    };
  }, [address, isResolver]);

  let displayString = getResolverString(chainId, address);

  let imageUrl = isResolver
    ? getResolverInfo(chainId, address).logoUrl
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
        border={`1px solid ${theme.colors.white20}`}
        bgSize="cover"
        bgRepeat="no-repeat"
        bgPosition="center center"
      />
      <Text as="span" pl="0.25rem" fontSize="sm">
        {displayString}
      </Text>
    </Link>
  );
};
