import {
  Flex,
  Heading,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ESCROW_STEPS } from '@smart-invoice/constants';
import {
  EscrowDetailsForm,
  FormConfirmation,
  PaymentsForm,
  ProjectDetailsForm,
  RegisterSuccess,
} from '@smart-invoice/forms';
import {
  Container,
  NetworkChangeAlertModal,
  StepInfo,
} from '@smart-invoice/ui';
// import _ from 'lodash';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useChainId } from 'wagmi';

import { useOverlay } from '../../contexts/OverlayContext';

export function CreateInvoiceEscrow() {
  const chainId = useChainId();
  const escrowForm = useForm();
  const { modals, setModals } = useOverlay();
  const [currentStep, setCurrentStep] = useState<number>(1);

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
            viewed by anyone. If you have privacy concerns, we recommend taking
            care to add permissions to your project agreement document.
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

            {currentStep === 2 && (
              <EscrowDetailsForm
                escrowForm={escrowForm}
                updateStep={nextStepHandler}
              />
            )}

            {currentStep === 3 && (
              <PaymentsForm
                escrowForm={escrowForm}
                updateStep={nextStepHandler}
              />
            )}

            {currentStep === 4 && <FormConfirmation escrowForm={escrowForm} />}
          </Flex>
        </Stack>
      </Stack>
    </Container>
  );
}

export default CreateInvoiceEscrow;
