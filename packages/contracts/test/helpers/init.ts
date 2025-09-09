import { encodeAbiParameters, Hex } from 'viem';

export type InitData = {
  client: Hex;
  resolverData: Hex;
  token: Hex;
  terminationTime: bigint;
  requireVerification: boolean;
  providerReceiver: Hex;
  clientReceiver: Hex;
  feeBPS: bigint;
  treasury: Hex;
  details: string;
};

// Helper function to encode InitData struct
export const encodeInitData = (initData: InitData) => {
  return encodeAbiParameters(
    [
      {
        type: 'tuple',
        name: 'initData',
        components: [
          { name: 'client', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'terminationTime', type: 'uint256' },
          { name: 'requireVerification', type: 'bool' },
          { name: 'providerReceiver', type: 'address' },
          { name: 'clientReceiver', type: 'address' },
          { name: 'feeBPS', type: 'uint256' },
          { name: 'treasury', type: 'address' },
          { name: 'details', type: 'string' },
          { name: 'resolverData', type: 'bytes' },
        ],
      },
    ],
    [initData],
  );
};
