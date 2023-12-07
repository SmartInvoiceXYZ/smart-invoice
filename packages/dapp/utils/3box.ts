export const getProfile = async (account: any) => {
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
