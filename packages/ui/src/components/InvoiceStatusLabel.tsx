/* eslint-disable no-nested-ternary */
import React from 'react';

import { Flex, Text } from '@chakra-ui/react';

import { useInvoiceStatus } from '@smart-invoice/hooks';
import { Invoice } from '@smart-invoice/graphql';

import { Loader } from './Loader';

export type InvoiceStatusLabelProps = {
  invoice: Invoice;
  onClick?: () => void;
};

export const InvoiceStatusLabel: React.FC<InvoiceStatusLabelProps> = ({
  invoice,
  onClick,
}) => {
  const { funded, label, loading } = useInvoiceStatus(invoice);
  const { isLocked, terminationTime } = invoice ?? {};
  const terminated = terminationTime && Number(terminationTime) > Date.now();
  const disputeResolved = label === 'Dispute Resolved';
  return (
    <Flex
      backgroundColor={
        loading
          ? '#FFFFFF'
          : terminated || disputeResolved || label === 'Expired'
            ? '#C2CFE0'
            : isLocked
              ? '#F7685B'
              : label === 'Overdue'
                ? '#F7685B'
                : funded
                  ? '#2ED47A'
                  : '#FFB946'
      }
      padding="6px"
      borderRadius="10"
      minWidth="165px"
      justify="center"
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
    >
      <Text color="white" fontWeight="bold" textAlign="center" fontSize="15px">
        {loading ? <Loader size="20" /> : label}
      </Text>
    </Flex>
  );
};
