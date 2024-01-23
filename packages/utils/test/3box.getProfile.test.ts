import { describe, it } from 'node:test';

import { getProfile } from '../src/3box';

describe('getProfile', () => {
  it('should return a profile object', async () => {
    const account = '0x123456789';
    const expectedProfile = {
      address: account.toLowerCase(),
      name: '',
      emoji: '',
      imageHash: '',
      imageUrl: `https://avatars.dicebear.com/api/jdenticon/${account.toLowerCase()}.svg`,
    };

    const profile = await getProfile(account);

    expect(profile).toEqual(expectedProfile);
  });
});
