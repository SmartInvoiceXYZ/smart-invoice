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
    } = _.pick(invoice, [
      'projectName',
      'projectDescription',
      'projectAgreement',
      'startDate',
      'endDate',
    ]);

    if (!(projectName || projectAgreement !== '')) {
      return undefined;
    }

    // TODO working around bigint type for createdAt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newProjectAgreement: any[] = _.concat(invoiceProjectAgreement || []);
    if (projectAgreement && projectAgreement !== '') {
      newProjectAgreement.push({
        id: createdAt.toString(),
        src: projectAgreement,
        type: projectAgreement?.startsWith('http') ? 'http' : 'ipfs',
        createdAt: createdAt.toString(),
      });
    }

    return {
      projectName: projectName || invoiceProjectName || '',
      projectDescription: projectDescription || invoiceProjectDescription || '',
      projectAgreement: newProjectAgreement,
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
    if (!detailsData || !token) return null;
    const details = await handleDetailsPin({
      details: detailsData,
      name: `${projectName}-${startDate}`,
      token,
    });

    return convertIpfsCidV0ToByte32(details);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'detailsPin',
      { projectName, projectDescription, projectAgreement, startDate, endDate },
    ],
    queryFn: detailsPin,
    enabled:
      !!(projectName || projectAgreement) &&
      !!startDate &&
      !!endDate &&
      !!detailsData,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return { data, isLoading, error };
};
