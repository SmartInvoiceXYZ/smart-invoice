// @ts-expect-error TS(2792): Cannot find module 'fake-tag'. Did you mean to set... Remove this comment to see the full error message
import gql from 'fake-tag';

export const InvoiceDetails = gql`
  fragment InvoiceDetails on Invoice {
    id
    address
    invoiceType
    version
    network
    token
    client
    provider
    resolverType
    resolver
    resolutionRate
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
    invoiceType
    version
    projectAgreement(orderBy: createdAt, orderDirection: asc) {
      type
      src
      createdAt
    }
    startDate
    endDate
    milestonesAdded {
      id
      sender
      invoice
      milestones
    }
    verified {
      id
      client
      invoice
    }
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
