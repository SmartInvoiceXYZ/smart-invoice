import { Address } from "viem";

export const getProfile = async (account: Address) => {
  const address = account.toLowerCase();
  const profile = {
    address,
    name: '',
    emoji: '',
    imageHash: '',
    imageUrl: `https://avatars.dicebear.com/api/jdenticon/${address}.svg`,
  };

  return profile;
};
