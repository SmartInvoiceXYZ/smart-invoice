const axios = require("axios");
const { subtask, types } = require("hardhat/config");
const delay = require("delay");
const fs = require("fs");
const querystring = require("querystring");
const semver = require("semver");
const { isAddress } = require("@ethersproject/address");
const {
  Bytecode,
} = require("@nomiclabs/hardhat-etherscan/dist/src/solc/bytecode");

const BLOCKSCOUT_CHAIN_IDS = [77, 100];

const API_URLS = {
  77: "https://blockscout.com/poa/sokol/api",
  100: "https://gnosis.blockscout.com/api",
};

const EXPLORER_URLS = {
  77: "https://blockscout.com/poa/sokol/address",
  100: "https://gnosis.blockscout.com/address",
};

const VerificationStatus = {
  FAILED: "Fail - Unable to verify",
  VERIFIED: "Verified",
  ALREADY_VERIFIED: "Already verified",
};

const TASK_VERIFY_GET_COMPILER_VERSIONS = "verify:get-compiler-versions";
const TASK_VERIFY_GET_CONTRACT_INFORMATION = "verify:get-contract-information";
const TASK_VERIFY_VERIFY_BLOCKSCOUT = "verify:verify-blockscout";

async function retrieveContractBytecode(address, provider, networkName) {
  const bytecodeString = await provider.send("eth_getCode", [
    address,
    "latest",
  ]);
  const deployedBytecode = bytecodeString.startsWith("0x")
    ? bytecodeString.slice(2)
    : bytecodeString;
  if (deployedBytecode.length === 0) {
    throw new Error(
      `The address ${address} has no bytecode. Is the contract deployed to this network?
The selected network is ${networkName}.`,
    );
  }
  return deployedBytecode;
}

const METADATA_PRESENT_SOLC_NOT_FOUND_VERSION_RANGE = "0.4.7 - 0.5.8";
const METADATA_ABSENT_VERSION_RANGE = "<0.4.7";

function isVersionRange(version) {
  return (
    version === METADATA_ABSENT_VERSION_RANGE ||
    version === METADATA_PRESENT_SOLC_NOT_FOUND_VERSION_RANGE
  );
}

const COMPILERS_LIST_URL = "https://solc-bin.ethereum.org/bin/list.json";

async function getVersions() {
  try {
    const response = await axios.get(COMPILERS_LIST_URL);
    if (response.status !== 200) {
      throw new Error(`Got ${response.status}`);
    }
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to obtain list of solc versions. Reason: ${error.message}`,
    );
  }
}

async function getLongVersion(shortVersion) {
  const versions = await getVersions();
  const fullVersion = versions.releases[shortVersion];

  if (fullVersion === undefined || fullVersion === "") {
    throw new Error("Given solc version doesn't exist");
  }

  return fullVersion.replace(/(soljson-)(.*)(.js)/, "$2");
}

const fetchFlatSource = async contractName => {
  const sourcePath = `flat/${contractName}.sol`;
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Could not find ${contractName} source file at ${sourcePath}`,
    );
  }

  const flatSource = fs.readFileSync(sourcePath, {
    encoding: "utf8",
    flag: "r",
  });

  // Make sure we don't have multiple SPDX-License-Identifier statements
  if ((flatSource.match(/SPDX-License-Identifier:/g) || []).length > 1) {
    throw new Error(
      "Found duplicate SPDX-License-Identifiers in the Solidity code, please provide the correct license with --license <license identifier>",
    );
  }

  return flatSource;
};

const hasSourceCode = verificationResult =>
  verificationResult.data &&
  verificationResult.data.result &&
  verificationResult.data.result.SourceCode &&
  verificationResult.data.result.SourceCode.length > 0;

const verificationStatus = async (apiUrl, address) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    await delay(1000);

    try {
      const qs = querystring.stringify({
        module: "contract",
        action: "getsourcecode",
        address,
        ignoreProxy: 1,
      });

      // eslint-disable-next-line no-await-in-loop
      const verificationResult = await axios.get(`${apiUrl}?${qs}`);
      if (hasSourceCode(verificationResult)) {
        return VerificationStatus.VERIFIED;
      }
    } catch (error) {
      throw new Error(`Failed to connect to Blockscout API at url ${apiUrl}`);
    }
  }
};

