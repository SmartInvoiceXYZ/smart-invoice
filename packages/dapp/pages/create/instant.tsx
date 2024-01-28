import {
  Button,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { INSTANT_STEPS } from '@smart-invoice/constants';
import {
  FormConfirmation,
  InstantPaymentDetailsForm,
  ProjectDetailsForm,
  RegisterSuccess,
} from '@smart-invoice/forms';
import { useFetchTokens } from '@smart-invoice/hooks';
import {
  Container,
  NetworkChangeAlertModal,
  StepInfo,
} from '@smart-invoice/ui';
import _ from 'lodash';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useChainId } from 'wagmi';

import { useOverlay } from '../../contexts/OverlayContext';

export function CreateInvoiceInstant() {
  const chainId = useChainId();
  const { modals, setModals } = useOverlay();
  const invoiceForm = useForm();
  const { data } = useFetchTokens();
  const { tokenData } = _.pick(data, ['tokenData']);
  const [currentStep, setCurrentStep] = useState<number>(1);

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

  const nextStepHandler = () => {
    setCurrentStep(currentStep + 1);
  };

  const goBackHandler = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {};
  const canSubmit = false;

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
            modals={modals}
            setModals={setModals}
            chainId={chainId}
          />

          <Stack
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
              <StepInfo
                stepNum={currentStep}
                stepsDetails={INSTANT_STEPS}
                goBack={goBackHandler}
              />

              {currentStep === 1 && (
                <ProjectDetailsForm
                  invoiceForm={invoiceForm}
                  updateStep={nextStepHandler}
                />
              )}

              {currentStep === 2 && (
                <InstantPaymentDetailsForm invoiceForm={invoiceForm} />
              )}

              {currentStep === 3 && (
                <FormConfirmation
                  invoiceForm={invoiceForm}
                  handleSubmit={handleSubmit}
                  canSubmit={canSubmit}
                />
              )}

              {/* <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
                <Button
                  onClick={nextStepHandler}
                  // isLoading={loading}
                  // isDisabled={!nextStepEnabled}
                  textTransform="uppercase"
                  size={buttonSize}
                >
                  {currentStep === 3
                    ? INSTANT_STEPS[currentStep].next
                    : `next: ${
                        INSTANT_STEPS[currentStep as InstantStepNumber].next
                      }`}
                </Button>
              </Grid> */}
            </Flex>
          </Stack>
        </Stack>
      ) : (
        <Text>Loading</Text>
      )}
    </Container>
  );
}

export default CreateInvoiceInstant;
