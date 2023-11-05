const fs = require("fs");

function writeDeploymentInfo(deploymentInfo, name) {
  fs.writeFileSync(
    `deployments/${name}.json`,
    JSON.stringify(deploymentInfo, undefined, 2),
  );
}

function readDeploymentInfo(name) {
  const data = fs.readFileSync(`deployments/${name}.json`, {
    encoding: "utf8",
  });

  return JSON.parse(data);
}

function appendImplementation(deploymentInfo, key, address) {
  const newDeploymentInfo = deploymentInfo;
  if (newDeploymentInfo.implementations[key] !== undefined) {
    newDeploymentInfo.implementations[key].push(address);
  } else {
    newDeploymentInfo.implementations[key] = [address];
  }
  return newDeploymentInfo;
}

function updateSpoilsManager(deploymentInfo, factory, implementation) {
  const newDeploymentInfo = deploymentInfo;
  if (!deploymentInfo.spoilsManager) {
    newDeploymentInfo.spoilsManager = {
      factory,
      implementations: [implementation],
    };
    return newDeploymentInfo;
  }

  const spoilsManagerImplementations =
    deploymentInfo.spoilsManager.implementations;
  if (deploymentInfo.spoilsManager.implementations.length > 0) {
    spoilsManagerImplementations.push(implementation);
  }
  newDeploymentInfo.spoilsManager = {
    factory,
    implementations: [implementation],
  };
  return newDeploymentInfo;
}

function addSpoilsManagerInstance(deploymentInfo, instance) {
  const newDeploymentInfo = deploymentInfo;
  if (!deploymentInfo.zap) {
    newDeploymentInfo.zap.spoilsManager = instance;
    return newDeploymentInfo;
  }
  newDeploymentInfo.zap.spoilsManager = instance;
  return newDeploymentInfo;
}

function addZapInstance(deploymentInfo, zap) {
  const newDeploymentInfo = deploymentInfo;
  if (!deploymentInfo.zap) {
    newDeploymentInfo.zap = {
      instances: zap,
    };
    return newDeploymentInfo;
  }

  const zapImplementations = deploymentInfo.zap.instances;
  if (deploymentInfo.zap.instances && deploymentInfo.zap.instances.length > 0) {
    zapImplementations.unshift(zap);
  } else {
    newDeploymentInfo.zap.instances = [zap];
  }

  return newDeploymentInfo;
}

function addZapImplementation(deploymentInfo, implementation) {
  const newDeploymentInfo = deploymentInfo;
  if (!deploymentInfo.zap) {
    newDeploymentInfo.zap = {
      implementations: [implementation],
    };
    return newDeploymentInfo;
  }

  const zapImplementations = deploymentInfo.zap.implementations;
  if (deploymentInfo.zap.implementations.length > 0) {
    zapImplementations.push(implementation);
  } else {
    newDeploymentInfo.zap.implementations = [implementation];
  }

  return newDeploymentInfo;
}

function addZapFactory(deploymentInfo, factory) {
  const newDeploymentInfo = deploymentInfo;
  if (!deploymentInfo.zap) {
    newDeploymentInfo.zap = {
      factory,
    };
    return newDeploymentInfo;
  }
  newDeploymentInfo.zap.factory = factory;
  return newDeploymentInfo;
}

module.exports = {
  writeDeploymentInfo,
  readDeploymentInfo,
  appendImplementation,
  updateSpoilsManager,
  addSpoilsManagerInstance,
  addZapInstance,
  addZapImplementation,
  addZapFactory,
};
