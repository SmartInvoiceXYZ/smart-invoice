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
import { ESCROW_STEPS } from '@smart-invoice/constants';
import {
  PaymentChunksForm,
  PaymentDetailsForm,
  ProjectDetailsForm,
} from '@smart-invoice/forms';
import { useFetchTokensViaIPFS } from '@smart-invoice/hooks';
import {
  Container,
  FormConfirmation,
  NetworkChangeAlertModal,
  RegisterSuccess,
  StepInfo,
} from '@smart-invoice/ui';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useChainId } from 'wagmi';

type EscrowStepNumber = keyof typeof ESCROW_STEPS;

export function CreateInvoiceEscrow() {
  const chainId = useChainId();
  const escrowForm = useForm();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();
  const prevChainIdRef = useRef<number>();

  const [showChainChangeAlert, setShowChainChangeAlert] = useState(false);

  useEffect(() => {
    if (chainId === undefined) return;
    if (
      prevChainIdRef.current !== undefined &&
      prevChainIdRef.current !== chainId
    ) {
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

  const nextStepHandler = () => {
    setCurrentStep(currentStep + 1);
  };

  const goBackHandler = () => {
    setCurrentStep(currentStep - 1);
  };

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
                stepsDetails={ESCROW_STEPS}
                goBack={goBackHandler}
              />
              {currentStep === 1 && (
                <ProjectDetailsForm
                  escrowForm={escrowForm}
                  updateStep={nextStepHandler}
                />
              )}

              {/* 
              <PaymentDetailsForm
                display={currentStep === 2}
                tokenData={tokenData}
                allTokens={allTokens}
              />

              <PaymentChunksForm
                display={currentStep === 3}
                tokenData={tokenData}
              />

              <FormConfirmation
                display={currentStep === 4}
                tokenData={tokenData}
              />

              <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
                <Button
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

export default CreateInvoiceEscrow;
