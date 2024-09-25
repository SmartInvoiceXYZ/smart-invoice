import { INVOICE_VERSION } from '@smartinvoicexyz/constants';
import {
  convertIpfsCidV0ToByte32,
  fetchToken,
  handleDetailsPin,
} from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useCallback, useMemo } from 'react';

type ProjectAgreement = {
  id: string;
  src: string;
  type: string;
  createdAt: string;
};

export const useDetailsPin = ({
  projectName,
  projectDescription,
  projectAgreement,
  startDate,
  endDate,
  klerosCourt,
}: {
  projectName?: string;
  projectDescription?: string;
  projectAgreement: string;
  startDate?: number;
  endDate?: number;
  klerosCourt?: number;
}) => {
  const detailsData = useMemo(() => {
    const createdAt = BigInt(Date.now());

    if (!(projectName || projectAgreement !== '')) {
      return undefined;
    }

    const projectAgreements: ProjectAgreement[] = [];
    if (projectAgreement && projectAgreement !== '') {
      projectAgreements.push({
        id: createdAt.toString(),
        src: projectAgreement,
        type: projectAgreement?.startsWith('http') ? 'http' : 'ipfs',
        createdAt: createdAt.toString(),
      });
    }

    return {
      projectName: projectName || '',
      projectDescription: projectDescription || '',
      projectAgreement: projectAgreements,
      startDate,
      endDate,
      version: INVOICE_VERSION,
      ...(klerosCourt && { klerosCourt }),
    };
  }, [
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    klerosCourt,
  ]);

  const uploadToIpfs = useCallback(async () => {
    const token = await fetchToken();
    if (!detailsData || !token) return null;
    const details = await handleDetailsPin({
      details: detailsData,
      name: `${projectName}-${startDate}`,
      token,
    });

    return convertIpfsCidV0ToByte32(details);
  }, [detailsData, projectName, startDate]);

  const isEnabled = useMemo(() => {
    return (
      !!(projectName || projectAgreement) &&
      !!startDate &&
      !!endDate &&
      !!detailsData
    );
  }, [projectName, projectAgreement, startDate, endDate, detailsData]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'detailsPin',
      {
        projectName,
        projectDescription,
        projectAgreement,
        startDate,
        endDate,
        ...(klerosCourt ? { klerosCourt } : {}),
      },
    ],
    queryFn: uploadToIpfs,
    enabled: isEnabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchInterval: false,
  });

  return { data, isLoading, error };
};
