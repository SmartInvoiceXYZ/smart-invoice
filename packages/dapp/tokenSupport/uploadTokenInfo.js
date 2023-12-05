const IpfsClient = require('ipfs-http-client');
require('dotenv').config({ path: '../../.env' });
const tokenSchema = require('./tokenSchema.json');

const { NEXT_PUBLIC_INFURA_PROJECT_ID, NEXT_PUBLIC_INFURA_PROJECT_SECRET } =
  process.env;

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

const uploadTokenData = async ts => {
  const objectString = JSON.stringify(ts);
  const bufferedString = Buffer.from(objectString);
  const [res] = await client.add(bufferedString);

  await client.pin.add(res.hash).then(result => {
    console.log(result);
  });
};

uploadTokenData(tokenSchema);
