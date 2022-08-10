const ipfsClient = require('ipfs-http-client');
require('dotenv').config({ path: '../../.env' });
const tokenSchema = require('./tokenSchema.json');

const {
  REACT_APP_INFURA_PROJECT_ID,
  REACT_APP_INFURA_PROJECT_SECRET,
} = process.env;

const auth =
  'Basic ' +
  Buffer.from(
    `${REACT_APP_INFURA_PROJECT_ID}` +
      ':' +
      `${REACT_APP_INFURA_PROJECT_SECRET}`,
  ).toString('base64');

const client = new ipfsClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

const uploadTokenData = async tokenSchema => {
  const objectString = JSON.stringify(tokenSchema);
  const bufferedString = Buffer.from(objectString);
  const [res] = await client.add(bufferedString);

  await client.pin.add(res.hash).then(res => {
    console.log(res);
  });
};

uploadTokenData(tokenSchema);
