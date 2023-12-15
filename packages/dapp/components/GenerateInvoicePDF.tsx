import React from 'react';

import {
  Button,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { PDFViewer } from '@react-pdf/renderer';

import InvoicePDF from './InvoicePDF';

export function GenerateInvoicePDF({
  invoice,
  symbol,
  buttonText,
  buttonTextColor,
}: any) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <VStack align="stretch">
      <Button onClick={onOpen} variant="link" color={buttonTextColor}>
        {buttonText}
      </Button>

      <Modal
        id="invoicePreviewModal"
        onClose={onClose}
        isOpen={isOpen}
        size="5xl"
      >
        <ModalOverlay />

        <ModalContent height="90vh" width="100vw" bg="white">
          <ModalHeader style={{ color: 'black' }}>
            Smart Invoice {invoice.address}
          </ModalHeader>

          <ModalCloseButton style={{ color: 'black' }} />

          <ModalBody height="90vh">
            <PDFViewer
              className="app"
              style={{
                margin: '0 auto',
                width: '100%',
                height: '95%',
              }}
            >
              <InvoicePDF invoice={invoice} symbol={symbol} />
            </PDFViewer>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

export function GenerateInvoicePDFMenuItem({
  invoice,
  symbol,
  text,
  ...props
}: any) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <VStack align="stretch">
      <MenuItem onClick={onOpen} {...props}>
        {text}
      </MenuItem>

      <Modal
        id="invoicePreviewModal"
        onClose={onClose}
        isOpen={isOpen}
        size="5xl"
      >
        <ModalOverlay />

        <ModalContent height="90vh" width="100vw" bg="white">
          <ModalHeader style={{ color: 'black' }}>
            Smart Invoice {invoice.address}
          </ModalHeader>

          <ModalCloseButton style={{ color: 'black' }} />

          <ModalBody height="90vh">
            <PDFViewer
              className="app"
              style={{
                margin: '0 auto',
                width: '100%',
                height: '95%',
              }}
            >
              <InvoicePDF invoice={invoice} symbol={symbol} />
            </PDFViewer>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
