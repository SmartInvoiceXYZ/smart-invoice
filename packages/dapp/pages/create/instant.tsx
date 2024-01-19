import {
  Button,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
// import {
//   InstantPaymentDetailsForm,
//   ProjectDetailsForm,
// } from '@smart-invoice/forms';
import { INSTANT_STEPS, INVOICE_TYPES } from '@smart-invoice/constants';
import { useFetchTokensViaIPFS } from '@smart-invoice/hooks';
import {
  Container,
  FormConfirmation,
  NetworkChangeAlertModal,
  RegisterSuccess,
  StepInfo,
} from '@smart-invoice/ui';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useChainId, useWalletClient } from 'wagmi';

type InstantStepNumber = keyof typeof INSTANT_STEPS;

export function CreateInvoiceInstant() {
  const chainId = useChainId();
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();
  const prevChainIdRef = useRef<number>();
  const showChainChangeAlert = false;

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

  // if (txHash) {
  // eslint-disable-next-line no-constant-condition
  if (false) {
    return (
      <Container overlay>
        <RegisterSuccess />
      </Container>
    );
  }

  return (
    <Container overlay>
      {tokenData ? (
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
            setShowChainChangeAlert={() => undefined}
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
              /> */}

              {/*
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
