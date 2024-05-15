import { getKeys } from '../misc';

describe('getKeys', function () {
  it('should return an array of keys', function () {
    const record = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };

    const keys = getKeys(record);

    expect(keys).toEqual(['key1', 'key2', 'key3']);
  });
});
