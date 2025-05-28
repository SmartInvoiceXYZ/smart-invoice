import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import {
  chainLabelFromId,
  getAccountString,
  getChainName,
  unixToDateTime,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { Fragment } from 'react';
import { formatUnits } from 'viem';

const borderColor = 'black';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
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
  },
  detailsContainer: {
    marginTop: 15,
  },
  details: {
    fontFamily: 'Helvetica-Bold',
    color: 'black',
    fontWeight: 'ultrabold',
    letterSpacing: 1,
    fontSize: 10,
    textAlign: 'left',
  },
  text: {
    fontFamily: 'Helvetica',
    color: 'black',
    letterSpacing: 2,
    fontSize: 10,
    textAlign: 'left',
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
    fontWeight: 'bold',
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
});

export type InvoicePDFProps = {
  invoice: InvoiceDetails;
};

// font register for Rubik One
export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const {
    address,
    metadata,
    terminationTime,
    client,
    provider,
    amounts,
    chainId,
    createdAt,
    deposits,
    releases,
    disputes,
    resolutions,
    tokenMetadata,
  } = _.pick(invoice, [
    'address',
    'metadata',
    'terminationTime',
    'client',
    'provider',
    'amounts',
    'createdAt',
    'deposits',
    'releases',
    'disputes',
    'resolutions',
    'tokenMetadata',
    'chainId',
  ]);

  const { title, description, documents, startDate, endDate } = _.pick(
    metadata,
    ['title', 'description', 'documents', 'startDate', 'endDate'],
  );

  const chainLabel = chainId ? chainLabelFromId(chainId) : 'unknown';

  const url = `https://app.smartinvoice.xyz/invoice/${chainLabel}/${address}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* General Details */}

        <View>
          <Text style={styles.title}>Smart Invoice</Text>

          <View>
            <Text style={styles.address}>{address}</Text>

            <Link href={url} src={url}>
              <Text style={{ textAlign: 'center' }}>
                {getAccountString(address)} @ app.smartinvoice.xyz
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
            Network:{' '}
            <Text style={styles.text}>
              {getChainName(chainId)} ({chainId})
            </Text>
          </Text>

          <Text style={styles.details}>
            Token:{' '}
            <Text style={styles.text}>
              {tokenMetadata?.address} ({tokenMetadata?.symbol})
            </Text>
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

        <View style={styles.detailsContainer}>
          <Text style={styles.details}>
            Title: <Text style={styles.text}>{title}</Text>
          </Text>

          <Text style={styles.details}>
            Description: <Text style={styles.text}>{description}</Text>
          </Text>
          {documents && documents.length > 0 && (
            <>
              <Text style={styles.details}>Document(s):</Text>
              {documents.map((document, index) => (
                <View key={document.id}>
                  <Text style={[styles.text]}>Agreement #{index + 1}:</Text>

                  <Text style={[styles.text, { textIndent: 20 }]}>
                    Created At: {unixToDateTime(Number(document.createdAt))}
                  </Text>

                  <Text style={[styles.text, { textIndent: 20 }]}>
                    Agreement Source: {document.src}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Payment Milestones */}
        {amounts && (
          <>
            <View style={styles.tableContainer}>
              <View style={styles.container}>
                <Text style={styles.description}>Payment Milestones</Text>

                <Text style={styles.amount}>Amount</Text>
              </View>
            </View>
            {amounts.map((amount, index) => {
              let amountTotal = BigInt(0);
              if (index + 1 === amounts.length) {
                const sum = amounts.reduce(
                  (a, b) => BigInt(a) + BigInt(b),
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
                      {formatUnits(
                        BigInt(amount),
                        tokenMetadata?.decimals ?? 18,
                      )}{' '}
                      {tokenMetadata?.symbol}
                    </Text>
                  </View>
                  {amountTotal > 0 ? (
                    <View style={styles.row}>
                      <Text style={styles.totalDescription}>TOTAL</Text>
                      <Text style={styles.amount}>
                        {formatUnits(
                          amountTotal,
                          tokenMetadata?.decimals ?? 18,
                        )}{' '}
                        {tokenMetadata?.symbol}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        )}

        {/* Deposits */}
        {!_.isEmpty(deposits) && (
          <>
            <View style={styles.tableContainer}>
              <View style={styles.container}>
                <Text style={styles.listTitle}>Deposits</Text>
              </View>
            </View>

            {_.map(_.reverse([...(deposits ?? [])]), (deposit, index) => (
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
                      Amount:{' '}
                      <Text>
                        {formatUnits(
                          deposit.amount,
                          tokenMetadata?.decimals ?? 18,
                        )}
                      </Text>
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
        {!_.isEmpty(releases) && (
          <>
            <View style={styles.tableContainer}>
              <View style={styles.container}>
                <Text style={styles.listTitle}>Releases</Text>
              </View>
            </View>

            {_.map(_.reverse([...(releases ?? [])]), (release, index) => (
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
                        {formatUnits(
                          release.amount,
                          tokenMetadata?.decimals ?? 18,
                        )}{' '}
                        {tokenMetadata?.symbol}
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
      {!_.isEmpty(disputes) ? (
        <Page size="A4" style={styles.page}>
          <View>
            <Text style={styles.secondTitle}>Disputes</Text>
          </View>

          {_.map(disputes, (dispute, index) => (
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
      {!_.isEmpty(resolutions) ? (
        <Page size="A4" style={styles.page}>
          <View>
            <Text style={styles.secondTitle}>Resolutions</Text>
          </View>

          {_.map(resolutions, (resolution, index) => (
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
                  {formatUnits(
                    resolution.clientAward,
                    tokenMetadata?.decimals ?? 18,
                  )}{' '}
                  {tokenMetadata?.symbol}
                </Text>
              </View>

              <View style={styles.detailPair}>
                <Text style={styles.invisibleRow}>Provider Award:</Text>

                <Text style={styles.detailRow}>
                  {formatUnits(
                    resolution.providerAward,
                    tokenMetadata?.decimals ?? 18,
                  )}{' '}
                  {tokenMetadata?.symbol}
                </Text>
              </View>

              {resolution.resolutionFee ? (
                <View style={styles.detailPair}>
                  <Text style={styles.invisibleRow}>Resolution Fee:</Text>

                  <Text style={styles.detailRow}>
                    {formatUnits(
                      resolution.resolutionFee,
                      tokenMetadata?.decimals ?? 18,
                    )}{' '}
                    {tokenMetadata?.symbol}
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
