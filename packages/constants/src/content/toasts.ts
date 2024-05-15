// generally about 3 - 5 seconds for tx to confirm
// averaging about 20 seconds for the subgraph to index

export const TOASTS = {
  useInvoiceCreate: {
    waitingForTx: {
      title: 'Creating invoice',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Invoice has been created',
      description: 'Waiting for invoice to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Invoice created',
      description: 'Your invoice has been created. Taking you there now...',
    },
  },
  useDeposit: {
    waitingForTx: {
      title: 'Depositing',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Deposit has been made onchain',
      description: 'Waiting for deposit to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Deposit successful',
      description: 'Your deposit has been made. Refreshing balances...',
    },
  },
  useRelease: {
    waitingForTx: {
      title: 'Releasing',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Release has been made onchain',
      description: 'Waiting for release to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Release successful',
      description: 'Your release has been made. Refreshing balances...',
    },
  },
  useLock: {
    waitingForTx: {
      title: 'Locking',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Lock has been made onchain',
      description: 'Waiting for lock to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Lock successful',
      description: 'Your lock has been made. Refreshing balances...',
    },
  },
  useWithdraw: {
    waitingForTx: {
      title: 'Withdrawing',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Withdrawal has been made onchain',
      description: 'Waiting for withdrawal to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Withdrawal successful',
      description: 'Your withdrawal has been made. Refreshing balances...',
    },
  },
  useResolve: {
    waitingForTx: {
      title: 'Resolving',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Resolution has been made onchain',
      description: 'Waiting for resolution to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Resolution successful',
      description: 'Your resolution has been made. Refreshing balances...',
    },
  },

  useAddMilestone: {
    waitingForTx: {
      title: 'Adding milestone(s)',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Milestone(s) added onchain',
      description: 'Waiting for milestone(s) to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Milestone(s) Updated successfully',
      description: 'Your milestones have been updated. Refreshing Invoice...',
    },
  },

  useVerify: {
    waitingForTx: {
      title: 'Enabling Non-Client Deposits ',
      description: 'Waiting for transaction confirmation',
      duration: 5000,
    },
    waitingForIndex: {
      title: 'Non-Client Deposits have been enabled onchain',
      description: 'Waiting for update to be indexed by the subgraph',
      duration: 8000,
    },
    success: {
      title: 'Non-Client Deposits enabled successfully',
      description: 'Your settings have been updated. Refreshing Invoice...',
    },
  },
};
