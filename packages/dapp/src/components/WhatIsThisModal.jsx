import {
  Button,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  VStack,
  Heading,
  Text,
  Link,
  useBreakpointValue,
} from '@chakra-ui/react';
import React from 'react';

export const WhatIsThisModal = ({ isOpen, onClose }) => {
  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay>
        <ModalContent
          p="2rem"
          maxW="40rem"
          background="black"
          borderRadius="0"
          borderWidth="2px"
          borderColor="red.500"
          color="white"
        >
          <ModalCloseButton
            color="red.500"
            size="lg"
            _hover={{ bgColor: 'white20' }}
            top="0"
            right="0"
          />
          <VStack w="100%" spacing="1rem">
            <Heading
              fontWeight="normal"
              mb="1rem"
              textTransform="uppercase"
              textAlign="center"
            >
              Safe, Efficient Payment
            </Heading>
            <Text>
              Smart invoice builds trust between payer and payee by creating a
              secure neutral channel for transferring money. The payer proves
              their committment by locking money in the contract, and controls
              when it is released to the payee. No middle party, no leap of
              faith, and you don’t even have to use the word escrow if you don’t
              want to.
            </Text>

            <Text w="100%">
              If you have more questions,{' '}
              <Link href="/faq" textDecor="underline" isExternal>
                check out our FAQ.
              </Link>
            </Text>

            <Text w="100%" mb="1rem">
              You can read more about the future of payment at{' '}
              <Link
                href="https://discord.gg/CanD2WcK7W"
                textDecor="underline"
                isExternal
              >
                Raid Guild
              </Link>
              .
            </Text>
            <Button
              colorScheme="red"
              onClick={onClose}
              size={buttonSize}
              fontFamily="mono"
              fontWeight="normal"
            >
              Got it. Thanks
            </Button>
          </VStack>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};
