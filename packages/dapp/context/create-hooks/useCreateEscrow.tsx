import { useEffect, useMemo } from 'react';
import { isAddress } from '../../utils/helpers';
import { Address } from 'viem';

export function useCreateEscrow({
  step1Valid,
  allValid,
  clientAddress,
  paymentAddress,
  payments,
  paymentToken,
  paymentDue,
  milestones,
  termsAccepted,
  arbitrationProvider,
  setAllValid,
}: {
  step1Valid: boolean,
  allValid: boolean,
  clientAddress?: Address,
  paymentAddress?: Address,
  paymentToken?: Address,
  payments: bigint[],
  paymentDue: bigint,
  milestones: number,
  termsAccepted: boolean,
  arbitrationProvider?: Address,
  // eslint-disable-next-line no-unused-vars
  setAllValid: (valid: boolean) => void,
}) {
  const escrowStep2Valid = useMemo(
    () =>
      isAddress(clientAddress) &&
      isAddress(paymentAddress) &&
      isAddress(paymentToken) &&
      isAddress(arbitrationProvider) &&
      paymentDue > 0 &&
      milestones > 0 &&
      termsAccepted &&
      Array.from(
        new Set([
          clientAddress?.toLowerCase(),
          paymentAddress?.toLowerCase(),
          paymentToken?.toLowerCase(),
          arbitrationProvider?.toLowerCase(),
        ]),
      ).length === 4,
    [
      clientAddress,
      paymentAddress,
      paymentToken,
      arbitrationProvider,
      paymentDue,
      milestones,
      termsAccepted,
    ],
  );

  const escrowStep3Valid = useMemo(
    () => payments.reduce((t: any, a: any) => t + a, BigInt(0)) === paymentDue,
    [payments, paymentDue],
  );

  useEffect(() => {
    if (step1Valid && escrowStep2Valid && escrowStep3Valid) {
      setAllValid(true);
    }
  }, [step1Valid, escrowStep2Valid, escrowStep3Valid, allValid, setAllValid]);

  return { escrowStep2Valid, escrowStep3Valid };
}
