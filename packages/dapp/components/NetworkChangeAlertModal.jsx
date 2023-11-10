import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import React from 'react';

import { getNetworkName } from '../utils/helpers';

export function NetworkChangeAlertModal({
  showChainChangeAlert,
  setShowChainChangeAlert,
  chainId,
}) {
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
            You are changing the network to <b>{getNetworkName(chainId)}</b>.
          </div>
          <hr style={{ borderTop: '1px solid red', margin: '10px 0' }} />
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
