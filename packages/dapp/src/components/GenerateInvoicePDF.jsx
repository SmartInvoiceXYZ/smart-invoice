import React from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';

import { PDFViewer } from '@react-pdf/renderer';

import InvoicePDF from './InvoicePDF';

export const GenerateInvoicePDF = ({ invoice, symbol }) => {
  function InvoicePreviewModal() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
      <>
        <Button onClick={onOpen} variant="link">
          Preview & Download Invoice PDF
        </Button>

        <Modal
          id="invoicePreviewModal"
          onClose={onClose}
          isOpen={isOpen}
          size="5xl"
        >
          <ModalOverlay />
          <ModalContent height="90vh" width="100vw">
            <ModalHeader style={{ color: 'black' }}>
              Smart Invoice {invoice.address}
            </ModalHeader>
            <ModalCloseButton style={{ color: 'black' }} />
            <ModalBody height="90vh">
              <PDFViewer
                display="table"
                margin="0 auto"
                className="app"
                style={{
                  width: '100%',
                  height: '95%',
                }}
              >
                <InvoicePDF invoice={invoice} symbol={symbol} />
              </PDFViewer>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <VStack align="stretch">
      <InvoicePreviewModal />
    </VStack>
  );
};
