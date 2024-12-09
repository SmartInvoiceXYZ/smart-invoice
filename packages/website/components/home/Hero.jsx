import { Box, Button, Flex, Heading, Link, Text, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import NextImage from "next/image";
import NextLink from "next/link";
import heroImg from '../../public/assets/home/hero-image.svg';

export function HeroSection({ ...props }) {
  const [flexDirection, setFlexDirection] = useState('row')

  useEffect(() => {
    if (window) {
      toggleDirection()
      window.addEventListener('resize', toggleDirection)
    }
  })

  function toggleDirection() {
    if (window.innerWidth < 800) {
      setFlexDirection('column')
    } else {
      setFlexDirection('row')
    }
  }

  return (
    <Flex justify="center" align="center" background="gray.background" overflowX='hidden'>
      <Flex direction={flexDirection} gap={10} paddingY={20} paddingX={8} width="100%" justify='space-between' align='center' {...props}>
        <VStack align={flexDirection === 'column' ? "center" : "left"} gap={4}>
          <Box
            textColor="charcoal"
            fontSize={50}
            fontWeight={700}
            fontFamily="Poppins"
          >
            <Heading size="2xl" textAlign={flexDirection === 'column' ? "center" : "left"}>Crypto invoicing</Heading>
            <Heading size="2xl" fontStyle="italic" textAlign={flexDirection === 'column' ? "center" : "left"}>that&apos;s simple & free</Heading>
          </Box>
          <Heading size="md" fontWeight="normal" maxWidth={500} color="charcoal" textAlign={flexDirection === 'column' ? "center" : "left"}>
            Smart Invoice is an easy-to-use tool that provides web3 freelancers
            with cryptocurrency invoicing, escrow, and arbitration.
          </Heading>
          <NextLink href="https://app.smartinvoice.xyz" target="_blank" passHref>
            <a target="_blank">
              <Link as={Button} background="blue.1" textColor="white" width={164} paddingY={6} _hover={{ background: 'blue.hover.1' }} target="_blank" isExternal>
                Open dApp
              </Link>
            </a>
          </NextLink>
          <Text
            fontSize={12}
            fontWeight={400}
            fontStyle="italic"
            textColor="gray.light"
          >
            Free to use. No email signup required.
          </Text>
        </VStack>

        {/* Image */}
        <NextImage src={heroImg} width={600} height={453.24} objectFit="cover" />
      </Flex>
    </Flex>
  );
}
