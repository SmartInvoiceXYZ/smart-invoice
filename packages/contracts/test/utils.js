const { ethers } = require('hardhat');

module.exports.awaitInvoiceAddress = async receipt => {
  if (!receipt || !receipt.logs) return '';
  const abi = new ethers.utils.Interface([
    'event LogNewInvoice(uint256 indexed id, address invoice, uint256[] amounts)',
  ]);
  const eventFragment = abi.events[Object.keys(abi.events)[0]];
  const eventTopic = abi.getEventTopic(eventFragment);
  const event = receipt.logs.find(e => e.topics[0] === eventTopic);
  if (event) {
    const decodedLog = abi.decodeEventLog(
      eventFragment,
      event.data,
      event.topics,
    );
    return decodedLog.invoice;
  }
  return '';
};

module.exports.sleep = async s => {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
};
