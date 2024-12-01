import { Badge } from '@chakra-ui/react';
import { getChainName } from '@smartinvoicexyz/utils';

export type NetworkBadgeProps = {
  chainId?: number;
};

// const schemes: { [key: number]: { bg: string; color: string } } = {
//  escrow: {
//    bg: 'rgba(128, 63, 248, 0.3)',
//    color: 'rgba(128, 63, 248, 1)',
//  },
//  instant: {
//    bg: 'rgba(248, 174, 63, 0.3)',
//    color: 'rgba(248, 174, 63, 1)',
//  },
//  updatable: {
//    bg: 'rgba(248, 174, 63, 0.3)',
//    color: 'rgba(248, 174, 63, 1)',
//  },
//  unknown: {
//    bg: 'rgba(150,150,150,0.3)',
//    color: 'rgba(150,150,150,1)',
//  },
// };

export function NetworkBadge({ chainId }: NetworkBadgeProps) {
  const chainName = getChainName(chainId);
  return (
    <Badge bg="blue.100" maxW="fit-content" height="fit-content">
      {chainName}
    </Badge>
  );
}
