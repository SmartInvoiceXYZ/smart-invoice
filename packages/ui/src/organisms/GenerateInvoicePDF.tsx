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
  Stack,
  useDisclosure,
} from '@chakra-ui/react';
import { PDFViewer } from '@react-pdf/renderer';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { useFetchTokens } from '@smartinvoicexyz/hooks';
import { IToken } from '@smartinvoicexyz/types';
import { chainByName } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import React from 'react';

import { InvoicePDF } from '../molecules';

interface GenerateInvoicePDFProps {
  invoice: Partial<InvoiceDetails>;
  buttonText: string;
  buttonProps?: ButtonProps;
}

export function GenerateInvoicePDF({
  invoice,
  buttonText,
  buttonProps,
}: GenerateInvoicePDFProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { address, network, token } = _.pick(invoice, [
    'address',
    'network',
    'token',
  ]);

  const invoiceChainId = chainByName(network)?.id;

  const { data: tokens } = useFetchTokens();
  const invoiceToken = _.filter(tokens, {
    address: token,
    chainId: invoiceChainId,
  })[0] as IToken;

  const symbol = invoiceToken?.symbol;
  return (
    <Stack align="stretch">
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
    </Stack>
  );
}

interface GenerateInvoicePDFMenuItemProps extends MenuItemProps {
  invoice: Partial<InvoiceDetails>;
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
    <Stack align="stretch">
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
    </Stack>
  );
}
