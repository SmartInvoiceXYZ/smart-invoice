import { createIcon, IconProps } from '@chakra-ui/react';

export const FilterIcon: React.FC<IconProps> = createIcon({
  displayName: 'FilterIcon',
  path: (
    <>
      <path d="M4 8L0.535898 5L7.4641 5L4 8Z" fill="#99A6B6" />
      <path
        d="M4 3.49691e-07L0.535898 3L7.4641 3L4 3.49691e-07Z"
        fill="#99A6B6"
      />
    </>
  ),
  viewBox: '0 0 8 8',
});
