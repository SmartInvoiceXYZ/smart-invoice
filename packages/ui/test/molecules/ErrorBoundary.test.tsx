import { render } from '@testing-library/react';
import React from 'react';

import { ErrorBoundary } from '../../src/molecules/ErrorBoundary';

describe('ErrorBoundary', function () {
  // eslint-disable-next-line mocha/no-setup-in-describe
  const mockResetErrorBoundary = jest.fn();

  it('should render', function () {
    const error = new Error('Test error');
    const view = render(
      <ErrorBoundary
        error={error}
        resetErrorBoundary={mockResetErrorBoundary}
      />,
    );

    expect(view.asFragment()).toMatchSnapshot();
  });
});
