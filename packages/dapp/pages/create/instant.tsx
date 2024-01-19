import React, { useContext, useEffect, useRef, useState } from 'react';
import { useChainId, useWalletClient } from 'wagmi';

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

import {
  NetworkChangeAlertModal,
  RegisterSuccess,
  FormConfirmation,
  Container,
  StepInfo,
} from '@smart-invoice/ui';
// import {
//   InstantPaymentDetailsForm,
//   ProjectDetailsForm,
// } from '@smart-invoice/forms';
import { INSTANT_STEPS, INVOICE_TYPES } from '@smart-invoice/constants';
import { useFetchTokensViaIPFS } from '@smart-invoice/hooks';

type InstantStepNumber = keyof typeof INSTANT_STEPS;

export function CreateInvoiceInstant() {
  // const {
  //   txHash,
  //   loading,
  //   currentStep,
  //   nextStepEnabled,
  //   goBackHandler,
  //   nextStepHandler,
  //   invoiceType,
  //   setInvoiceType,
  // } = useContext(CreateContext);
  const { Instant } = INVOICE_TYPES;

  // useEffect(() => {
  //   setInvoiceType(Instant);
  // }, [invoiceType, setInvoiceType, Instant]);
  const chainId = useChainId();
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();
  const prevChainIdRef = useRef<number>();
  const [showChainChangeAlert, setShowChainChangeAlert] = useState(false);

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
    base: '125%',
    sm: '175%',
    md: '225%',
    lg: '250%',
  });

  return (
    <Container overlay>
      {true ? ( // txHash ? (
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
              Create an Instant Invoice
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
              {/* <StepInfo
                stepNum={currentStep}
                stepTitle={
                  INSTANT_STEPS[currentStep as InstantStepNumber].step_title
                }
                stepDetails={
                  INSTANT_STEPS[currentStep as InstantStepNumber].step_details
                }
                goBack={goBackHandler}
              />

              <ProjectDetailsForm
                display={currentStep === 1 ? 'flex' : 'none'}
                tokenData={tokenData}
                allTokens={allTokens}
              />

              <InstantPaymentDetailsForm
                display={currentStep === 2 ? 'flex' : 'none'}
                tokenData={tokenData}
                allTokens={allTokens}
              />

              <FormConfirmation
                display={currentStep === 3 ? 'flex' : 'none'}
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
                  {currentStep === 3
                    ? INSTANT_STEPS[currentStep].next
                    : `next: ${
                        INSTANT_STEPS[currentStep as InstantStepNumber].next
                      }`}
                </Button>
              </Grid> */}
            </Flex>
          </VStack>
        </Stack>
      ) : (
        <Text>Loading</Text>
      )}
    </Container>
  );
}

export default CreateInvoiceInstant;
