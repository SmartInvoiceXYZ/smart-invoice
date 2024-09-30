import { InvoiceDetails } from '@smartinvoicexyz/types';
import { render } from '@testing-library/react';

import { GenerateInvoicePDF } from '../../src/organisms/GenerateInvoicePDF';

describe('GenerateInvoicePDF', function () {
  it('should render without errors', function () {
    const mockInvoice = jest.mocked<InvoiceDetails>({} as InvoiceDetails);

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