const verifyContract = async (apiUrl, postQueries) => {
  const res = await axios.post(`${apiUrl}`, querystring.stringify(postQueries));
  if (!res.data) {
    throw new Error(`Failed to connect to verification API at url ${apiUrl}`);
  }

  if (
    res.data.message
      .toLowerCase()
      .includes(VerificationStatus.ALREADY_VERIFIED.toLowerCase())
  ) {
    return VerificationStatus.ALREADY_VERIFIED;
  }

  if (res.data.status !== "1") {
    throw new Error(res.data.result);
  }
  if (hasSourceCode(res)) return VerificationStatus.VERIFIED;

  const contractAddress = postQueries.addressHash;
  return verificationStatus(apiUrl, contractAddress);
};

const verifySubtask = async ({ address }, { network, run }) => {
  const chainId = parseInt(await network.provider.send("eth_chainId"), 16);

  if (!BLOCKSCOUT_CHAIN_IDS.includes(chainId)) {
    throw new Error(`${chainId} is not supported by Blockscout.`);
  }

  if (!isAddress(address)) {
    throw new Error(`${address} is an invalid address.`);
  }

  const compilerVersions = await run(TASK_VERIFY_GET_COMPILER_VERSIONS);

  const deployedBytecodeHex = await retrieveContractBytecode(
    address,
    network.provider,
    network.name,
  );

  const deployedBytecode = new Bytecode(deployedBytecodeHex);
  const inferredSolcVersion = deployedBytecode.getInferredSolcVersion();

  const matchingCompilerVersions = compilerVersions.filter(version =>
    semver.satisfies(version, inferredSolcVersion),
  );

  if (matchingCompilerVersions.length === 0) {
    const detailedContext = [];
    if (isVersionRange(inferredSolcVersion)) {
      detailedContext.push(
        `The expected version range is ${inferredSolcVersion}.`,
      );
    } else {
      detailedContext.push(`The expected version is ${inferredSolcVersion}.`);
    }
    // There is always at least one configured version.
    if (compilerVersions.length > 1) {
      detailedContext.push(
        `The selected compiler versions are: ${compilerVersions.join(", ")}`,
      );
    } else {
      detailedContext.push(
        `The selected compiler version is: ${compilerVersions[0]}`,
      );
    }
    const message = `The bytecode retrieved could not have been generated by any of the selected compilers.
${detailedContext.join("\n")}
Possible causes are:
  - Wrong compiler version selected in hardhat config.
  - The given address is wrong.
  - The selected network (${network.name}) is wrong.`;
    throw new Error(message);
  }

  const contractInformation = await run(TASK_VERIFY_GET_CONTRACT_INFORMATION, {
    deployedBytecode,
    matchingCompilerVersions,
    libraries: {},
  });

  const compilerVersion = await getLongVersion(contractInformation.solcVersion);

  const optimizationEnabled =
    (contractInformation &&
      contractInformation.compilerInput &&
      contractInformation.compilerInput.settings &&
      contractInformation.compilerInput.settings.optimizer &&
      contractInformation.compilerInput.settings.optimizer.enabled) ||
    false;

  const optimizationRuns =
    (contractInformation &&
      contractInformation.compilerInput &&
      contractInformation.compilerInput.settings &&
      contractInformation.compilerInput.settings.optimizer &&
      contractInformation.compilerInput.settings.optimizer.runs) ||
    0;

  const evmVersion =
    (contractInformation &&
      contractInformation.compilerInput &&
      contractInformation.compilerInput.settings &&
      contractInformation.compilerInput.settings.evmVersion) ||
    "default";

  const flatSource = await fetchFlatSource(contractInformation.contractName);

  const postQueries = {
    module: "contract",
    action: "verify",
    addressHash: address,
    contractSourceCode: flatSource,
    name: contractInformation.contractName,
    compilerVersion,
    optimization: optimizationEnabled,
    optimizationRuns,
    autodetectConstructorArguments: true,
    evmVersion,
  };

  const apiUrl = API_URLS[chainId];

  const status = await verifyContract(apiUrl, postQueries);

  if (status === VerificationStatus.FAILED) {
    throw new Error(
      `Failed to verify ${contractInformation.contractName} at ${address}`,
    );
  }

  const contractURL = `${EXPLORER_URLS[chainId]}/${address}/contracts`;

  // eslint-disable-next-line no-console
  console.log(
    `Successfully verified contract ${contractInformation.contractName} on Blockscout.
${contractURL}`,
  );
};

subtask(TASK_VERIFY_VERIFY_BLOCKSCOUT)
  .addParam("address", undefined, undefined, types.string)
  .addOptionalParam("constructorArguments", undefined, [], types.any)
  .setAction(verifySubtask);
