/* eslint-disable camelcase */
import { Address } from 'viem';

import { isAddress, logDebug } from '../utils/helpers';
import { clients } from './client';
import { typedGql } from './zeus/typedDocumentNode';
import { Agreement_orderBy, Deposit_orderBy, Dispute_orderBy, OrderDirection, Release_orderBy, Resolution_orderBy, Verified_orderBy, _SubgraphErrorPolicy_ } from './zeus';
import { scalars } from './scalars';

const invoiceQuery = (id: string) =>
  typedGql('query', {scalars})({
    invoice: [
      { 
        id,
        subgraphError: _SubgraphErrorPolicy_.allow, 
      }, 
      {
        id: true,
        address: true,
        token: true,    
        amounts: true,
        client: true,
        createdAt: true,
        currentMilestone: true,
        deposits: [
          {
            // first: 10,
            orderBy: Deposit_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          }, 
          {  
            id: true,
            txHash: true,
            sender: true,
            amount: true,
            timestamp: true,
          }
        ],
        disputes: [
          {
            orderBy: Dispute_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          }, 
          {
            id: true,
            details: true,
            disputeFee: true,
            disputeId: true,
            disputeToken: true,
            ipfsHash: true,
            sender: true,
            timestamp: true,
            txHash: true,
          }
        ],
        endDate: true,
        invoiceType: true,
        isLocked: true,
        network: true,
        projectName: true,
        projectDescription: true,
        projectAgreement: [
          {
            orderBy: Agreement_orderBy.createdAt,
            orderDirection: OrderDirection.desc,
          }, 
          {
            id: true,
            type: true,
            src: true,
            createdAt: true,
          }
        ],
        provider: true,
        releases: [
          {
            orderBy: Release_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          }, 
          {
            id: true,
            amount: true,
            milestone: true,            
            timestamp: true,
            txHash: true,
          }
        ],
        released: true,
        resolutionRate: true,
        resolutions: [
          {
            orderBy: Resolution_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          }, 
          {
            id: true,
            clientAward: true,
            ipfsHash: true,
            providerAward: true,
            resolutionDetails: true,
            resolutionFee: true,
            resolver: true,
            resolverType: true,
            timestamp: true,
            txHash: true,
          }
        ],
        resolver: true,
        resolverType: true,
        startDate: true,
        terminationTime: true,
        total: true,
        verified: [          {
          orderBy: Verified_orderBy.client,
          orderDirection: OrderDirection.asc,
        }, {
          id: true,
          client: true,          
        }],
        version: true,
      }
    ]
  });

export const fetchInvoice = async (chainId: number, queryAddress: Address) => {
  const address = isAddress(queryAddress);
  if (!address) return null;

  const query = invoiceQuery(address);
  const { data, error } = await clients[chainId]
    .query({query});

  logDebug({ data, error, address });

  if (!data) {
    if (error) {
      throw error;
    }
    return undefined;
  }

  return data.invoice;
};

export type Invoice = Awaited<ReturnType<typeof fetchInvoice>>;
