import _ from 'lodash';
import { Address } from 'viem';

export const getProfile = async (account: Address) => ({
  address: _.toLower(account),
  name: '',
  emoji: '',
  imageHash: '',
  imageUrl: `https://avatars.dicebear.com/api/jdenticon/${_.toLower(account)}.svg`,
});
