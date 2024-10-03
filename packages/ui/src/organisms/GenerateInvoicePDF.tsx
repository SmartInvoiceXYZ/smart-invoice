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
import { InvoiceDetails } from '@smartinvoicexyz/types';

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
  const { address } = invoice || {};

  return (
    <Stack align="stretch">
      <Button
        onClick={onOpen}
        variant="outline"
        size="xs"
        colorScheme="blue"
        fontWeight="normal"
        fontFamily="mono"
        textTransform="uppercase"
        {...buttonProps}
      >
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
              <InvoicePDF invoice={invoice} />
            </PDFViewer>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  );
}

interface GenerateInvoicePDFMenuItemProps extends MenuItemProps {
  invoice: Partial<InvoiceDetails>;
  text: string;
}

export function GenerateInvoicePDFMenuItem({
  invoice,
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
              <InvoicePDF invoice={invoice} />
            </PDFViewer>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
