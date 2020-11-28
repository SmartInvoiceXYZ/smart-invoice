import { client } from './client';
import gql from 'fake-tag';

const invoiceQuery = gql`
  query GetInvoice($index: ID!) {
    invoice(id: $index) {
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
  }
`;

export const getInvoice = async index => {
  if (!index) return null;
  const { data, error } = await client
    .query(invoiceQuery, { index: `0x${index.toString(16)}` })
    .toPromise();
  if (!data) {
    if (error) {
      throw error;
    }
  }
  return data.invoice;
};
