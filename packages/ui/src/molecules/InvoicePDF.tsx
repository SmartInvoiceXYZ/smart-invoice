import React, { Fragment } from 'react';
import { formatEther } from 'viem';

import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import {
  getAccountString,
  getHexChainId,
  unixToDateTime,
} from '@smart-invoice/utils';
import { Invoice } from '@smart-invoice/graphql';
import { Network } from '@smart-invoice/types';

const borderColor = 'black';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontStyle: 'bold',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
  title: {
    color: 'black',
    letterSpacing: 4,
    fontSize: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  address: {
    color: 'black',
    letterSpacing: 2,
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  detailsContainer: {
    marginTop: 15,
  },
  details: {
    fontFamily: 'Helvetica-Bold',
    color: 'black',
    fontWeight: 'ultrabold',
    letterSpacing: 2,
    fontSize: 10,
    textAlign: 'left',
    textTransform: 'uppercase',
  },
  symbol: {
    fontFamily: 'Helvetica',
    color: 'black',
    fontWeight: 'ultrabold',
    fontSize: 10,
    textAlign: 'left',
    textTransform: 'uppercase',
  },
  text: {
    fontFamily: 'Helvetica',
    color: 'black',
    letterSpacing: 2,
    fontSize: 10,
    textAlign: 'left',
    textTransform: 'lowercase',
  },
  separator: {
    borderBottomColor: 'black',
    borderBottomWidth: '1',
    marginTop: 15,
  },
  separatorTwo: {
    borderBottomColor: 'black',
    borderBottomWidth: '1',
    marginTop: 10,
  },
  underline: {
    borderBottom: 1,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#D3D3D3',
  },
  container: {
    flexDirection: 'row',
    borderBottomColor: '#D3D3D3',
    backgroundColor: '#D3D3D3',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    textAlign: 'center',
    fontStyle: 'bold',
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    fontStyle: 'bold',
  },
  listTitle: {
    paddingLeft: 8,
  },
  listContainer: {
    paddingLeft: 8,
    border: 2,
    paddingTop: 10,
    marginTop: 5,
  },
  innerTitle: {
    textAlign: 'center',
  },
  invisibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    fontStyle: 'bold',
  },
  description: {
    width: '50%',
    textAlign: 'left',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    paddingLeft: 8,
  },
  totalDescription: {
    width: '50%',
    textAlign: 'left',
    paddingLeft: 8,
  },
  amount: {
    width: '45%',
    textAlign: 'left',
    paddingLeft: 10,
  },
  secondTitle: {
    color: 'black',
    letterSpacing: 4,
    fontSize: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: '15',
  },
  multiDetailBlock: {
    borderColor: '#D3D3D3',
    border: '3',
    marginTop: '10',
  },
  detailPair: {
    textAlign: 'center',
    paddingTop: 5,
  },
  detailRow: {
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    fontStyle: 'bold',
  },
});

export type InvoicePDFProps = {
  invoice: Invoice;
  symbol: string;
};

