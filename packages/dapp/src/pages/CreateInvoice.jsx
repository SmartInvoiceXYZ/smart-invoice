import {
  Button,
  Text,
  Flex,
  Grid,
  Stack,
  useBreakpointValue,
  VStack,
  Heading,
} from '@chakra-ui/react';
import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom';

import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';

import { FormConfirmation } from '../components/FormConfirmation';
import { PaymentChunksForm } from '../components/PaymentChunksForm';
import { PaymentDetailsForm } from '../components/PaymentDetailsForm';
import { ProjectDetailsForm } from '../components/ProjectDetailsForm';
import { RegisterSuccess } from '../components/RegisterSuccess';
import { CreateContext, CreateContextProvider } from '../context/CreateContext';
import { Container } from '../shared/Container';
import { StepInfo } from '../shared/StepInfo';
import { STEPS } from '../utils/constants';

const CreateInvoiceInner = () => {
  const {
    tx,
    loading,
    currentStep,
    nextStepEnabled,
    goBackHandler,
    nextStepHandler,
  } = useContext(CreateContext);
  const [{ tokenData, allTokens }] = useFetchTokensViaIPFS();

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

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
          w="75%"
          px="1rem"
          my="8rem"
          // backgroundColor='red'
        >
          <VStack
            spacing={{ base: '1.5rem', lg: '1rem' }}
            w={{ base: '100%', md: 'auto' }}
          >
            <Heading fontWeight="700">Create a Smart Invoice</Heading>
            <Text color="#90A0B7" as="i">
              {' '}
              Note: All invoice data will be stored publicly on IPFS and can be
              viewed by anyone., If you have privacy concerns, we recommend
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
                stepTitle={STEPS[currentStep].step_title}
                stepDetails={STEPS[currentStep].step_details}
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
              <Grid
                templateColumns="1fr 4fr"
                gap="1rem"
                w="100%"
                marginTop="20px"
              >
                {currentStep !== 1 ? (
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={goBackHandler}
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
                  colorScheme="blue"
                  onClick={nextStepHandler}
                  isLoading={loading}
                  isDisabled={!nextStepEnabled}
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
            </Flex>
          </VStack>
        </Stack>
      ) : (
        <Text>Loading</Text>
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
