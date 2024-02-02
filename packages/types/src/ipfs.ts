export type KeyRestrictions = {
  keyName: string;
  maxUses: number;
  permissions: {
    endpoints: {
      data: {
        pinList: boolean;
        userPinnedDataTotal: boolean;
      };
      pinning: {
        pinFileToIPFS: boolean;
        pinJSONToIPFS: boolean;
        pinJobs: boolean;
        unpin: boolean;
        userPinPolicy: boolean;
      };
    };
  };
};
