const contract_address = '0xCE0cD015664Da65c237556025825310641FfC8FF';

const graph_url =
  'https://api.thegraph.com/subgraphs/name/raid-guild/kovan-smart-invoices-mono';

const nav_items = [
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

const steps = {
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

module.exports = { contract_address, graph_url, nav_items, steps };
