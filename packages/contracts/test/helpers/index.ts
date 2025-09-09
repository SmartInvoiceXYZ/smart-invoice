declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export * from './abis';
export * from './constants';
export * from './create';
export * from './erc20';
export * from './init';
export * from './salt';
export * from './sign';
export * from './timestamp';
