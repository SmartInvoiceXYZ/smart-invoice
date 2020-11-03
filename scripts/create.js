const ethers = require('ethers');
const ipfsService = require('./ipfs.js');
const getInput = require('./input.js');
require('dotenv').config();

const contractAbi = [
  'function invoiceCount() public view returns(uint256)',
  'function register(address client, address provider, uint8 resolverType, address resolver, address token, uint256[] amounts, uint256 terminationTime, bytes32 details)',
];

const provider = new ethers.providers.JsonRpcProvider(
  'https://kovan.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
);

const contractAddress = '0xCE0cD015664Da65c237556025825310641FfC8FF';

const wallet = new ethers.Wallet('0x' + process.env.PRIVATE_KEY, provider);

const invoiceCreator = new ethers.Contract(
  contractAddress,
  contractAbi,
  wallet,
);

async function create() {
  try {
    console.log('creating a smart invoice... ');

    const {
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      name,
      description,
      link,
    } = await getInput();
    const { bytes, hash } = await ipfsService.uploadJson({ name, description, link });
    console.log('details uploaded to ipfs: ' + hash); 

    const details = `0x${bytes.slice(2).toString('hex')}`;
    console.log('details uploaded to ipfs');
    console.log({ hash, details });

    const invoiceCount = Number(await invoiceCreator.invoiceCount());
    const tx = await invoiceCreator.register(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      details,
    );
    await tx.wait();
    const newInvoiceCount = Number(await invoiceCreator.invoiceCount());
    if (newInvoiceCount != invoiceCount + 1) {
      console.log('could not create invoice');
    }
    console.log('invoice created with index: ' + invoiceCount);
  } catch (error) {
    console.log(error);
  }
}

create();
