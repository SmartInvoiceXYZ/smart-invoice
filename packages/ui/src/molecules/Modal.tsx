import {
  Modal as ChakraModal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <ChakraModal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay>
        <ModalContent
          p="2rem"
          maxW="40rem"
          background="background"
          borderRadius="0.5rem"
        >
          <ModalCloseButton
            _hover={{ bgColor: 'white20' }}
            top="0.5rem"
            right="0.5rem"
            color="gray"
          />

          {children}
        </ModalContent>
      </ModalOverlay>
    </ChakraModal>
  );
}
