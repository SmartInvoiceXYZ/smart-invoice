// @ts-expect-error TS(2792): Cannot find module 'ethers'. Did you mean to set t... Remove this comment to see the full error message
import { utils } from 'ethers';
// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React, { useContext, useEffect, useState } from 'react';

// @ts-expect-error TS(2792): Cannot find module '@chakra-ui/react'. Did you mea... Remove this comment to see the full error message
import { Flex, Link, Text } from '@chakra-ui/react';

// @ts-expect-error TS(2792): Cannot find module '../theme'. Did you mean to set... Remove this comment to see the full error message
import { theme } from '../theme';
import { getProfile } from '../utils/3box';
import {
  getAddressLink,
  getResolverInfo,
  getResolverString,
  isKnownResolver,
} from '../utils/helpers';

// @ts-expect-error TS(6142): Module '../context/Web3Context' was resolved to '/... Remove this comment to see the full error message

// @ts-expect-error TS(7031): Binding element 'inputAddress' implicitly has an '... Remove this comment to see the full error message
export function AccountLink({ address: inputAddress, chain: inputChainId }) {
  const { chain: walletChainId } = useWalletClient();
  const address = inputAddress.toLowerCase();
  const [profile, setProfile] = useState();
  const chain = inputChainId || walletChainId;
  const isResolver = isKnownResolver(chain, address);

  useEffect(() => {
    let isSubscribed = true;
    if (!isResolver && isAddress(address)) {
      getProfile(address).then(p => (isSubscribed ? setProfile(p) : undefined));
    }
    return () => {
      isSubscribed = false;
    };
  }, [address, isResolver]);

  let displayString = getResolverString(chain, address);

  let imageUrl = isResolver
    ? getResolverInfo(chain, address).logoUrl
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
      href={getAddressLink(chain, address)}
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
}
