import { generateApiKey, keyRestrictions } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';

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
    console.error('Error in /api/upload-start', e);
    return res.status(500).send('Server Error');
  }
};

export default handler;
