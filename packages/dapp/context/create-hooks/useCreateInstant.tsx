import { useEffect, useMemo } from 'react';
import { isAddress } from '../../utils';
import { Address } from 'viem';

export function useCreateInstant({
  step1Valid,
  allValid,
  clientAddress,
  paymentAddress,
  paymentToken,
  paymentDue,
  milestones,
  setAllValid,
}: {
  step1Valid: boolean,
  allValid: boolean,
  clientAddress?: Address,
  paymentAddress?: Address,
  paymentToken?: Address,
  paymentDue: bigint,
  milestones: number,
  // eslint-disable-next-line no-unused-vars
  setAllValid: (valid: boolean) => void,
}) {
  const instantStep2Valid = useMemo(
    () =>
      isAddress(clientAddress) &&
      isAddress(paymentAddress) &&
      isAddress(paymentToken) &&
      paymentDue > 0 &&
      milestones > 0 &&
      Array.from(
        new Set([
          clientAddress?.toLowerCase(),
          paymentAddress?.toLowerCase(),
          paymentToken?.toLowerCase(),
        ]),
      ).length === 3,
    [clientAddress, paymentAddress, paymentToken, paymentDue, milestones],
  );

  useEffect(() => {
    if (step1Valid && instantStep2Valid) {
      setAllValid(true);
    }
  }, [step1Valid, instantStep2Valid, allValid, setAllValid]);

  return { instantStep2Valid };
}
