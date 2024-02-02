import { INVOICE_VERSION } from '@smart-invoice/constants';
import { InvoiceDetails } from '@smart-invoice/graphql';
import {
  convertIpfsCidV0ToByte32,
  fetchToken,
  handleDetailsPin,
} from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useMemo } from 'react';

export const useDetailsPin = ({
  projectName,
  projectDescription,
  projectAgreement,
  startDate,
  endDate,
  invoice,
}: {
  projectName?: string;
  projectDescription?: string;
  projectAgreement: string;
  startDate?: number;
  endDate?: number;
  invoice?: InvoiceDetails;
}) => {
  const detailsData = useMemo(() => {
    const createdAt = BigInt(Date.now());
    const {
      projectName: invoiceProjectName,
      projectDescription: invoiceProjectDescription,
      projectAgreement: invoiceProjectAgreement,
      startDate: invoiceStartDate,
      endDate: invoiceEndDate,
    } = invoice || {};

    return {
      projectName: projectName || invoiceProjectName || '',
      projectDescription: projectDescription || invoiceProjectDescription || '',
      projectAgreement: _.concat(invoiceProjectAgreement || [], [
        {
          id: createdAt.toString(),
          src: projectAgreement,
          type: projectAgreement?.startsWith('http') ? 'http' : 'ipfs',
          createdAt,
        },
      ]),
      startDate: startDate || invoiceStartDate,
      endDate: endDate || invoiceEndDate,
      version: INVOICE_VERSION,
    };
  }, [
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    invoice,
  ]);

  const detailsPin = async () => {
    const token = await fetchToken();
    const details = await handleDetailsPin({
      details: detailsData,
      name: `${projectName}-${startDate}`,
      token,
    });

    const bytes32hash = convertIpfsCidV0ToByte32(details);

    return bytes32hash;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'detailsPin',
      { projectName, projectDescription, projectAgreement, startDate, endDate },
    ],
    queryFn: detailsPin,
    enabled: !!(projectName || projectAgreement) && !!startDate && !!endDate,
  });

  return { data, isLoading, error };
};
