import { Flex, Link, Text } from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useEffect, useState } from 'react';

import { theme } from '../theme';
import { getProfile } from '../utils/3box';
import { ADDRESSES } from '../utils/constants';
import {
  getAccountString,
  getAddressLink,
  getResolverString,
} from '../utils/helpers';

const { LEX_DAO, ARAGON_COURT } = ADDRESSES;
export const AccountLink = ({ address }) => {
  const [profile, setProfile] = useState();
  const isResolver = [LEX_DAO, ARAGON_COURT].indexOf(address) !== -1;

  useEffect(() => {
    if (!isResolver && utils.isAddress(address)) {
      getProfile(address).then(p => setProfile(p));
    }
  }, [address, isResolver]);

  let displayString = isResolver
    ? getResolverString(address)
    : getAccountString(address);

  if (!isResolver && profile && profile.name) {
    displayString = profile.name;
  }

  return (
    <Link
      href={getAddressLink(address)}
      isExternal
      display="inline-flex"
      textAlign="right"
    >
      {!isResolver && (
        <Flex
          as="span"
          borderRadius="50%"
          w="1.1rem"
          h="1.1rem"
          overflow="hidden"
          justify="center"
          align="center"
          bgColor="black"
          bgImage={profile && `url(${profile.imageUrl})`}
          border={`1px solid ${theme.colors.white20}`}
          bgSize="cover"
          bgRepeat="no-repeat"
          bgPosition="center center"
        />
      )}
      <Text as="span" pl="0.25rem" fontSize="sm">
        {displayString}
      </Text>
    </Link>
  );
};
