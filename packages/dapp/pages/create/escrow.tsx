import React, { useContext, useEffect, useRef, useState } from 'react';
import { useWalletClient } from 'wagmi';

/* eslint-disable no-nested-ternary */
import {
  Button,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { FormConfirmation } from '../../components/FormConfirmation';
import { NetworkChangeAlertModal } from '../../components/NetworkChangeAlertModal';
import { PaymentChunksForm } from '../../components/PaymentChunksForm';
import { PaymentDetailsForm } from '../../components/PaymentDetailsForm';
import { ProjectDetailsForm } from '../../components/ProjectDetailsForm';
import { RegisterSuccess } from '../../components/RegisterSuccess';
import { ESCROW_STEPS, INVOICE_TYPES } from '../../constants';
import {
  CreateContext,
  CreateContextProvider,
} from '../../context/CreateContext';
import { useFetchTokensViaIPFS } from '../../hooks/useFetchTokensViaIPFS';
import { Container } from '../../shared/Container';
import { StepInfo } from '../../shared/StepInfo';

type EscrowStepNumber = keyof typeof ESCROW_STEPS;

export function CreateInvoiceEscrowInner() {
  const {
    txHash,
    loading,
    currentStep,
    nextStepEnabled,
    goBackHandler,
    nextStepHandler,
    invoiceType,
    setInvoiceType,
  } = useContext(CreateContext);
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();
  const prevChainIdRef = useRef<number>();

  const [showChainChangeAlert, setShowChainChangeAlert] = useState(false);

  const { Escrow } = INVOICE_TYPES;
  useEffect(() => {
    setInvoiceType(Escrow);
  }, [invoiceType, setInvoiceType, Escrow]);

  useEffect(() => {
    if (chainId === undefined) return;
    if (prevChainIdRef.current !== undefined && prevChainIdRef.current !== chainId) {
      setShowChainChangeAlert(true);
    }
    prevChainIdRef.current = chainId;
  }, [chainId]);

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const stackWidth = useBreakpointValue({
    base: '95%',
    sm: '95%',
    md: '85%',
    lg: '75%',
  });

  const headingSize = useBreakpointValue({
    base: '90%',
    sm: '125%',
    md: '150%',
    lg: '225%',
  });

  return (
    <Container overlay>
      {txHash ? (
        <RegisterSuccess />
      ) : tokenData ? (
        <Stack
          direction={{ base: 'column', lg: 'column' }}
          spacing="2rem"
          align="center"
          justify="center"
          w={stackWidth}
          px="1rem"
          my="2rem"
          maxW="650px"
        >
          <NetworkChangeAlertModal
            showChainChangeAlert={showChainChangeAlert}
            setShowChainChangeAlert={setShowChainChangeAlert}
            chain={chainId}
          />

          <VStack
            spacing={{ base: '1.5rem', lg: '1rem' }}
            w={{ base: '100%', md: 'auto' }}
          >
            <Heading fontWeight="700" fontSize={headingSize}>
              Create an Escrow Invoice
            </Heading>

            <Text
              color="#90A0B7"
              as="i"
              width="100%"
              style={{ textIndent: 20 }}
              align="center"
            >
              Note: All invoice data will be stored publicly on IPFS and can be
              viewed by anyone. If you have privacy concerns, we recommend
              taking care to add permissions to your project agreement document.
            </Text>

            <Flex
              bg="background"
              direction="column"
              justify="space-between"
              p="1rem"
              borderRadius="0.5rem"
              w="100%"
            >
              <StepInfo
                stepNum={currentStep}
                stepTitle={
                  ESCROW_STEPS[currentStep as EscrowStepNumber].step_title
                }
                stepDetails={
                  ESCROW_STEPS[currentStep as EscrowStepNumber].step_details
                }
                goBack={goBackHandler}
              />

              <ProjectDetailsForm
                display={currentStep === 1 ? 'flex' : 'none'}
                tokenData={tokenData}
                allTokens={allTokens}
              />

              <PaymentDetailsForm
                display={currentStep === 2 ? 'flex' : 'none'}
                tokenData={tokenData}
                allTokens={allTokens}
              />

              <PaymentChunksForm
                display={currentStep === 3 ? 'flex' : 'none'}
                tokenData={tokenData}
                allTokens={allTokens}
              />

              <FormConfirmation
                display={currentStep === 4 ? 'flex' : 'none'}
                tokenData={tokenData}
                allTokens={allTokens}
              />

              <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
                <Button
                  _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  color="white"
                  backgroundColor="blue.1"
                  onClick={nextStepHandler}
                  isLoading={loading}
                  isDisabled={!nextStepEnabled}
                  textTransform="uppercase"
                  size={buttonSize}
                  fontFamily="mono"
                  fontWeight="bold"
                >
                  {currentStep === 4
                    ? ESCROW_STEPS[currentStep].next
                    : `next: ${
                        ESCROW_STEPS[currentStep as EscrowStepNumber].next
                      }`}
                </Button>
              </Grid>
            </Flex>
          </VStack>
        </Stack>
      ) : (
        <Text>Loading</Text>
      )}
    </Container>
  );
}

function CreateInvoiceEscrow() {
  return (
    <CreateContextProvider>
      <CreateInvoiceEscrowInner />
    </CreateContextProvider>
  );
}

export default CreateInvoiceEscrow;
