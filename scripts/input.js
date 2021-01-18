const ethers = require('ethers');
const { BigNumber } = ethers;
const prompt = require('async-prompt');

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

async function getInput() {
  let client = await prompt('client address: ');
  while (!ethers.utils.isAddress(client)) {
    console.log('invalid address');
    client = await prompt('client address: ');
  }
  let provider = await prompt('provider address: ');
  while (!ethers.utils.isAddress(client)) {
    console.log('invalid address');
    provider = await prompt('provider address: ');
  }
  let resolverType = Number(
    await prompt('resolver type (0=lex/user, 1=aragon): '),
  );
  while (isNaN(resolverType) || resolverType < 0 || resolverType > 1) {
    console.log('invalid resolverType');
    resolverType = Number(
      await prompt('resolver type (0=lex/user, 1=aragon): '),
    );
  }
  let resolver = await prompt('resolver address: ');
  while (!ethers.utils.isAddress(client)) {
    console.log('invalid address');
    resolver = await prompt('resolver address: ');
  }
  let token = await prompt('token address: ');
  while (!ethers.utils.isAddress(client)) {
    console.log('invalid address');
    token = await prompt('token address: ');
  }
  let numMilestones = Number(await prompt('numMilestones: '));
  while (isNaN(numMilestones) || numMilestones < 0 || numMilestones > 10) {
    console.log('invalid numMilestones');
    numMilestones = Number(await prompt('numMilestones: '));
  }
  let amounts = [];
  for (let i = 0; i < numMilestones; i++) {
    let amount = BigNumber.from(await prompt(`amount ${i} (wei): `));
    while (amount <= 0) {
      console.log('invalid amount');
      amount = BigNumber.from(await prompt(`amount ${i} (wei): `));
    }
    amounts.push(amount.toString());
  }
  let durationInDays = Number(await prompt('durationInDays: '));
  while (isNaN(durationInDays) || durationInDays <= 0) {
    console.log('invalid durationInDays');
    durationInDays = Number(await prompt('durationInDays: '));
  }
  let terminationTime = Math.floor(
    new Date().getTime() / 1000 + durationInDays * 24 * 60 * 60,
  );
  let projectName = await prompt('project name: ');
  while (!projectName) {
    console.log('invalid name');
    projectName = await prompt('project name: ');
  }
  let projectDescription = await prompt('project description: ');
  while (!projectDescription) {
    console.log('invalid description');
    projectDescription = await prompt('project description: ');
  }
  let projectAgreement = await prompt('project link: ');
  while (!URL_REGEX.test(projectAgreement)) {
    console.log('invalid link');
    projectAgreement = await prompt('project link: ');
  }
  console.log({
    client,
    provider,
    resolverType,
    resolver,
    token,
    numMilestones,
    amounts,
    durationInDays,
    terminationTime,
    projectName,
    projectDescription,
    projectAgreement,
  });

  return {
    client,
    provider,
    resolverType,
    resolver,
    token,
    amounts,
    terminationTime,
    projectName,
    projectDescription,
    projectAgreement,
  };
}

module.exports = getInput;
