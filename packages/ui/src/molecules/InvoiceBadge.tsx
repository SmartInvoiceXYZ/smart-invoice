import { Badge } from '@chakra-ui/react';
import { INVOICE_TYPES } from '@smart-invoice/constants';
import { ValueOf } from '@smart-invoice/types';
import React from 'react';

type InvoiceType = ValueOf<typeof INVOICE_TYPES> | 'unknown';

export type InvoiceBadgeProps = {
  invoiceType?: InvoiceType;
};

const schemes: { [key: InvoiceType]: { bg: string; color: string } } = {
  escrow: {
    bg: 'rgba(128, 63, 248, 0.3)',
    color: 'rgba(128, 63, 248, 1)',
  },
  instant: {
    bg: 'rgba(248, 174, 63, 0.3)',
    color: 'rgba(248, 174, 63, 1)',
  },
  updatable: {
    bg: 'rgba(248, 174, 63, 0.3)',
    color: 'rgba(248, 174, 63, 1)',
  },
  unknown: {
    bg: 'rgba(150,150,150,0.3)',
    color: 'rgba(150,150,150,1)',
  },
};

export function InvoiceBadge({ invoiceType = 'unknown' }: InvoiceBadgeProps) {
  return (
    <Badge
      backgroundColor={schemes[invoiceType].bg}
      color={schemes[invoiceType].color}
      maxW="fit-content"
      height="fit-content"
    >
      {invoiceType.toUpperCase()}
    </Badge>
  );
}
