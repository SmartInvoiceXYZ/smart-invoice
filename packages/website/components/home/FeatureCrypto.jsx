import { Box, Flex, Grid, GridItem, Heading, Text, VStack } from '@chakra-ui/react';
import NextImage from 'next/image';
import React from 'react';

import flexibleIcon from '../../public/icons/features/flexible.svg';
import impartialIcon from '../../public/icons/features/impartial.svg';
import secureIcon from '../../public/icons/features/secure.svg';

export function FeatureCrypto({ ...props }) {
  return (
    <Flex justify="center" align="center" width='100%'>
      <Flex direction='column' align='center' paddingY={20} paddingX={8} width="100%" textAlign='center' {...props}>
        <Heading mb={2}>Accept cryptocurrency payments for your work</Heading>
        <Text mb={10}>
          Choose from 17 tokens to get paid with, including USDT, USDC, WETH, DAI and more!
        </Text>
        <Grid
          gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
          width='100%'
          gap={10}
        >
          <GridItem display='flex' justifyContent='center'>
            <VStack maxWidth={310}>
              {/* Icon */}
              <NextImage
                src={flexibleIcon}
                width={56}
                height={56}
                objectFit="cover"
              />
              <Box>
                <Text fontWeight={700} fontSize={18} mt={6} mb={2}>
                  Flexible
                </Text>
                <Text>
                  Decide which cryptocurrency to be paid with and in how many
                  payments.
                </Text>
              </Box>
            </VStack>
          </GridItem>
          <GridItem display='flex' justifyContent='center'>
            <VStack maxWidth={310}>
              {/* Icon */}
              <NextImage
                src={secureIcon}
                width={56}
                height={56}
                objectFit="cover"
              />
              <Box>
                <Text fontWeight={700} fontSize={18} mt={6} mb={2}>
                  Secure
                </Text>
                <Text>
                  Escrow funds are secured via a smart contract until released to
                  your wallet.
                </Text>
              </Box>
            </VStack>
          </GridItem>
          <GridItem display='flex' justifyContent='center'>
            <VStack maxWidth={310}>
              {/* Icon */}
              <NextImage
                src={impartialIcon}
                width={56}
                height={56}
                objectFit="cover"
              />
              <Box>
                <Text fontWeight={700} fontSize={18} mt={6} mb={2}>
                  Impartial
                </Text>
                <Text>
                  Integrated dispute resolution through a third party arbitrator, if
                  you need it.
                </Text>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Flex>
    </Flex>
  );
}
