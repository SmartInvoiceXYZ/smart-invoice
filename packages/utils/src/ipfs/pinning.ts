import { logDebug } from '@smartinvoicexyz/shared';
import { KeyRestrictions } from '@smartinvoicexyz/types';
import _ from 'lodash';

const { PINATA_JWT } = process.env;

const pinJson = async (data: object, metadata: object, token: string) => {
  const pinataData = JSON.stringify({
    pinataOptions: {
      cidVersion: 0,
    },
    pinataMetadata: {
      ...metadata,
    },
    pinataContent: {
      ...data,
    },
  });

  try {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      method: 'POST',
      body: pinataData,
    });

    const json = await res.json();

    return _.get(json, 'IpfsHash');
  } catch (e) {
    logDebug({ pinataData, token });
    console.error("Couldn't pin data to pinata: ", e);
    return null;
  }
};

interface handleDetailsPinProps {
  details: object;
  name?: string;
  token: string;
}

export const handleDetailsPin = async ({
  details,
  name,
  token,
}: handleDetailsPinProps) => pinJson(details, { name }, token);

export const fetchToken = async (count: number = 0) => {
  const token = await fetch('/api/upload-start', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ count }),
  })
    .then(res => res.text())
    .catch(e => {
      console.error("Couldn't fetch token", e);
      return null;
    });

  return token;
};

export const generateApiKey = async (keyRestrictions: KeyRestrictions) => {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT env variable is not set');
  }
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(keyRestrictions),
  };

  return fetch('https://api.pinata.cloud/users/generateApiKey', options)
    .then(response => response.json())
    .then(json => {
      if (!_.includes(_.keys(json), 'JWT')) throw new Error('No JWT found');

      const { JWT } = json;
      return JWT;
    })
    .catch(error => {
      console.error(`Failed to generate API key: ${error}`);
      return null;
    });
};

export const keyRestrictions = () => {
  const date = new Date();
  return {
    keyName: `Signed Upload JWT-${date.toISOString()}`,
    maxUses: 2,
    permissions: {
      endpoints: {
        data: {
          pinList: false,
          userPinnedDataTotal: false,
        },
        pinning: {
          pinFileToIPFS: true, // image
          pinJSONToIPFS: true, // json
          pinJobs: false,
          unpin: true, // image (both?)
          userPinPolicy: false,
        },
      },
    },
  };
};
