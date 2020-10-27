const ethers = require('ethers');
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
      let amount = Number(await prompt(`amount ${i} (wei): `));
      while (isNaN(amount) || amount <= 0) {
        console.log('invalid amount');
        resolverType = Number(await prompt(`amount ${i} (wei): `));
      }
      amounts.push(amount);
    }
    let durationInDays = Number(await prompt('durationInDays: '));
    while (isNaN(durationInDays) || durationInDays <= 0) {
      console.log('invalid durationInDays');
      durationInDays = Number(await prompt('durationInDays: '));
    }
    let terminationTime =
      Math.floor(new Date().getTime() / 1000) + durationInDays * 24 * 60 * 60;
    let name = await prompt('project name: ');
    while (!name) {
      console.log('invalid name');
      name = await prompt('project name: ');
    }
    let description = await prompt('project description: ');
    while (!description) {
      console.log('invalid description');
      description = await prompt('project description: ');
    }
    let link = await prompt('project link: ');
    while (!URL_REGEX.test(link)) {
      console.log('invalid link');
      link = await prompt('project link: ');
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
      name,
      description,
      link,
    });

    return {
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
    };
}

module.exports = getInput;
