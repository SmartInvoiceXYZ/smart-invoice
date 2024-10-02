import { Stack, Text } from '@chakra-ui/react';

import { Container } from './Container';

export function InvoiceNotFound({ heading }: { heading?: string }) {
  return (
    <Container>
      <Stack
        spacing="1rem"
        background="white"
        borderRadius="1rem"
        align="center"
        w="calc(100% - 2rem)"
        p="2rem"
        maxW="27.5rem"
        mx={4}
        color="white"
      >
        <Text
          fontSize="2xl"
          textAlign="center"
          fontFamily="heading"
          color="black"
        >
          {heading || 'Invoice Not Found'}
        </Text>
      </Stack>
    </Container>
  );
}
