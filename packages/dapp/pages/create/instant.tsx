import { Flex, Heading, Stack, Text } from '@chakra-ui/react';
import {
  INSTANT_STEPS,
  INVOICE_TYPES,
  TOASTS,
} from '@smartinvoicexyz/constants';
import {
  FormConfirmation,
  InstantPaymentForm,
  ProjectDetailsForm,
  RegisterSuccess,
} from '@smartinvoicexyz/forms';
import { useFetchTokens, useInstantCreate } from '@smartinvoicexyz/hooks';
import {
  Container,
  NetworkChangeAlertModal,
  StepInfo,
  useMediaStyles,
  useToast,
} from '@smartinvoicexyz/ui';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Address, Hex } from 'viem';

import { useOverlay } from '../../contexts/OverlayContext';

export function CreateInvoiceInstant() {
  const queryClient = useQueryClient();
  const overlay = useOverlay();
  const invoiceForm = useForm();
  const { data: tokens } = useFetchTokens();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { headingSize, columnWidth } = useMediaStyles();
  const [invoiceId, setInvoiceId] = useState<Address>();
  const [txHash, setTxHash] = useState<Hex>();
  const onTxSuccess = (result: Address) => {
    toast.success(TOASTS.useInvoiceCreate.success);
    // invalidate cache
    queryClient.invalidateQueries({ queryKey: ['invoiceDetails'] });
    queryClient.invalidateQueries({ queryKey: ['invoiceList'] });

    setInvoiceId(result as Address);

    // Send to Success step
    nextStepHandler();
  };

  const { writeAsync, isLoading } = useInstantCreate({
    invoiceForm,
    toast,
    onTxSuccess,
  });

  const nextStepHandler = () => {
    setCurrentStep(currentStep + 1);
  };

  const goBackHandler = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const hash = await writeAsync?.();
    setTxHash(hash);
  };

  if (!tokens) {
    return (
      <Container overlay>
        <Text>Loading</Text>
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
        w={columnWidth}
        px="1rem"
        my="2rem"
        maxW="650px"
      >
        <NetworkChangeAlertModal {...overlay} />

        <Stack
          spacing={{ base: '1.5rem', lg: '1rem' }}
          w={{ base: '100%', md: 'auto' }}
        >
          <Heading fontWeight="700" fontSize={headingSize} textAlign="center">
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
            viewed by anyone. If you have privacy concerns, we recommend taking
            care to add permissions to your project agreement document.
          </Text>

          <Flex
            bg="white"
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
                type={INVOICE_TYPES.Instant}
              />
            )}

            {currentStep === 2 && (
              <InstantPaymentForm
                invoiceForm={invoiceForm}
                updateStep={nextStepHandler}
              />
            )}

            {currentStep === 3 && (
              <FormConfirmation
                invoiceForm={invoiceForm}
                handleSubmit={handleSubmit}
                canSubmit={!!writeAsync}
                isLoading={isLoading}
                type={INVOICE_TYPES.Instant}
              />
            )}
            {currentStep === 4 && (
              <RegisterSuccess
                invoiceId={invoiceId as Address}
                txHash={txHash as Address}
              />
            )}
          </Flex>
        </Stack>
      </Stack>
    </Container>
  );
}

export default CreateInvoiceInstant;
