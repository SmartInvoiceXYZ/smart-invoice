import React from 'react';

import {
  Button,
  ButtonProps,
  MenuItem,
  MenuItemProps,
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
import { Invoice } from '@smart-invoice/graphql';

import InvoicePDF from './InvoicePDF';

interface GenerateInvoicePDFProps {
  invoice: Invoice;
  symbol: string;
  buttonText: string;
  buttonProps?: ButtonProps;
}

export function GenerateInvoicePDF({
  invoice,
  symbol,
  buttonText,
  buttonProps,
}: GenerateInvoicePDFProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { address } = invoice || {};

  return (
    <VStack align="stretch">
      <Button onClick={onOpen} variant="link" {...buttonProps}>
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
            Smart Invoice {address}
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

interface GenerateInvoicePDFMenuItemProps extends MenuItemProps {
  invoice: Invoice;
  symbol: string;
  text: string;
}

export function GenerateInvoicePDFMenuItem({
  invoice,
  symbol,
  text,
  ...props
}: GenerateInvoicePDFMenuItemProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { address } = invoice || {};

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
            Smart Invoice {address}
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
