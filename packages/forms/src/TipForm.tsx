import { Stack, Text } from '@chakra-ui/react';
import { InvoiceDetails } from '@smartinvoicexyz/types';

// Uses Deposit form
export function TipForm({ invoice: _invoice }: { invoice: InvoiceDetails }) {
  return (
    <Stack>
      <Text>Tip</Text>
    </Stack>
  );
}
