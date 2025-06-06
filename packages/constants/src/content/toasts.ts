// generally about 3 - 5 seconds for tx to confirm
// averaging about 20 seconds for the subgraph to index

export const TOASTS = {
  useInvoiceCreate: {
    waitingForTx: {
      title: 'Creating invoice',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Invoice has been created',
      description: 'Waiting for invoice to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Invoice created',
      description: 'Your invoice has been created!',
      duration: 5000,
      isClosable: true,
    },
  },
  useDeposit: {
    waitingForTx: {
      title: 'Depositing',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Deposit has been made onchain',
      description: 'Waiting for deposit to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Deposit successful',
      description:
        'Your payment has been deposited into the invoice. Refreshing balances...',
      duration: 5000,
      isClosable: true,
    },
  },
  useRelease: {
    waitingForTx: {
      title: 'Releasing',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Release has been made onchain',
      description: 'Waiting for release to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Release successful',
      description:
        'Your payment has been released to the provider. Refreshing balances...',
      duration: 5000,
      isClosable: true,
    },
  },
  useLock: {
    waitingForTx: {
      title: 'Locking',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Lock has been made onchain',
      description: 'Waiting for lock to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Lock successful',
      description:
        'Your invoice has been locked for dispute. Refreshing balances...',
      duration: 5000,
      isClosable: true,
    },
  },
  useWithdraw: {
    waitingForTx: {
      title: 'Withdrawing',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Withdrawal has been made onchain',
      description: 'Waiting for withdrawal to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Withdrawal successful',
      description: 'Your withdrawal has been made. Refreshing balances...',
      duration: 5000,
      isClosable: true,
    },
  },
  useResolve: {
    waitingForTx: {
      title: 'Resolving',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Resolution has been made onchain',
      description: 'Waiting for resolution to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Resolution successful',
      description: 'Your resolution has been made. Refreshing balances...',
      duration: 5000,
      isClosable: true,
    },
  },

  useAddMilestone: {
    waitingForTx: {
      title: 'Adding milestone(s)',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Milestone(s) added onchain',
      description: 'Waiting for milestone(s) to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Milestone(s) Updated successfully',
      description: 'Your milestones have been updated. Refreshing Invoice...',
      duration: 5000,
      isClosable: true,
    },
  },

  useVerify: {
    waitingForTx: {
      title: 'Enabling Non-Client Deposits ',
      description: 'Waiting for transaction confirmation',
      duration: null,
      isClosable: false,
    },
    waitingForIndex: {
      title: 'Non-Client Deposits have been enabled onchain',
      description: 'Waiting for update to be indexed by the subgraph',
      duration: null,
      isClosable: false,
    },
    success: {
      title: 'Non-Client Deposits enabled successfully',
      description: 'Your settings have been updated. Refreshing Invoice...',
      duration: 5000,
      isClosable: true,
    },
  },
};
