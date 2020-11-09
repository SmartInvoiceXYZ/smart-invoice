// rinkeby
export const aragon_court = '0x52180af656a1923024d1accf1d827ab85ce48878';
export const dai = '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42';
export const smart_invoices_mono = '0x143dB285462F6DC094297B7daDe3DE6DdB98969f';

// kovan
// export const smart_invoices_mono = '0xCE0cD015664Da65c237556025825310641FfC8FF';

export const graph_url =
  'https://api.thegraph.com/subgraphs/name/raid-guild/rinkeby-smart-invoices-mono';

export const nav_items = [
  {
    name: 'How it Works',
    link: '',
  },
  {
    name: 'FAQ',
    link: '',
  },
  {
    name: 'Home',
    link: '',
  },
];

export const steps = {
  1: {
    step_title: 'Project Details',
    step_details: [
      'Note: All invoice data will be stored on-chain and can be viewed by anyone.',
      'If you have privacy concerns, we recommend taking care to add permissions to your project agreement document.',
      'Character Count will effect gas cost.',
    ],
    next: 'payment details',
  },
  2: {
    step_title: 'Payment Details',
    step_details: [],
    next: 'set payment amounts',
  },
  3: {
    step_title: 'Payment Chunks',
    step_details: [],
    next: 'confirmation',
  },
  4: {
    step_title: 'Confirmation',
    step_details: [],
    next: 'register invoice escrow',
  },
};
