import { Stack, Text } from '@chakra-ui/react';
import { InvoiceDetails } from '@smart-invoice/graphql';

// Uses Deposit form

export function TipForm({ invoice }: { invoice: InvoiceDetails }) {
  return (
    <Stack>
      <Text>Tip</Text>
    </Stack>
  );
}
