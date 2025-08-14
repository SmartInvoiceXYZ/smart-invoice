import fs from 'fs';
import { Hex } from 'viem';

import { DeploymentInfo, InvoiceType } from './types';

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

export function addZap(
  deploymentInfo: DeploymentInfo,
  zap: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (!newDeploymentInfo.zap) {
    newDeploymentInfo.zap = {
      zaps: [zap],
    };
    return newDeploymentInfo;
  }

  if (newDeploymentInfo.zap.zaps && newDeploymentInfo.zap.zaps.length > 0) {
    newDeploymentInfo.zap.zaps.unshift(zap);
  } else {
    newDeploymentInfo.zap.zaps = [zap];
  }

  return newDeploymentInfo;
}

export function addDaoZap(
  deploymentInfo: DeploymentInfo,
  zap: Hex,
): DeploymentInfo {
  const newDeploymentInfo = { ...deploymentInfo };
  if (!newDeploymentInfo.zap) {
    newDeploymentInfo.zap = {
      daoZaps: [zap],
    };
    return newDeploymentInfo;
  }

  if (
    newDeploymentInfo.zap.daoZaps &&
    newDeploymentInfo.zap.daoZaps.length > 0
  ) {
    newDeploymentInfo.zap.daoZaps.unshift(zap);
  } else {
    newDeploymentInfo.zap.daoZaps = [zap];
  }

  return newDeploymentInfo;
}
