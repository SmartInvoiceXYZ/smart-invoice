import { ZeusScalars } from './zeus';

export const scalars = ZeusScalars({
  BigDecimal: {
    encode: (e: unknown) => (e as bigint).toString(16),
    decode: (e: unknown) => BigInt(e as string),
  },
  BigInt: {
    encode: (e: unknown) => (e as bigint).toString(16),
    decode: (e: unknown) => BigInt(e as string),
  },
  Int8: {
    encode: (e: unknown) => (e as number).toString(),
    decode: (e: unknown) => Number(e as string),
  },
});
