import BigNumber from "bignumber.js";
import { ZeusScalars } from "./zeus";

export const scalars = ZeusScalars({
  BigDecimal: {
    encode: (e: unknown) => (e as BigNumber).toString(),
    decode: (e: unknown) => BigNumber(e as string),
  },
  BigInt: {
    encode: (e: unknown) => (e as bigint).toString(16),
    decode: (e: unknown) => BigInt(e as string),
  },
  Bytes: {
    encode: (e: unknown) => e as string,
    decode: (e: unknown) => e as string,
  },
});