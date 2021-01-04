import gql from 'fake-tag';

export const InvoiceDetails = gql`
  fragment InvoiceDetails on Invoice {
    index
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
    balance
    released
    createdAt
    terminationTime
    projectName
    projectDescription
    projectAgreement
    startDate
    endDate
  }
`;
