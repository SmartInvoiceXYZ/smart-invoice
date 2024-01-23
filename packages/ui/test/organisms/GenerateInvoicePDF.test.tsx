import React from 'react';
import { render } from '@testing-library/react';
import { GenerateInvoicePDF } from '../../src/organisms/GenerateInvoicePDF';
import { Invoice } from '@smart-invoice/graphql/src';

describe('GenerateInvoicePDF', () => {
  it('should render without errors', () => {
    const mockInvoice = jest.mocked<Invoice>({} as Invoice);

    const { getByText } = render(
      <GenerateInvoicePDF
        invoice={mockInvoice}
        symbol="ETH"
        buttonText="Generate PDF"
      />,
    );

    const generateButton = getByText('Generate PDF');
    expect(generateButton).toBeInTheDocument();
  });

  it('should generate PDF when button is clicked', () => {
    // TODO: Write test case to simulate button click and verify PDF generation
  });
});
