import { bigint } from 'ethers';
import { useEffect, useMemo } from 'react';

import { isAddress } from '@ethersproject/address';

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
}: any) {
  const escrowStep2Valid = useMemo(
    () =>
      isAddress(clientAddress) &&
      isAddress(paymentAddress) &&
      isAddress(paymentToken) &&
      isAddress(arbitrationProvider) &&
      paymentDue > (0) &&
      !Number.isNaN(Number(milestones)) &&
      milestones > 0 &&
      termsAccepted &&
      Array.from(
        new Set([
          clientAddress.toLowerCase(),
          paymentAddress.toLowerCase(),
          paymentToken.toLowerCase(),
          arbitrationProvider.toLowerCase(),
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
    () =>
      payments.reduce((t: any, a: any) => t + (a), BigInt(0)) === (paymentDue),
    [payments, paymentDue],
  );

  useEffect(() => {
    if (step1Valid && escrowStep2Valid && escrowStep3Valid) {
      setAllValid(true);
    }
  }, [step1Valid, escrowStep2Valid, escrowStep3Valid, allValid, setAllValid]);

  return { escrowStep2Valid, escrowStep3Valid };
}
