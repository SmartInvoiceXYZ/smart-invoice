import { Box, Button, Flex, Heading, Icon, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';

import { CheckSquareIcon } from '../icons/CheckSquare';

export function CallToAction({ ...props }) {
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
    <Flex background="blue.1" width='100%' justify='center'>
      <Flex
        direction={flexDirection}
        rowGap={10}
        justify="space-between"
        align="center"
        background="blue.1"
        paddingY={20}
        paddingX={8}
        width="100%"
        {...props}
      >
        <Box display='flex' flexDirection='column' alignItems={flexDirection === 'column' && 'center'}>
          <Heading fontSize={50} fontWeight={700} textColor="white" textAlign={flexDirection === 'column' && 'center'}>
            Create your first invoice
          </Heading>
          <Flex direction={flexDirection} gap={flexDirection === 'column' ? 4 : 8} mt={4}>
            <Flex gap={4} align="center">
              <Icon as={CheckSquareIcon} color="white" checkColor="blue.1" />
              <Text textColor="white">Free to use</Text>
            </Flex>
            <Flex gap={4} align="center">
              <Icon as={CheckSquareIcon} color="white" checkColor="blue.1" />
              <Text textColor="white">No email sign up needed</Text>
            </Flex>
            <Flex gap={4} align="center">
              <Icon as={CheckSquareIcon} color="white" checkColor="blue.1" />
              <Text textColor="white">Integrated escrow</Text>
            </Flex>
            <Flex gap={4} align="center">
              <Icon as={CheckSquareIcon} color="white" checkColor="blue.1" />
              <Text textColor="white">Arbitration available</Text>
            </Flex>
          </Flex>
        </Box>
        <NextLink href='https://app.smartinvoice.xyz/' target="_blank" passHref>
          <a target="_blank">
            <Button
              background="white"
              textColor="gray.dark"
              fontWeight={700}
              fontSize={18}
              paddingY={6}
              paddingX={8}
              _hover={{ background: 'rgba(255, 255, 255, 0.7)' }}
            >
              Open dApp
            </Button>
          </a>
        </NextLink>
      </Flex>
    </Flex>
  );
}
