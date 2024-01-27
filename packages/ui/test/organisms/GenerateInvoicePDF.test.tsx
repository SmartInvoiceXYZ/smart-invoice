import { Invoice } from '@smart-invoice/graphql';
import { render } from '@testing-library/react';
import React from 'react';

import { GenerateInvoicePDF } from '../../src/organisms/GenerateInvoicePDF';

describe('GenerateInvoicePDF', function () {
  it('should render without errors', function () {
    const mockInvoice = jest.mocked<Invoice>({} as Invoice);

    const { getByText } = render(
      <GenerateInvoicePDF
        invoice={mockInvoice}
        buttonText="Generate PDF"
        buttonProps={{}}
      />,
    );

    const generateButton = getByText('Generate PDF');
    expect(generateButton).toBeInTheDocument();
  });

  it('should generate PDF when button is clicked', function () {
    // TODO: Write test case to simulate button click and verify PDF generation
  });
});
