import { BASE_URL } from '@smartinvoicexyz/constants';
import type { NextApiRequest, NextApiResponse } from 'next';

import { withCors } from '../../utils/cors';

const ACCOUNT_ASSOCIATION = {
  // app.smartinvoice.xyz
  // by dan13ram.eth
  header:
    'eyJmaWQiOjM5NzE0MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDZGRGRBRjE5RjNERjJiMWNCYTE2YTM1MkIzZTJiQzkwQTVEMWU2OTEifQ',
  payload: 'eyJkb21haW4iOiJhcHAuc21hcnRpbnZvaWNlLnh5eiJ9',
  signature:
    'qj8QVaaVKfCM4Rlkupvvu9W8wkDlJ6ATra1nB9t1SOBJVsMmWATrEsaknXczIR6yJV5qfmE/8NwIhpzA/bJBoRs=',
};

function handler(_req: NextApiRequest, res: NextApiResponse) {
  const frame = {
    version: '1',
    name: 'Smart Invoice',
    description:
      'Smart Invoice is an easy-to-use tool that provides web3 freelancers with cryptocurrency invoicing, escrow, and arbitration.',
    iconUrl: `${BASE_URL}/favicon-32x32.png`,
    homeUrl: `${BASE_URL}`,
    heroImageUrl: `${BASE_URL}/si-banner.png`,
    splashImageUrl: `${BASE_URL}/favicon-32x32.png`,
    splashBackgroundColor: '#ffffff',
    primaryCategory: 'social',
  };

  const accountAssociation =
    BASE_URL === 'https://app.smartinvoice.xyz' ? ACCOUNT_ASSOCIATION : null;

  const farcaster = accountAssociation
    ? { frame, accountAssociation }
    : { frame };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(farcaster);
}

export default withCors()(handler);
