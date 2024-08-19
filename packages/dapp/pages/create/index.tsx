import { Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { ChakraNextLink, useMediaStyles } from '@smartinvoicexyz/ui';

function SelectInvoiceType() {
  const { primaryButtonSize } = useMediaStyles();

  return (
    <Flex direction="column" align="center" justify="center" gap={6}>
      <Heading
        fontWeight={700}
        fontSize={50}
        textAlign="center"
        color="rgba(50, 60, 71, 1)"
      >
        Select an Invoice
      </Heading>

      <Text fontStyle="italic" color="grey">
        Which type of invoice do you want to create?
      </Text>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        columnGap={10}
        rowGap={4}
        width="100%"
        align="stretch"
        justify="center"
        paddingX={10}
      >
        <ChakraNextLink href="/create/escrow">
          <Button size={primaryButtonSize} variant="max">
            <Stack spacing={6}>
              <Heading>Escrow</Heading>

              <Stack fontSize={12} fontWeight="normal" textAlign="center">
                <Text>Secure funds and release payments by milestones.</Text>

                <Text>Includes arbitration.</Text>
              </Stack>
              <Text fontSize={12} fontWeight="normal">
                Recommended for medium to large projects
              </Text>
            </Stack>
          </Button>
        </ChakraNextLink>

        <ChakraNextLink href="/create/instant">
          <Button size={primaryButtonSize} variant="max">
            <Stack spacing={6}>
              <Heading>Instant</Heading>

              <Stack textAlign="center" fontSize={12} fontWeight="normal">
                <Text wordBreak="break-word">Receive payment immediately.</Text>

                <Text>Does NOT include arbitration.</Text>
              </Stack>
              <Text fontSize={12} fontWeight="normal">
                Recommended for small projects
              </Text>
            </Stack>
          </Button>
        </ChakraNextLink>
      </Flex>
    </Flex>
  );
}

export default SelectInvoiceType;
