// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import * as React from 'react';

// @ts-expect-error TS(2792): Cannot find module '@chakra-ui/icon'. Did you mean... Remove this comment to see the full error message
import { createIcon } from '@chakra-ui/icon';

export const FilterIcon = createIcon({
  displayName: 'FilterIcon',
  path: (
    
    <>
      // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
      <path d="M4 8L0.535898 5L7.4641 5L4 8Z" fill="#99A6B6" />
      // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
      <path
        d="M4 3.49691e-07L0.535898 3L7.4641 3L4 3.49691e-07Z"
        fill="#99A6B6"
      />
    </>
  ),
  viewBox: '0 0 8 8',
});
