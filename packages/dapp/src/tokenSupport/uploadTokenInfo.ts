// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const IpfsClient = require('ipfs-http-client');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
require('dotenv').config({ path: '../../.env' });
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const tokenSchema = require('./tokenSchema.json');

const { NEXT_PUBLIC_INFURA_PROJECT_ID, NEXT_PUBLIC_INFURA_PROJECT_SECRET } =
  // @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
  process.env;

// @ts-expect-error TS(2580): Cannot find name 'Buffer'. Do you need to install ... Remove this comment to see the full error message
const auth = `Basic ${Buffer.from(
  `${NEXT_PUBLIC_INFURA_PROJECT_ID}` +
    ':' +
    `${NEXT_PUBLIC_INFURA_PROJECT_SECRET}`,
).toString('base64')}`;

const client = new IpfsClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

const uploadTokenData = async (ts: any) => {
  const objectString = JSON.stringify(ts);
  // @ts-expect-error TS(2580): Cannot find name 'Buffer'. Do you need to install ... Remove this comment to see the full error message
  const bufferedString = Buffer.from(objectString);
  const [res] = await client.add(bufferedString);

  await client.pin.add(res.hash).then((result: any) => {
    console.log(result);
  });
};

uploadTokenData(tokenSchema);
