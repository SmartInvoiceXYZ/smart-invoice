interface EscrowStep {
  step_title: string;
  step_details: string[];
  next: string;
}

export const INVOICE_TYPES = {
  Escrow: 'escrow',
  Instant: 'instant',
};

export const PAYMENT_TYPES = {
  NATIVE: 'native',
  TOKEN: 'token',
};

export const ESCROW_STEPS: { [key: number]: EscrowStep } = {
  1: {
    step_title: 'Project Details',
    step_details: [],
    next: 'payment details',
  },
  2: {
    step_title: 'Escrow Details',
    step_details: [],
    next: 'set payment amounts',
  },
  3: {
    step_title: 'Payment Details',
    step_details: [],
    next: 'confirmation',
  },
  4: {
    step_title: 'Confirmation',
    step_details: [],
    next: 'create invoice',
  },
  5: {
    step_title: 'Invoice Created',
    step_details: [],
    next: 'invoice created',
  },
};

export const INSTANT_STEPS: { [key: number]: EscrowStep } = {
  1: {
    step_title: 'Project Details',
    step_details: [],
    next: 'payment details',
  },
  2: {
    step_title: 'Payment Details',
    step_details: [],
    next: 'confirm invoice',
  },
  3: {
    step_title: 'Confirmation',
    step_details: [],
    next: 'create invoice',
  },
};
