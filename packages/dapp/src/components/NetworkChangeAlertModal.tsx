import React from 'react';

import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay
} from '@chakra-ui/react';

import { getNetworkName } from '../utils/helpers';

export function NetworkChangeAlertModal({
  showChainChangeAlert,
  setShowChainChangeAlert,
  chainId
}: any) {
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
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            You are changing the network to <b>{getNetworkName(chainId)}</b>.
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          </div>
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          <hr style={{ borderTop: '1px solid red', margin: '10px 0' }} />
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          <div>
            You must complete all invoice creation steps on the same chain.
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <br />
            If you have not yet input any information, you can continue.
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <br />
            Otherwise, please return to Step 1 and complete all steps on the
            same network.
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          </div>
        </ModalBody>
        
        <ModalCloseButton color="gray.400" />
      </ModalContent>
    </Modal>
  );
}
