import {
  Divider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { Modals } from '@smart-invoice/types';
import { chainsMap } from '@smart-invoice/utils';

type NetworkChangeAlertModalProps = {
  modals: { networkChange: boolean };
  setModals: (modals: Partial<Modals>) => void;
  chainId?: number;
};

export function NetworkChangeAlertModal({
  modals,
  setModals,
  chainId,
}: NetworkChangeAlertModalProps) {
  return (
    <Modal isOpen={modals.networkChange} onClose={() => setModals({})}>
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
            <b>{chainId ? chainsMap(chainId)?.name : '-'}</b>.
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
