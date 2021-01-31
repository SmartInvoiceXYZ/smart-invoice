import { Flex, Link, Text } from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useEffect, useState } from 'react';

import { theme } from '../theme';
import { getProfile } from '../utils/3box';
import { RESOLVER_INFO } from '../utils/constants';
import {
  getAccountString,
  getAddressLink,
  getResolverString,
  isKnownResolver,
} from '../utils/helpers';

export const AccountLink = ({ address: inputAddress }) => {
  const address = inputAddress.toLowerCase();
  const [profile, setProfile] = useState();
  const isResolver = isKnownResolver(address);

  useEffect(() => {
    if (!isResolver && utils.isAddress(address)) {
      getProfile(address).then(p => setProfile(p));
    }
  }, [address, isResolver]);

  let displayString = isResolver
    ? getResolverString(address)
    : getAccountString(address);

  let imageUrl = isResolver ? RESOLVER_INFO[address].logoUrl : undefined;

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
      href={getAddressLink(address)}
      isExternal
      display="inline-flex"
      textAlign="right"
      bgColor="black30"
      px="0.25rem"
      _hover={{
        textDecor: 'none',
        bgColor: 'white20',
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
