import { ZeusScalars } from './zeus';

export const scalars = ZeusScalars({
  BigDecimal: {
    encode: (e: unknown) => (e as bigint).toString(10),
    decode: (e: unknown) => BigInt(e as string),
  },
  BigInt: {
    encode: (e: unknown) => (e as bigint).toString(10),
    decode: (e: unknown) => BigInt(e as string),
  },
  Bytes: {
    decode: (e: unknown) => {
      const str = e as string;
      return str.startsWith('0x') ? str : `0x${str}`;
    },
  },
  Int8: {
    encode: (e: unknown) => (e as number).toString(),
    decode: (e: unknown) => Number(e as string),
  },
});

export const apolloScalars = {
  BigDecimal: {
    serialize: (e: unknown) => (e as bigint).toString(10),
    parseValue: (e: unknown) => BigInt(e as string),
  },
  BigInt: {
    serialize: (e: unknown) => (e as bigint).toString(10),
    parseValue: (e: unknown) => BigInt(e as string),
  },
  Bytes: {
    parseValue: (e: unknown) => {
      const str = e as string;
      return str.startsWith('0x') ? str : `0x${str}`;
    },
    serialize: (e: unknown) => e,
  },
  Int8: {
    serialize: (e: unknown) => (e as number).toString(),
    parseValue: (e: unknown) => Number(e as string),
  },
};
