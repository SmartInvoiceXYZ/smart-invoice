import React from 'react';

import { render } from '@testing-library/react';

import { Container } from '../../src/atoms/Container';

describe('Container', () => {
  it('should render', () => {
    const view = render(
      <Container>
        <div>hello</div>
      </Container>,
    );

    expect(view.asFragment()).toMatchSnapshot();
  });
});
