import { render } from '@testing-library/react';
import React from 'react';

import { Container } from '../../src/atoms/Container';

describe('Container', function () {
  it('should render', function () {
    const view = render(
      <Container>
        <div>hello</div>
      </Container>,
    );

    expect(view.asFragment()).toMatchSnapshot();
  });
});
