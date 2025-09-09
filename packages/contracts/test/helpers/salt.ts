import { toHex } from 'viem';

export const nextSalt = (() => {
  let i = 0;
  return () => {
    i += 1;
    return toHex(BigInt(i), {
      size: 32,
    });
  };
})();
