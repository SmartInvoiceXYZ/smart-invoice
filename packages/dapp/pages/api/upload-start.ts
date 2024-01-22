import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';

const { PINATA_JWT } = process.env;

// eslint-disable-next-line no-use-before-define
const generateApiKey = async (keyRestrictions: KeyRestrictions) => {
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
      // eslint-disable-next-line no-console
      console.log(error);
      return null;
    });
};

// TODO move type
type KeyRestrictions = {
  keyName: string;
  maxUses: number;
  permissions: {
    endpoints: {
      data: {
        pinList: boolean;
        userPinnedDataTotal: boolean;
      };
      pinning: {
        pinFileToIPFS: boolean;
        pinJSONToIPFS: boolean;
        pinJobs: boolean;
        unpin: boolean;
        userPinPolicy: boolean;
      };
    };
  };
};

const keyRestrictions = () => {
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json('Method not allowed');
  }

  const count = _.get(req, 'body.count');
  const localRestrictions = keyRestrictions();
  if (_.gt(_.toNumber(count), 0)) {
    localRestrictions.maxUses = _.gt(count, 20) ? 20 : count;
  }

  try {
    const apiKey = await generateApiKey(localRestrictions);
    return res.send(apiKey);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return res.status(500).send('Server Error');
  }
};

export default handler;