// font register for Rubik One
function InvoicePDF({ invoice, symbol }: InvoicePDFProps) {
  const {
    address,
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    terminationTime,
    client,
    provider,
    amounts,
    network,
    createdAt,
    deposits,
    releases,
    disputes,
    resolutions,
  } = invoice ?? {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* General Details */}

        <View>
          <Text style={styles.title}>Smart Invoice</Text>

          <View>
            <Text style={styles.address}>{address}</Text>

            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <Link
              src={`https://smartinvoice.xyz/${getHexChainId(
                network as Network,
              )}/${address}`}
            >
              <Text style={{ textAlign: 'center' }}>
                {getAccountString(address)} @ smartinvoice.xyz
              </Text>
            </Link>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailsContainer}>
          <Text style={styles.details}>
            Client: <Text style={styles.text}>{client}</Text>
          </Text>

          <Text style={styles.details}>
            Provider: <Text style={styles.text}>{provider}</Text>
          </Text>

          <Text style={styles.details}>
            Network: <Text style={styles.text}>{network}</Text>
          </Text>

          <Text style={styles.details}>
            Token: <Text style={styles.symbol}>{symbol}</Text>
          </Text>

          <View style={{ paddingTop: 5 }} />

          <Text style={styles.details}>
            Invoice Created:{' '}
            <Text style={styles.text}>{unixToDateTime(Number(createdAt))}</Text>
          </Text>

          <Text style={styles.details}>
            Termination Time:{' '}
            <Text style={styles.text}>
              {unixToDateTime(Number(terminationTime))}
            </Text>
          </Text>
          {startDate && startDate > 0 ? (
            <Text style={styles.details}>
              Project Start Date:{' '}
              <Text style={styles.text}>
                {unixToDateTime(Number(startDate))}
              </Text>
            </Text>
          ) : null}
          {endDate && endDate > 0 ? (
            <Text style={styles.details}>
              Expected Project End Date:{' '}
              <Text style={styles.text}>{unixToDateTime(Number(endDate))}</Text>
            </Text>
          ) : null}
        </View>

        <View style={styles.separatorTwo} />

        {projectAgreement && (
          <View style={styles.detailsContainer}>
            <Text style={styles.details}>
              Project Name: <Text style={styles.text}>{projectName}</Text>
            </Text>

            <Text style={styles.details}>
              Description: <Text style={styles.text}>{projectDescription}</Text>
            </Text>
            <Text style={styles.details}>Project Agreement(s):</Text>
            {projectAgreement.map((agreement: any, index: any) => (
              <View key={agreement.id}>
                <Text style={[styles.text]}>Agreement #{index + 1}:</Text>

                <Text style={[styles.text, { textIndent: 20 }]}>
                  Created At: {unixToDateTime(Number(agreement.createdAt))}
                </Text>

                <Text style={[styles.text, { textIndent: 20 }]}>
                  Agreement Source: {agreement.src}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment Milestones */}
        {amounts && (
          <>
            <View style={styles.tableContainer}>
              <View style={styles.container}>
                <Text style={styles.description}>Payment Milestones</Text>

                <Text style={styles.amount}>Amount</Text>
              </View>
            </View>
            {amounts.map((amount: any, index: any) => {
              let amountTotal = BigInt(0);
              if (index + 1 === amounts.length) {
                const sum = amounts.reduce(
                  (a: any, b: any) => a + BigInt(b),
                  BigInt(0),
                );
                amountTotal = sum;
              }
              return (
                <View key={amount + BigInt(index)}>
                  <View style={styles.row}>
                    <Text style={styles.description}>
                      Payment Milestone # {index + 1}
                    </Text>
                    <Text style={styles.amount}>
                      {formatEther(BigInt(amount))} {symbol}
                    </Text>
                  </View>
                  {amountTotal > 0 ? (
                    <View style={styles.row}>
                      <Text style={styles.totalDescription}>TOTAL</Text>
                      <Text style={styles.amount}>
                        {formatEther(amountTotal)} {symbol}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        )}

        {/* Deposits */}
        {deposits && (
          <>
            <View style={styles.tableContainer}>
              <View style={styles.container}>
                <Text style={styles.listTitle}>Deposits</Text>
              </View>
            </View>

            {deposits.map((deposit: any, index: any) => (
              <Fragment key={deposit.txHash}>
                <View style={styles.listContainer}>
                  <View style={styles.innerTitle}>
                    <Text style={styles.underline}>Deposit #{index + 1}</Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      Sender: <Text>{deposit.sender}</Text>
                    </Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      Amount: <Text>{formatEther(deposit.amount)}</Text>
                    </Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      Timestamp:{' '}
                      <Text>{unixToDateTime(Number(deposit.timestamp))}</Text>
                    </Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      TxHash: <Text>{deposit.txHash}</Text>
                    </Text>
                  </View>
                </View>
              </Fragment>
            ))}
          </>
        )}

        {/* Releases */}

        {releases && (
          <>
            <View style={styles.tableContainer}>
              <View style={styles.container}>
                <Text style={styles.listTitle}>Releases</Text>
              </View>
            </View>

            {releases.map((release: any, index: any) => (
              <Fragment key={release.txHash}>
                <View style={styles.listContainer}>
                  <View style={styles.innerTitle}>
                    <Text style={styles.underline}>Release #{index + 1}</Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      Milestone: <Text>{Number(release.milestone) + 1}</Text>
                    </Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      Amount:{' '}
                      <Text>
                        {formatEther(release.amount)} {symbol}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      Timestamp:{' '}
                      <Text>{unixToDateTime(Number(release.timestamp))}</Text>
                    </Text>
                  </View>

                  <View style={styles.invisibleRow}>
                    <Text>
                      TxHash: <Text>{release.txHash}</Text>
                    </Text>
                  </View>
                </View>
              </Fragment>
            ))}
          </>
        )}
      </Page>

      {/* Disputes */}
      {disputes && disputes.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <View>
            <Text style={styles.secondTitle}>Disputes</Text>
          </View>

          {disputes.map((dispute: any, index: any) => (
            <View style={styles.multiDetailBlock} key={dispute.id}>
              <Text
                style={[
                  styles.details,
                  { borderBottom: '3', textAlign: 'center', paddingTop: '2' },
                ]}
              >
                Dispute #{index + 1}
              </Text>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Sender:</Text>

                <Text style={styles.detailRow}>{dispute.sender}</Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Details:</Text>

                <Text style={styles.detailRow}>{dispute.details}</Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>IPFS Hash:</Text>

                <Text style={styles.detailRow}>{dispute.ipfsHash}</Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>TxHash:</Text>

                <Text style={styles.detailRow}>{dispute.txHash}</Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Timestamp:</Text>

                <Text style={styles.detailRow}>
                  {unixToDateTime(Number(dispute.timestamp))}
                </Text>
              </View>
            </View>
          ))}
        </Page>
      ) : null}

      {/* Resolutions */}
      {resolutions && resolutions.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <View>
            <Text style={styles.secondTitle}>Resolutions</Text>
          </View>

          {resolutions.map((resolution: any, index: any) => (
            <View style={styles.multiDetailBlock} key={resolution.txHash}>
              <Text
                style={[
                  styles.details,
                  { borderBottom: '3', textAlign: 'center', paddingTop: '2' },
                ]}
              >
                Resolution #{index + 1}
              </Text>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Transaction Hash:</Text>

                <Text style={styles.detailRow}>{resolution.txHash}</Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>IPFS Hash:</Text>

                <Text style={styles.detailRow}>{resolution.ipfsHash}</Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Client Award:</Text>

                <Text style={styles.detailRow}>
                  {formatEther(resolution.clientAward)} {symbol}
                </Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Provider Award:</Text>

                <Text style={styles.detailRow}>
                  {formatEther(resolution.providerAward)} {symbol}
                </Text>
              </View>

              {resolution.resolutionFee ? (
                <View style={styles.detailPair}>
                  <Text style={styles.invisibleRow}>Resolution Fee:</Text>

                  <Text style={styles.detailRow}>
                    {formatEther(resolution.resolutionFee)} {symbol}
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Resolver Type:</Text>

                <Text style={styles.detailRow}>{resolution.resolverType}</Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Resolver:</Text>

                <Text style={styles.detailRow}>{resolution.resolver}</Text>
              </View>
            </View>
          ))}
        </Page>
      ) : null}
    </Document>
  );
}

export default InvoicePDF;
