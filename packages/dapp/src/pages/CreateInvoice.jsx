import {
  Button,
  Flex,
  Grid,
  Stack,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';

import { FormConfirmation } from '../components/FormConfirmation';
import { PaymentChunksForm } from '../components/PaymentChunksForm';
import { PaymentDetailsForm } from '../components/PaymentDetailsForm';
import { ProjectDetailsForm } from '../components/ProjectDetailsForm';
import { RegisterSuccess } from '../components/RegisterSuccess';
import { CreateContext, CreateContextProvider } from '../context/CreateContext';
import { Container } from '../shared/Container';
import { StepInfo } from '../shared/StepInfo';
import { STEPS, URL_REGEX } from '../utils/constants';

const { isAddress } = utils;

const CreateInvoiceInner = () => {
  const {
    tx,
    loading,
    createInvoice,
    projectName,
    projectAgreement,
    clientAddress,
    paymentAddress,
    paymentToken,
    safetyValveDate,
    paymentDue,
    payments,
    termsAccepted,
    arbitrationProvider,
  } = useContext(CreateContext);
  const [currentStep, setStep] = useState(1);
  const [isEnabled, setEnabled] = useState(false);
  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  useEffect(() => {
    if (
      currentStep === 1 &&
      projectName &&
      URL_REGEX.test(projectAgreement) &&
      safetyValveDate &&
      safetyValveDate > new Date().getTime()
    ) {
      setEnabled(true);
    } else if (
      currentStep === 2 &&
      isAddress(clientAddress) &&
      isAddress(paymentAddress) &&
      isAddress(paymentToken) &&
      isAddress(arbitrationProvider) &&
      paymentDue.gt(0) &&
      termsAccepted &&
      Array.from(
        new Set([
          clientAddress.toLowerCase(),
          paymentAddress.toLowerCase(),
          paymentToken.toLowerCase(),
          arbitrationProvider.toLowerCase(),
        ]),
      ).length === 4
    ) {
      setEnabled(true);
    } else if (
      currentStep === 3 &&
      payments
        .reduce((t, a) => {
          return t.add(a);
        }, BigNumber.from(0))
        .eq(paymentDue)
    ) {
      setEnabled(true);
    } else if (currentStep === 4) {
      setEnabled(true);
    } else {
      setEnabled(false);
    }
  }, [
    projectName,
    projectAgreement,
    safetyValveDate,
    clientAddress,
    paymentAddress,
    paymentToken,
    paymentDue,
    payments,
    termsAccepted,
    currentStep,
    arbitrationProvider,
  ]);

  const stepHandler = () => {
    if (isEnabled) {
      if (currentStep === 4) return createInvoice();
      setStep(prevState => prevState + 1);
    }
    return () => undefined;
  };

  return (
    <Container overlay>
      {tx ? (
        <RegisterSuccess />
      ) : (
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          spacing="2rem"
          align="center"
          justify="center"
          w="100%"
          px="1rem"
          my="8rem"
        >
          <StepInfo
            stepNum={currentStep}
            stepTitle={STEPS[currentStep].step_title}
            stepDetails={STEPS[currentStep].step_details}
          />
          <VStack
            spacing={{ base: '1.5rem', lg: '1rem' }}
            w={{ base: '100%', md: 'auto' }}
          >
            <Flex
              bg="background"
              direction="column"
              justify="space-between"
              p="1rem"
              borderRadius="0.5rem"
              w="100%"
            >
              <ProjectDetailsForm
                display={currentStep === 1 ? 'flex' : 'none'}
              />
              <PaymentDetailsForm
                display={currentStep === 2 ? 'flex' : 'none'}
              />
              <PaymentChunksForm
                display={currentStep === 3 ? 'flex' : 'none'}
              />
              <FormConfirmation display={currentStep === 4 ? 'flex' : 'none'} />
            </Flex>
            <Grid templateColumns="1fr 4fr" gap="1rem" w="100%">
              {currentStep !== 1 ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => setStep(prevState => prevState - 1)}
                  size={buttonSize}
                  fontFamily="mono"
                  fontWeight="normal"
                >
                  BACK
                </Button>
              ) : (
                <Flex />
              )}
              <Button
                colorScheme="red"
                onClick={stepHandler}
                isLoading={loading}
                isDisabled={!isEnabled}
                textTransform="uppercase"
                size={buttonSize}
                fontFamily="mono"
                fontWeight="normal"
              >
                {currentStep === 4
                  ? STEPS[currentStep].next
                  : `next: ${STEPS[currentStep].next}`}
              </Button>
            </Grid>
          </VStack>
        </Stack>
      )}
    </Container>
  );
};

const CreateInvoiceWithProvider = props => (
  <CreateContextProvider>
    <CreateInvoiceInner {...props} />
  </CreateContextProvider>
);

export const CreateInvoice = withRouter(CreateInvoiceWithProvider);
