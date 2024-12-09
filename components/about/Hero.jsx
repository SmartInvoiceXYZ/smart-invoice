import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';

export function HeroSection({ ...props }) {
  return (
    <Flex justify="center" align="center" background="gray.background" width='100%'>
      <VStack
        paddingY={20}
        paddingX={8}
        width="100%"
        justify='center'
        align='center'
        minHeight={320}
        {...props}
      >
        <Text
          textColor="blue.1"
          fontSize={16}
          fontWeight={700}
          fontFamily="Poppins"
        >
          Get to know Smart Invoice
        </Text>
        <Heading
          textColor="charcoal"
          fontSize={50}
          fontWeight={700}
          fontFamily="Poppins"
        >
          About Us
        </Heading>
      </VStack>
    </Flex>
  );
}
