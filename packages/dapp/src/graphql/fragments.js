import gql from 'fake-tag';

export const InvoiceDetails = gql`
  fragment InvoiceDetails on Invoice {
    address
    token
    client
    provider
    resolverType
    resolver
    isLocked
    amounts
    numMilestones
    currentMilestone
    total
    disputeId
    released
    createdAt
    terminationTime
    projectName
    projectDescription
    projectAgreement
    startDate
    endDate
    releases {
      txHash
      milestone
      amount
      timestamp
    }
    disputes {
      txHash
      sender
      details
      timestamp
    }
    resolutions {
      txHash
      clientAward
      providerAward
      resolutionFee
      timestamp
    }
  }
`;
