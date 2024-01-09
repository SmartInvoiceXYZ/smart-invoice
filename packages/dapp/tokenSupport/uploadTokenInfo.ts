import IpfsClient from 'ipfs-http-client';

import tokenSchema from './tokenSchema.json';
import { logDebug } from '../utils';

const { NEXT_PUBLIC_INFURA_PROJECT_ID, NEXT_PUBLIC_INFURA_PROJECT_SECRET } =
  process.env;

const auth = `Basic ${Buffer.from(
  `${NEXT_PUBLIC_INFURA_PROJECT_ID}` +
    ':' +
    `${NEXT_PUBLIC_INFURA_PROJECT_SECRET}`,
).toString('base64')}`;

const client = IpfsClient.create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

const uploadTokenData = async (ts: any) => {
  const objectString = JSON.stringify(ts);
  const bufferedString = Buffer.from(objectString);
  const result = await client.add(bufferedString);

  await client.pin.add(result.cid).then((pinResult) => {
    logDebug(pinResult);
  });
};

uploadTokenData(tokenSchema);
