import React from 'react';

import { render } from '@testing-library/react';

import { ProfileButton } from './ProfileButton';

describe('ProfileButton', () => {
  const mockDisconnect = jest.fn();

  it('should render', () => {
    const view = render(
      <ProfileButton
        account="0x123490871023748917234aeefg"
        chain={1}
        disconnect={mockDisconnect}
      />,
    );

    expect(view.asFragment()).toMatchSnapshot();
  });
});
