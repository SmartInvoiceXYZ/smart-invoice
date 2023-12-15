import { render } from '@testing-library/react';
import React from 'react';
import { StyledButton } from './StyledButton';

describe('StyledButton', () => {
  it('should render', () => {
    const view = render(<StyledButton />);

    expect(view.asFragment()).toMatchSnapshot();
  });
});
