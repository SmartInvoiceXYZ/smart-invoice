const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test contract", function () {
  const a = "0x29D7d1dd5B6f9C864d9db560D72a247c178aE86B";
  const b = "123123123123132123123";
  const c = true;

  const myStructData = ethers.utils.AbiCoder.prototype.encode(
    ["address", "uint", "bool"],
    [a, b, c],
  );

  it("testing this shit", async function () {
    const [owner] = await ethers.getSigners();

    const Test = await ethers.getContractFactory("Test");

    const test = await Test.deploy();

    let result = await test.test(myStructData);
    console.log({ result });
    // console.log({testCall})
  });
});
