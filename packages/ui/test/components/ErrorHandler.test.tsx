import React from 'react';

import { render } from '@testing-library/react';

import { ErrorBoundary } from '../../src/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  const mockResetErrorBoundary = jest.fn();

  it('should render', () => {
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
