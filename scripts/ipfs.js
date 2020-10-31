var ipfsClient = require('ipfs-http-client');
var uint8ArrayToString = require('uint8arrays/to-string.js');
var uint8ArrayConcat = require('uint8arrays/concat.js');
var all = require('it-all');
var Base58 = require('base-58');

const ipfs = new ipfsClient({
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
});

module.exports = {
  uploadJson,
  getJson,
};

async function uploadJson(metadata) {
  console.log('uploading json to ipfs');
  const objectString = JSON.stringify(metadata);
  const bufferedString = Buffer.from(objectString);
  const node = await ipfs.add(bufferedString, (err, resp) => {
    console.log(err);
    console.log(resp);
  });
  return {
    hash: node.path,
    bytes: Buffer.from(Base58.decode(node.path)),
    bytesHash: `0x${Buffer.from(Base58.decode(node.path)).toString('hex')}`,
  };
}

async function getJson(hash) {
  console.log('getting json from ipfs');
  const objectString = uint8ArrayToString(
    uint8ArrayConcat(await all(ipfs.cat(hash))),
  );
  return JSON.parse(objectString);
}
