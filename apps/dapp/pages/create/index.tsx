import { Flex, Heading, Stack, Text } from '@chakra-ui/react';
import {
  ESCROW_STEPS,
  INVOICE_TYPES,
  TOASTS,
} from '@smartinvoicexyz/constants';
import {
  EscrowDetailsForm,
  FormConfirmation,
  PaymentsForm,
  ProjectDetailsForm,
  RegisterSuccess,
} from '@smartinvoicexyz/forms';
import {
  QUERY_KEY_INVOICE_DETAILS,
  QUERY_KEY_INVOICES,
  useInvoiceCreate,
} from '@smartinvoicexyz/hooks';
import {
  Container,
  StepInfo,
  useMediaStyles,
  useToast,
} from '@smartinvoicexyz/ui';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Address, Hex } from 'viem';
import { useChainId } from 'wagmi';

export function CreateInvoiceEscrow() {
  const invoiceForm = useForm();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [txHash, setTxHash] = useState<Hex>();

  const [invoiceId, setInvoiceId] = useState<Address>();
  const { headingSize, columnWidth } = useMediaStyles();
  const chainId = useChainId();
  const [currentChainId, setCurrentChainId] = useState(chainId);

  useEffect(() => {
    if (chainId !== currentChainId) {
      setCurrentChainId(chainId);
      setCurrentStep(1);
    }
  }, [chainId, currentChainId]);

  const nextStepHandler = () => {
    setCurrentStep(currentStep + 1);
  };

  const goBackHandler = () => {
    setCurrentStep(currentStep - 1);
  };

  const onTxSuccess = (result: Address) => {
    toast.success(TOASTS.useInvoiceCreate.success);
    // invalidate cache
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY_INVOICES] });

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
    const hash = await writeAsync?.();
    setTxHash(hash);
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
        maxW="45rem"
      >
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
              goBack={isLoading ? undefined : goBackHandler}
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
