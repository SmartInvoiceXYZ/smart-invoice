import { Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { ESCROW_STEPS, INVOICE_TYPES, TOASTS } from '@smart-invoice/constants';
import {
  EscrowDetailsForm,
  FormConfirmation,
  PaymentsForm,
  ProjectDetailsForm,
  RegisterSuccess,
} from '@smart-invoice/forms';
import { useInvoiceCreate } from '@smart-invoice/hooks';
import {
  Container,
  NetworkChangeAlertModal,
  StepInfo,
  useMediaStyles,
  useToast,
} from '@smart-invoice/ui';
import { useQueryClient } from '@tanstack/react-query';
// import _ from 'lodash';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Address, Hex } from 'viem';
import { useChainId } from 'wagmi';

import { useOverlay } from '../../contexts/OverlayContext';

export function CreateInvoiceEscrow() {
  const chainId = useChainId();
  const invoiceForm = useForm();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { modals, setModals } = useOverlay();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [txHash, setTxHash] = useState<Address>();

  const [invoiceId, setInvoiceId] = useState<Address>();
  const { headingSize, columnWidth } = useMediaStyles();

  const nextStepHandler = () => {
    setCurrentStep(currentStep + 1);
  };

  const goBackHandler = () => {
    setCurrentStep(currentStep - 1);
  };

  const onTxSuccess = (result: Address) => {
    toast.success(TOASTS.useInvoiceCreate.success);
    // invalidate cache
    queryClient.invalidateQueries({ queryKey: ['invoiceDetails'] });
    queryClient.invalidateQueries({ queryKey: ['invoiceList'] });

    setInvoiceId(result as Address);

    // Send to Success step
    nextStepHandler();
  };

  const { writeAsync, isLoading } = useInvoiceCreate({
    invoiceForm,
    toast,
    onTxSuccess,
  });

  const handleSubmit = async () => {
    const data = await writeAsync?.();
    setTxHash(data?.hash);
  };

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
        <NetworkChangeAlertModal
          modals={modals}
          setModals={setModals}
          chainId={chainId}
        />

        <Stack
          spacing={{ base: '1.5rem', lg: '1rem' }}
          w={{ base: '100%', md: 'auto' }}
        >
          <Heading fontWeight="700" fontSize={headingSize} textAlign="center">
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
            direction="column"
            justify="space-between"
            p="1rem"
            bg="white"
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
                invoiceForm={invoiceForm}
                updateStep={nextStepHandler}
                type={INVOICE_TYPES.Escrow}
              />
            )}

            {currentStep === 2 && (
              <EscrowDetailsForm
                invoiceForm={invoiceForm}
                updateStep={nextStepHandler}
              />
            )}

            {currentStep === 3 && (
              <PaymentsForm
                invoiceForm={invoiceForm}
                updateStep={nextStepHandler}
              />
            )}

            {currentStep === 4 && (
              <FormConfirmation
                invoiceForm={invoiceForm}
                handleSubmit={handleSubmit}
                canSubmit={!!writeAsync}
                isLoading={isLoading}
                type={INVOICE_TYPES.Escrow}
              />
            )}

            {currentStep === 5 && (
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

export default CreateInvoiceEscrow;
