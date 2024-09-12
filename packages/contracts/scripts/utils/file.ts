import fs from 'fs';
import { Hex } from 'viem';

import { DeploymentInfo, InvoiceType, Zap } from './types';

export function writeDeploymentInfo(
  deploymentInfo: DeploymentInfo,
  name: string,
): void {
  fs.writeFileSync(
    `deployments/${name}.json`,
    JSON.stringify(deploymentInfo, undefined, 2),
  );
}

export function readDeploymentInfo(name: string): DeploymentInfo {
  const data = fs.readFileSync(`deployments/${name}.json`, {
    encoding: 'utf8',
  });

  if (!data) throw new Error(`Deployment info not found for network: ${name}`);

  return JSON.parse(data);
}

export function appendImplementation(
  deploymentInfo: DeploymentInfo,
  key: InvoiceType,
  address: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (
    newDeploymentInfo.implementations &&
    newDeploymentInfo.implementations[key] !== undefined
  ) {
    newDeploymentInfo.implementations[key].push(address);
  } else {
    if (!newDeploymentInfo.implementations) {
      newDeploymentInfo.implementations = {};
    }
    newDeploymentInfo.implementations[key] = [address];
  }
  return newDeploymentInfo;
}

export function updateSpoilsManager(
  deploymentInfo: DeploymentInfo,
  factory: Hex,
  implementation: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (!deploymentInfo.spoilsManager) {
    newDeploymentInfo.spoilsManager = {
      factory,
      implementations: [implementation],
    };
    return newDeploymentInfo;
  }

  const spoilsManagerImplementations =
    newDeploymentInfo.spoilsManager?.implementations ?? [];
  if (spoilsManagerImplementations?.length > 0) {
    spoilsManagerImplementations.push(implementation);
  }
  newDeploymentInfo.spoilsManager = {
    factory,
    implementations: spoilsManagerImplementations,
  };
  return newDeploymentInfo;
}

export function addSpoilsManagerInstance(
  deploymentInfo: DeploymentInfo,
  instance: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (!newDeploymentInfo.zap) {
    newDeploymentInfo.zap = {} as Zap;
  }
  newDeploymentInfo.zap.spoilsManager = instance;
  return newDeploymentInfo;
}

export function addZapInstance(
  deploymentInfo: DeploymentInfo,
  zap: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (!newDeploymentInfo.zap) {
    newDeploymentInfo.zap = {
      implementations: [],
      instances: [zap],
    };
    return newDeploymentInfo;
  }

  if (
    newDeploymentInfo.zap.instances &&
    newDeploymentInfo.zap.instances.length > 0
  ) {
    newDeploymentInfo.zap.instances.unshift(zap);
  } else {
    newDeploymentInfo.zap.instances = [zap];
  }

  return newDeploymentInfo;
}

export function addZapImplementation(
  deploymentInfo: DeploymentInfo,
  implementation: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (!newDeploymentInfo.zap) {
    newDeploymentInfo.zap = {
      implementations: [implementation],
      instances: [],
    };
    return newDeploymentInfo;
  }

  if (
    newDeploymentInfo.zap.implementations &&
    newDeploymentInfo.zap.implementations.length > 0
  ) {
    newDeploymentInfo.zap.implementations.push(implementation);
  } else {
    newDeploymentInfo.zap.implementations = [implementation];
  }

  return newDeploymentInfo;
}

export function addZapFactory(
  deploymentInfo: DeploymentInfo,
  factory: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (!newDeploymentInfo.zap) {
    newDeploymentInfo.zap = {
      factory,
      implementations: [],
      instances: [],
    };
    return newDeploymentInfo;
  }
  newDeploymentInfo.zap.factory = factory;
  return newDeploymentInfo;
}
