import { useState } from 'react';

export const useRevalidateInvoice = () => {
  const [shouldRevalidate, setShouldRevalidate] = useState(false);

  return { shouldRevalidate, setShouldRevalidate };
};
