import React, { Fragment } from 'react';
import {
  Page,
  Document,
  Image,
  StyleSheet,
  View,
  Text,
} from '@react-pdf/renderer';

import { utils } from 'ethers';

const borderColor = 'black';

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
  titleContainer: {
    flexDirection: 'row',
    marginTop: 24,
    textAlign: 'center',
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
    color: 'black',
    fontWeight: 'ultrabold',
    letterSpacing: 4,
    fontSize: 10,
    textAlign: 'left',
    textTransform: 'uppercase',
  },
  text: {
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
  separatorThree: {
    borderBottomColor: 'black',
    borderBottomWidth: '5',
    marginTop: 10,
  },
  separatorFour: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FF3864',
  },

  logo: {
    width: 74,
    height: 66,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  tableContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FF3864',
  },
  container: {
    flexDirection: 'row',
    borderBottomColor: '#FF3864',
    backgroundColor: '#FF3864',
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
  qty: {
    width: '10%',
    borderRightColor: borderColor,
    borderRightWidth: 1,
  },
  rate: {
    width: '15%',
    borderRightColor: borderColor,
    borderRightWidth: 1,
  },
  description: {
    width: '50%',
    textAlign: 'left',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    paddingLeft: 8,
  },
  amount: {
    width: '15%',
    textAlign: 'left',
    paddingLeft: 10,
  },
  disputeDescription: {
    width: '20%',
    textAlign: 'left',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    paddingLeft: 8,
  },
  qty: {
    width: '10%',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: 'right',
    paddingRight: 8,
  },
  rate: {
    width: '15%',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: 'right',
    paddingRight: 8,
  },
  disputeTitle: {
    color: 'black',
    letterSpacing: 4,
    fontSize: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: '15',
  },

  multiDetailBlock: {
    borderColor: '#FF3864',
    border: '3',
    marginTop: '10',
  },
  disputeRowOne: {
    display: 'flex',
    flexDirection: 'row',
    textAlign: 'center',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    fontStyle: 'bold',
  },
  arbitrator: {
    textAlign: 'center',
    fontStyle: 'bold',
    borderTop: '2',
    borderBottom: '1',
  },

  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

// font register for Rubik One
const InvoicePDF = ({ invoice, symbol }) => {
  const {
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    terminationTime,
    client,
    provider,
    resolver,
    currentMilestone,
    amounts,
    network,
    createdAt,
    total,
    token,
    released,
    isLocked,
    deposits,
    releases,
    disputes,
    resolutions,
    verified,
  } = invoice;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {console.log('invoice in PDF:', invoice)}
        <View>
          <View>
            <Text style={styles.title}>Smart Invoice</Text>
          </View>
          <View>
            <Text style={styles.address}>{invoice.address}</Text>
          </View>
        </View>
        <View style={styles.separator}></View>

        <View style={styles.detailsContainer}>
          <Text style={styles.details}>
            Client: <Text style={styles.text}>{client}</Text>
          </Text>
          <Text style={styles.details}>
            Provider:<Text style={styles.text}>{provider}</Text>
          </Text>
          <Text style={styles.details}>
            Network:<Text style={styles.text}>{network}</Text>
          </Text>
          <Text style={styles.details}>
            Token:<Text style={styles.text}>{symbol}</Text>
          </Text>
          <Text style={styles.details}>
            Created at block:<Text style={styles.text}>{createdAt}</Text>
          </Text>
          <Text style={styles.details}>
            Termination Time:<Text style={styles.text}>{terminationTime}</Text>
          </Text>
        </View>
        <View style={styles.separatorTwo}></View>
        <View style={styles.detailsContainer}>
          <Text style={styles.details}>
            Project Name:<Text style={styles.text}>{projectName}</Text>
          </Text>
          <Text style={styles.details}>
            Description:<Text style={styles.text}>{projectDescription}</Text>
          </Text>
          <Text style={styles.details}>
            Agreement:<Text style={styles.text}>{projectAgreement}</Text>
          </Text>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.container}>
            <Text style={styles.description}>Payment Milestones</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
        </View>
        {amounts.map((amount, index) => {
          return (
            <View style={styles.row} key={amount}>
              <Text style={styles.description}>
                Payment Milestone # {index + 1}
              </Text>
              <Text style={styles.amount}>{utils.formatEther(amount)}</Text>
            </View>
          );
        })}

        <View style={styles.tableContainer}>
          <View style={styles.container}>
            <Text style={styles.description}>Deposits</Text>
            <Text style={styles.qty}>Sender</Text>
            <Text style={styles.rate}>Amount</Text>
            <Text style={styles.amount}>Timestamp</Text>
          </View>
        </View>

        {console.log('Deposits', deposits)}
        {deposits?.map((deposit, index) => {
          return (
            <Fragment>
              <View style={styles.row} key={index}>
                {console.log('Deposits= only', deposit, index)}
                {/* <Text style={styles.description}>{deposit.sender}</Text> */}
                {/* <Text style={styles.amount}>{deposit.amount}</Text> */}
                {/* <Text style={styles.amount}>{deposit.timestamp}</Text> */}
              </View>
            </Fragment>
          );
        })}

        <View style={styles.tableContainer}>
          <View style={styles.container}>
            <Text style={styles.description}>Releases</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
        </View>
        {/* {deposits.map(item => {
                    return(
                    <View style={styles.row} key={item.sno.toString()}>
                        <Text style={styles.description}>{item.desc}</Text>
                        <Text style={styles.amount}>{(item.qty * item.rate).toFixed(2)}</Text>
                    </View>)})} */}

        <View style={styles.separatorThree}></View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.disputeTitle}>Disputes</Text>
        </View>

        {[
          {
            invoice: 'need abbreviation',
            sender: 'sender',
            details: 'details',
            ipfsHash: 'ipfsHash',
            disputeToken: 'disputeToken',
            disputeFee: 'ad sunt culpa occaecat qui',
            disputeID: 'disputeID',
            timestamp: 'timestamp',
          },
        ].map(item => {
          return (
            <View style={styles.multiDetailBlock} key={item.invoice}>
              <View style={styles.disputeRowOne}>
                <Text style={{ width: '50%' }}>Arbitrator:</Text>
                <Text style={{ width: '50%' }}>{item.disputeID}</Text>
              </View>

              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Details:</Text>
                <Text style={styles.description}>{item.details}</Text>
              </View>

              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Ipfs Hash: </Text>
                <Text style={styles.description}>{item.ipfsHash}</Text>
              </View>
              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>TxHash:</Text>
                <Text style={styles.description}>{item.details}</Text>
              </View>

              <View style={styles.arbitrator}>
                <Text>ARBITRATOR DATA</Text>
              </View>
              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Dispute ID:</Text>
                <Text style={styles.description}>{item.disputeID}</Text>
              </View>
              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Dispute Fee:</Text>
                <Text style={styles.description}>{item.disputeFee}</Text>
              </View>
              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Dispute Token:</Text>
                <Text style={styles.description}>{item.disputeToken}</Text>
              </View>
            </View>
          );
        })}
      </Page>

      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.disputeTitle}>Resolutions</Text>
        </View>

        {[
          {
            invoice: 'need abbreviation',
            txHash: 'txHash',
            details: 'details',
            resolverType: 'resolverType',
            resolver: 'resolver',
            clientAward: 'clientAward',
            providerAward: 'providerAward',
            resolutionDetails: 'resolutionDetails',
            resolutionFee: 'resolutionFee',
            ruling: 'ruling',
            timestamp: 'timestamp',
            ruling: 'ruling',
          },
        ].map(item => {
          return (
            <View style={styles.multiDetailBlock} key={item.invoice}>
              <View style={styles.disputeRowOne}>
                <Text style={{ width: '50%' }}>{item.invoice}:</Text>
                <Text style={{ width: '50%' }}>{item.txHash}</Text>
              </View>

              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Resolver:</Text>
                <Text style={styles.description}>{item.details}</Text>
              </View>

              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Resolver Type: </Text>
                <Text style={styles.description}>{item.ipfsHash}</Text>
              </View>
              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Client Award:</Text>
                <Text style={styles.description}>{item.details}</Text>
              </View>

              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Provider Award: </Text>
                <Text style={styles.description}>{item.ipfsHash}</Text>
              </View>
              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Details:</Text>
                <Text style={styles.description}>{item.details}</Text>
              </View>

              <View style={styles.arbitrator}>
                <Text>ARBITRATOR DATA</Text>
              </View>
              <View style={styles.row} key={item.invoice.toString()}>
                <Text style={styles.description}>Ruling:</Text>
                <Text style={styles.description}>{item.ruling}</Text>
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

export default InvoicePDF;
