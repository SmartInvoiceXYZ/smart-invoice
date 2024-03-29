import { render } from '@testing-library/react';
import React from 'react';

import { Loader } from '../../src/atoms/Loader';

describe('Loader', function () {
  it('should render', function () {
    const view = render(<Loader />);

    expect(view.asFragment()).toMatchSnapshot();
  });
});
