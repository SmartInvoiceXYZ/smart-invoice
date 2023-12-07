import React from 'react';

import { render } from '@testing-library/react';

import { Container } from '../../shared/Container';

describe('Container', () => {
  it('should render', () => {
    const view = render(<Container />);

    expect(view.asFragment()).toMatchSnapshot();
  });
});
