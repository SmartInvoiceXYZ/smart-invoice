import { INVOICE_VERSION } from '@smartinvoicexyz/constants';
import {
  BasicMetadata,
  InvoiceMetadata,
  validateBasicMetadata,
  validateInvoiceMetadata,
} from '@smartinvoicexyz/types';
import {
  convertIpfsCidV0ToByte32,
  fetchToken,
  handleDetailsPin,
  logDebug,
} from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useCallback, useMemo } from 'react';

const generateName = ({ title, createdAt }: BasicMetadata) =>
  `${title} - ${createdAt} - ${INVOICE_VERSION}`;

export const useDetailsPin = (
  details: InvoiceMetadata | null,
  isBasic = false,
) => {
  const validatedDetails = useMemo((): InvoiceMetadata | null => {
    if (details === null) {
      return null;
    }
    if (isBasic) {
      if (!validateBasicMetadata(details)) {
        logDebug('Invalid basic metadata: ', details);
        return null;
      }
      return details;
    }
    if (!validateInvoiceMetadata(details)) {
      logDebug('Invalid invoice metadata: ', details);
      return null;
    }

    return details;
  }, [isBasic, details]);

  const uploadToIpfs = useCallback(async () => {
    const token = await fetchToken();
    if (!validatedDetails || !token) return null;
    const cid = await handleDetailsPin({
      details: validatedDetails,
      name: generateName(validatedDetails),
      token,
    });

    return convertIpfsCidV0ToByte32(cid);
  }, [validatedDetails]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['detailsPin', JSON.stringify(validatedDetails)],
    queryFn: uploadToIpfs,
    enabled: !!validatedDetails,
    staleTime: Infinity,
    refetchInterval: false,
  });

  return { data, isLoading, error };
};
