import {
  Divider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { getNetworkName } from '@smart-invoice/utils';
import React from 'react';

type NetworkChangeAlertModalProps = {
  showChainChangeAlert: boolean;
  // eslint-disable-next-line no-unused-vars
  setShowChainChangeAlert: (value: boolean) => void;
  chainId?: number;
};

export function NetworkChangeAlertModal({
  showChainChangeAlert,
  setShowChainChangeAlert,
  chainId,
}: NetworkChangeAlertModalProps) {
  return (
    <Modal
      isOpen={showChainChangeAlert}
      onClose={() => setShowChainChangeAlert(false)}
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader style={{ textAlign: 'center', color: 'red' }}>
          Attention
        </ModalHeader>

        <ModalBody
          style={{
            backgroundColor: '#ffebee',
            borderRadius: '5px',
            color: 'red',
            margin: '5px',
          }}
        >
          <div>
            You are changing the network to{' '}
            <b>{chainId ? getNetworkName(chainId) : '-'}</b>.
          </div>
          <Divider style={{ borderTop: '1px solid red', margin: '10px 0' }} />
          <div>
            You must complete all invoice creation steps on the same chain.
            <br />
            If you have not yet input any information, you can continue.
            <br />
            Otherwise, please return to Step 1 and complete all steps on the
            same network.
          </div>
        </ModalBody>

        <ModalCloseButton color="gray.400" />
      </ModalContent>
    </Modal>
  );
}
