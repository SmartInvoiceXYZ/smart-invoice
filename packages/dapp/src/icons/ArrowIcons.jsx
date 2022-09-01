import { createIcon } from '@chakra-ui/icon';
import * as React from 'react';

export const RightArrowIcon = createIcon({
  displayName: 'RightArrowIcon',
  path: (
    <path
      d="M0 2.68182L2.73008 0L18 15L2.73008 30L0 27.3182L12.5398 15L0 2.68182Z"
      fill="#C2CFE0"
    />
  ),
  viewBox: '0 0 18 30',
});

export const LeftArrowIcon = createIcon({
  displayName: 'LeftArrowIcon',
  path: (
    <path
      d="M18 2.68182L15.2699 0L0 15L15.2699 30L18 27.3182L5.46015 15L18 2.68182Z"
      fill="#C2CFE0"
    />
  ),
  viewBox: '0 0 18 30',
});
