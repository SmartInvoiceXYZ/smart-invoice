import React from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Container,
  VStack,
} from '@chakra-ui/react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
} from '@react-pdf/renderer';

import InvoicePDF from './InvoicePDF';

// https://kags.me.ke/post/generate-dynamic-pdf-incoice-using-react-pdf/
//  https://github.com/kagundajm/react-pdf-tables

export const GenerateInvoicePDF = ({ invoice, symbol }) => {
  // const {
  //   projectName,
  //   projectDescription,
  //   projectAgreement,
  //   startDate,
  //   endDate,
  //   terminationTime,
  //   client,
  //   provider,
  //   resolver,
  //   currentMilestone,
  //   amounts,
  //   total,
  //   token,
  //   released,
  //   isLocked,
  //   deposits,
  //   releases,
  //   disputes,
  //   resolutions,
  //   verified,
  // } = invoice;

  // console.log('Invoice:', invoice);

  function InvoicePreviewModal() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
      <>
        <Button onClick={onOpen}>Preview & Download Invoice PDF Summary</Button>

        <Modal
          id="invoicePreviewModal"
          onClose={onClose}
          isOpen={isOpen}
          size="3xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>HEADER</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <PDFViewer
                width="100%"
                height="900"
                display="table"
                margin="0 auto"
                className="app"
              >
                <InvoicePDF height="100%" invoice={invoice} symbol={symbol} />
              </PDFViewer>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <Container>
      <VStack align="stretch" justify="center">
        <InvoicePreviewModal />
        {/* <PDFDownloadLink document={<InvoicePDF />} fileName="somename.pdf">download a pdf of this invoice</PDFDownloadLink> */}
      </VStack>
    </Container>
  );
};
