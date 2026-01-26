import { BASE_URL } from '@smartinvoicexyz/constants';
import Document, { Head, Html } from 'next/document';

const m = {
  title: 'Smart Invoice',
  type: 'website',
  description:
    'Smart Invoice is an easy-to-use tool that provides web3 freelancers with cryptocurrency invoicing, escrow, and arbitration.',
  version: 'next',
  url: BASE_URL,
  imageUrl: `${BASE_URL}/si-banner.png`,
  button: {
    title: 'Smart Invoice',
    action: {
      type: 'launch_frame',
      name: 'Smart Invoice',
      url: BASE_URL,
      splashImageUrl: `${BASE_URL}/favicon-32x32.png`,
      splashBackgroundColor: '#ffffff',
    },
  },
};
export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="fc:frame" content={`${JSON.stringify(m)}`} />
          <meta name="fc:miniapp" content={`${JSON.stringify(m)}`} />
          <meta name="base:app_id" content="6977498c88e3bac59cf3d980" />
        </Head>
      </Html>
    );
  }
}
