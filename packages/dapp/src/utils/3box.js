import { BOX_ENDPOINT, IPFS_ENDPOINT } from './constants';

export const getProfile = async account => {
  const address = account.toLowerCase();
  const profile = {
    address,
    name: '',
    emoji: '',
    imageHash: '',
    imageUrl: `https://avatars.dicebear.com/api/jdenticon/${address}.svg`,
  };
  const response = await fetch(
    `${BOX_ENDPOINT}/profile?address=${encodeURIComponent(address)}`,
  );
  if (response.ok && response.status === 200) {
    const boxProfile = await response.json();
    const imageHash =
      boxProfile &&
      boxProfile.image &&
      boxProfile.image[0] &&
      boxProfile.image[0].contentUrl &&
      boxProfile.image[0].contentUrl['/'];
    if (imageHash) {
      profile.imageHash = imageHash;
      profile.imageUrl = `${IPFS_ENDPOINT}/ipfs/${imageHash}`;
    }
    profile.name = boxProfile.name;
    profile.emoji = boxProfile.emoji;
  }
  return profile;
};
