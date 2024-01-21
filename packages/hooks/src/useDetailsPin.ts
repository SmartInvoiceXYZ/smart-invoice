import {
  convertIpfsCidV0ToByte32,
  fetchToken,
  handleDetailsPin,
} from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useDetailsPin = ({
  projectName,
  projectDescription,
  projectAgreement,
  startDate,
  endDate,
}: {
  projectName: string;
  projectDescription: string;
  projectAgreement: string;
  startDate: number;
  endDate: number;
}) => {
  const detailsData = useMemo(
    () => ({
      projectName,
      projectDescription,
      projectAgreement, // TODO handle agreement
      startDate,
      endDate,
    }),
    [projectName, projectDescription, projectAgreement, startDate, endDate],
  );

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
    enabled: !!projectName && !!startDate && !!endDate,
  });

  return { data, isLoading, error };
};
