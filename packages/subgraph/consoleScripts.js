// import SmartInvoice from '../contracts/build/contracts/SmartInvoice.sol/SmartInvoice.json'
// const { ethers } = require("ethers");

// const { ethers } = require("ethers");

let newInvoiceAddress;
let smartInvoice;
let timestamp;
let amounts = [10, 12, 13, 14];
let termination = 0;
let bytes =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
let token = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

const factory = await (
  await ethers.getContractFactory('SmartInvoiceFactory')
).attach('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
[client, serviceProvider, resolver] = await ethers.getSigners();

const provider = ethers.getDefaultProvider();

await provider.getBlockNumber().then(function (blockNumber) {
  // getBlock returns a block object and it has a timestamp property.
  provider.getBlock(blockNumber).then(function (block) {
    // Assign block.timestamp to timestamp variable
    timestamp = block.timestamp;
    termination = timestamp + 100000;
  });
});

await factory.on('LogNewInvoice', (invoiceId, _invoiceAddress, _amounts) => {
  newInvoiceAddress = _invoiceAddress;
});

await factory.create(
  client.address,
  serviceProvider.address,
  0,
  resolver.address,
  token,
  amounts,
  termination,
  bytes,
  true,
);

smartInvoice = await ethers.getContractAt(
  'SmartInvoice',
  newInvoiceAddress,
  client,
);

const verifyReceipt = await smartInvoice.connect(client).verify();
