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
  Bytes: {
    encode: (e: unknown) => (e as string).replace('0x', ''),
    decode: (e: unknown) => `0x${e}`,
  },
  Int8: {
    encode: (e: unknown) => (e as number).toString(),
    decode: (e: unknown) => Number(e as string),
  },
});
