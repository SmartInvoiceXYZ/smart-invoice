import { Box } from '@chakra-ui/react';
import { create } from 'blockies-ts';
import _ from 'lodash';
import { useMemo } from 'react';
import { getAddress, isAddress } from 'viem';

export type AvatarComponentProps = {
  address: string;
  ensImage?: string | null;
  size: number;
};

export const AccountAvatar: React.FC<
  AvatarComponentProps & { customImage?: string | undefined }
> = ({ address, customImage, ensImage, size }) => {
  const image = useMemo(() => {
    const blockie =
      isAddress(address) && typeof document !== 'undefined'
        ? create({ seed: getAddress(address), size: 8, scale: 16 }).toDataURL()
        : '';

    return customImage ?? ensImage ?? blockie;
  }, [address, customImage, ensImage]);

  return (
    <Box
      borderRadius="999"
      bgImage={image}
      bgColor="black"
      bgSize="cover"
      bgRepeat="no-repeat"
      w={`${size}px`}
      h={`${size}px`}
    />
  );
};
