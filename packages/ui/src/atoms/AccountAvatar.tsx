import { Box } from '@chakra-ui/react';
import { AvatarComponent } from '@rainbow-me/rainbowkit';
import blockies from 'blockies-ts';
import _ from 'lodash';
import { getAddress } from 'viem';

type AvatarComponentProps = React.ComponentProps<AvatarComponent>;

export const AccountAvatar: React.FC<
  AvatarComponentProps & { customImage?: string | undefined }
> = ({ address, customImage, ensImage, size }) => {
  const blockie = blockies
    .create({ seed: getAddress(address), size: 8, scale: 16 })
    .toDataURL();

  const image = customImage ?? ensImage ?? blockie;

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
