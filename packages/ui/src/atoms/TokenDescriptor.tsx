import { InputRightElement } from '@chakra-ui/react';
import { TokenBalance } from '@smartinvoicexyz/graphql';
import React from 'react';

export function TokenDescriptor({
  tokenBalance,
}: {
  tokenBalance: TokenBalance | undefined;
}) {
  if (!tokenBalance) return null;

  return (
    <InputRightElement w="3.5rem" color="yellow">
      {tokenBalance?.symbol}
    </InputRightElement>
  );
}
