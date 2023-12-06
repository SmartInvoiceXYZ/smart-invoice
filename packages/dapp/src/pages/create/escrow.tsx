// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React, { useContext, useEffect, useRef, useState } from 'react';

/* eslint-disable no-nested-ternary */
import {
  Button,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  VStack,
  useBreakpointValue
} from '@chakra-ui/react';

// @ts-expect-error TS(6142): Module '../../components/FormConfirmation' was res... Remove this comment to see the full error message
import { FormConfirmation } from '../../components/FormConfirmation';
// @ts-expect-error TS(6142): Module '../../components/NetworkChangeAlertModal' ... Remove this comment to see the full error message
import { NetworkChangeAlertModal } from '../../components/NetworkChangeAlertModal';
// @ts-expect-error TS(6142): Module '../../components/PaymentChunksForm' was re... Remove this comment to see the full error message
import { PaymentChunksForm } from '../../components/PaymentChunksForm';
// @ts-expect-error TS(6142): Module '../../components/PaymentDetailsForm' was r... Remove this comment to see the full error message
import { PaymentDetailsForm } from '../../components/PaymentDetailsForm';
// @ts-expect-error TS(6142): Module '../../components/ProjectDetailsForm' was r... Remove this comment to see the full error message
import { ProjectDetailsForm } from '../../components/ProjectDetailsForm';
// @ts-expect-error TS(6142): Module '../../components/RegisterSuccess' was reso... Remove this comment to see the full error message
import { RegisterSuccess } from '../../components/RegisterSuccess';
// @ts-expect-error TS(2792): Cannot find module '../../constants'. Did you mean... Remove this comment to see the full error message
import { ESCROW_STEPS, INVOICE_TYPES } from '../../constants';
import {
  CreateContext,
  CreateContextProvider
} from '../../context/CreateContext';
// @ts-expect-error TS(6142): Module '../../context/Web3Context' was resolved to... Remove this comment to see the full error message
import { Web3Context } from '../../context/Web3Context';
import { useFetchTokensViaIPFS } from '../../hooks/useFetchTokensViaIPFS';
// @ts-expect-error TS(6142): Module '../../shared/Container' was resolved to '/... Remove this comment to see the full error message
import { Container } from '../../shared/Container';
// @ts-expect-error TS(6142): Module '../../shared/StepInfo' was resolved to '/U... Remove this comment to see the full error message
import { StepInfo } from '../../shared/StepInfo';

function CreateInvoiceEscrow() {
  return (
    
    <CreateContextProvider>
      
      <CreateInvoiceEscrowInner />
    </CreateContextProvider>
  );
}

export function CreateInvoiceEscrowInner() {
  const {
    tx,
    loading,
    currentStep,
    nextStepEnabled,
    goBackHandler,
    nextStepHandler,
    invoiceType,
    setInvoiceType,
  } = useContext(CreateContext);
  const { chainId } = useContext(Web3Context);
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();
  const prevChainIdRef = useRef(null);

  const [showChainChangeAlert, setShowChainChangeAlert] = useState(false);

  const { Escrow } = INVOICE_TYPES;
  useEffect(() => {
    setInvoiceType(Escrow);
  }, [invoiceType, setInvoiceType, Escrow]);

  useEffect(() => {
    if (prevChainIdRef.current !== null && prevChainIdRef.current !== chainId) {
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
      {tx ? (
        
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
            chainId={chainId}
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
                stepTitle={ESCROW_STEPS[currentStep].step_title}
                stepDetails={ESCROW_STEPS[currentStep].step_details}
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
                    : `next: ${ESCROW_STEPS[currentStep].next}`}
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

export default CreateInvoiceEscrow;
