import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import {
  chainLabelFromId,
  getChainName,
  unixToDateTime,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import QRCode from 'qrcode';
import { memo, useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
  title: {
    color: 'black',
    letterSpacing: 2,
    fontSize: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  addressContainer: {
    color: 'black',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  address: {
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 14,
    marginTop: 20,
    marginBottom: 10,
    textDecoration: 'underline',
    textTransform: 'uppercase',
  },
  details: {
    fontSize: 10,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    fontSize: 10,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    marginTop: 10,
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
    fontSize: 10,
    paddingVertical: 4,
    paddingLeft: 4,
  },
  tableLastRow: {
    borderTopColor: 'black',
    borderTopWidth: 1,
    fontWeight: 'bold',
  },
  tableCol0: {
    width: '15%',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '20%',
  },
  tableCol3: {
    width: '15%',
  },
  qrCodeContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  header: {
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 9,
  },
});

export type InvoicePDFProps = {
  invoice: InvoiceDetails;
};

const formatAmount = (amount: bigint, decimals: number) => {
  const formatted = Number.parseFloat(formatUnits(amount, decimals));

  if (formatted.toString().includes('.')) {
    return formatted;
  }
  return formatted.toFixed(2);
};

const { BASE_URL } = process.env;

export const InvoicePDF = memo(InvoicePDFInner);

function InvoicePDFInner({ invoice }: InvoicePDFProps) {
  const {
    address,
    metadata,
    terminationTime,
    client,
    provider,
    amounts,
    chainId,
    createdAt,
    tokenMetadata,
    releasedTxs,
    depositedTxs,
  } = _.pick(invoice, [
    'address',
    'metadata',
    'terminationTime',
    'client',
    'provider',
    'amounts',
    'createdAt',
    'tokenMetadata',
    'chainId',
    'releasedTxs',
    'depositedTxs',
  ]);

  const { startDate, endDate, title, description, documents } = _.pick(
    metadata,
    ['startDate', 'endDate', 'title', 'description', 'documents'],
  );
  const lastDocument = _.findLast(documents);

  const url = useMemo(() => {
    const chainLabel = chainId ? chainLabelFromId(chainId) : 'unknown';
    return `${BASE_URL}/invoice/${chainLabel}/${address}`;
  }, [chainId, address]);

  const totalAmount = amounts
    ? amounts.reduce((acc, amt) => acc + BigInt(amt), BigInt(0))
    : BigInt(0);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    async function getQrCode() {
      const dataURL = await QRCode.toDataURL(url);
      setQrCodeUrl(dataURL);
    }
    getQrCode();
  }, [url]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            src={`${BASE_URL}/assets/smart-invoice/normal.png`}
            style={{ height: 34.84, width: 220 }}
          />
        </View>

        {/* Invoice Details */}
        <Text style={styles.sectionHeader}>Invoice Details</Text>
        <Text style={styles.details}>Address: {address}</Text>
        <Text style={styles.details}>
          Network: {getChainName(chainId)} ({chainId})
        </Text>
        <Text style={styles.details}>
          URL:{' '}
          <Link style={{ color: 'blue' }} href={url}>
            {url}
          </Link>
        </Text>
        <Text style={styles.details}>
          Date Issued: {unixToDateTime(Number(createdAt))}
        </Text>

        {/* Client Details */}
        <Text style={styles.sectionHeader}>Client Details</Text>
        <Text style={styles.details}>Wallet Address: {client}</Text>

        {/* Provider Details */}
        <Text style={styles.sectionHeader}>Provider Details</Text>
        <Text style={styles.details}>Wallet Address: {provider}</Text>

        {/* Token Used */}
        <Text style={styles.sectionHeader}>Token Used</Text>
        <Text style={styles.details}>
          Token Contract: {tokenMetadata?.address}
        </Text>
        <Text style={styles.details}>Symbol: {tokenMetadata?.symbol}</Text>

        {/* Project Details */}
        <Text style={styles.sectionHeader}>Project Details</Text>
        <Text style={styles.details}>Title: {title}</Text>
        <Text style={styles.details}>Description: {description}</Text>
        {startDate && startDate > 0 && (
          <Text style={styles.details}>
            Project Start Date: {unixToDateTime(Number(startDate))}
          </Text>
        )}
        {endDate && endDate > 0 && (
          <Text style={styles.details}>
            Expected End Date: {unixToDateTime(Number(endDate))}
          </Text>
        )}
        <Text style={styles.details}>
          Termination Date: {unixToDateTime(Number(terminationTime))}
        </Text>
        {!!lastDocument && (
          <Text style={styles.details}>Document: {lastDocument.src}</Text>
        )}

        {/* Payment Terms */}
        <Text style={styles.sectionHeader}>Payment Terms</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableCol0}>Milestone</Text>
          <Text style={styles.tableCol1}>Description</Text>
          <Text style={styles.tableCol2}>Amount ({tokenMetadata?.symbol})</Text>
          <Text style={styles.tableCol3}>Status</Text>
        </View>
        {amounts &&
          amounts.map((amount, index) => {
            const release = releasedTxs?.[index];
            const deposit = depositedTxs?.[index];
            let label = '-';
            if (deposit) {
              label = `Deposited`;
            }
            if (release) {
              label = `Released`;
            }

            return (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.tableCol0}>{index + 1}</Text>
                <Text style={styles.tableCol1}>
                  Payment Milestone #{index + 1}
                </Text>
                <Text style={styles.tableCol2}>
                  {formatAmount(BigInt(amount), tokenMetadata?.decimals ?? 18)}{' '}
                  {tokenMetadata?.symbol}{' '}
                </Text>
                <Text style={styles.tableCol3}>{label}</Text>
              </View>
            );
          })}
        <View style={[styles.tableRow, styles.tableLastRow]}>
          <Text style={styles.tableCol0} />
          <Text style={styles.tableCol1}>Total</Text>
          <Text style={styles.tableCol2}>
            {formatAmount(totalAmount, tokenMetadata?.decimals ?? 18)}{' '}
            {tokenMetadata?.symbol}
          </Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Smart Contract Verification</Text>
        <Text style={styles.details}>
          This invoice is permanently linked to a smart contract on the{' '}
          {getChainName(chainId)} network. All activity is transparent and
          verifiable on-chain.
        </Text>

        {qrCodeUrl && (
          <View style={styles.qrCodeContainer}>
            <Text style={{ fontSize: 10, marginBottom: 4 }}>
              Scan to view invoice & verify on-chain
            </Text>
            <Image src={qrCodeUrl} style={{ width: 80, height: 80 }} />
          </View>
        )}

        <Text style={styles.sectionHeader}>Legal Disclaimer</Text>
        <Text style={styles.disclaimer}>
          This document was generated by Smart Invoice. It reflects terms set by
          the Client and Provider. Smart Invoice is not responsible for the
          contents or outcomes of this agreement.
        </Text>
      </Page>
    </Document>
  );
}
