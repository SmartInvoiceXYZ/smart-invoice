import { Box } from '@chakra-ui/react';
import { create } from 'blockies-ts';
import { useEffect, useState } from 'react';
import { getAddress, isAddress } from 'viem';

export type AvatarComponentProps = {
  address: string;
  ensImage?: string | null;
  size: number;
};

export const AccountAvatar: React.FC<
  AvatarComponentProps & { customImage?: string | undefined }
> = ({ address, customImage, ensImage, size }) => {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (customImage) {
      setImage(customImage);
    } else if (ensImage) {
      setImage(ensImage);
    } else if (isAddress(address)) {
      const blockie = create({
        seed: getAddress(address),
        size: 8,
        scale: 16,
      }).toDataURL();
      setImage(blockie);
    }
  }, [address, customImage, ensImage]);

  if (!image) {
    return null; // or a fallback UI like a skeleton
  }

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
