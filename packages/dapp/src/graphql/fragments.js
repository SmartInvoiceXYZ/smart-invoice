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
    deposits(orderBy: timestamp, orderDirection: asc) {
      txHash
      sender
      amount
      timestamp
    }
    releases(orderBy: timestamp, orderDirection: asc) {
      txHash
      milestone
      amount
      timestamp
    }
    disputes(orderBy: timestamp, orderDirection: asc) {
      txHash
      ipfsHash
      sender
      details
      timestamp
    }
    resolutions(orderBy: timestamp, orderDirection: asc) {
      txHash
      ipfsHash
      clientAward
      providerAward
      resolutionFee
      timestamp
    }
  }
`;
