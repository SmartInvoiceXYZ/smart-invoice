import '@testing-library/jest-dom';

import { useBreakpointValue } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';

import Home from '../../pages';

jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useBreakpointValue: jest.fn(),
}));

describe('Home component', function () {
  beforeEach(function () {
    (useBreakpointValue as jest.Mock).mockReturnValue('md');
  });

  it('renders correctly', function () {
    render(<Home />);
    expect(screen.getByText('Welcome to Smart Invoice')).toBeInTheDocument();
    expect(
      screen.getByText('How do you want to get started?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    expect(screen.getByText('View Existing Invoices')).toBeInTheDocument();
  });

  // Additional tests for user interactions and other functionalities can be added here
});
