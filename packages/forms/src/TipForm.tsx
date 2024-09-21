import { Stack, Text } from '@chakra-ui/react';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';

// Uses Deposit form

export function TipForm({
  invoice: _invoice,
}: {
  invoice: Partial<InvoiceDetails>;
}) {
  return (
    <Stack>
      <Text>Tip</Text>
    </Stack>
  );
}
