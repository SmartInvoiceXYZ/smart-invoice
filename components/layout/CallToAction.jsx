import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';

export function CallToAction({ ...props }) {
  const [flexDirection, setFlexDirection] = useState('row')

  useEffect(() => {
    if (window) {
      toggleDirection()
      window.addEventListener('resize', toggleDirection)
    }
  })

  function toggleDirection() {
    if (window.innerWidth < 900) {
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
        columnGap={10}
        // justify="space-evenly"
        align="center"
        background="blue.1"
        paddingY={20}
        paddingX={8}
        width="100%"
        {...props}
      >
        <Flex width={flexDirection === 'row' && '50%'} direction="column" align={flexDirection === 'column' ? 'center' : 'flex-start'}>
          <Heading size="2xl" fontWeight={700} textColor="white" textAlign={flexDirection === 'column' && 'center'} mb={4}>
            All help articles
          </Heading>
          <Text textColor="white" textAlign={flexDirection === 'column' && 'center'} maxWidth={400}>
            Access our help center to view all documentation articles.
          </Text>
          <NextLink href='/getting-started/what-is-smart-invoice' passHref>
            <a>
              <Button
                background="white"
                textColor="gray.dark"
                fontWeight={700}
                fontSize={18}
                paddingY={6}
                paddingX={8}
                _hover={{ background: 'rgba(255, 255, 255, 0.7)' }}
                mt={8}
              >
                View All Documentation
              </Button>
            </a>
          </NextLink>
        </Flex>
        <Flex width={flexDirection === 'row' && '50%'} direction="column" align={flexDirection === 'column' ? 'center' : 'flex-start'}>
          <Heading size="2xl" fontWeight={700} textColor="white" textAlign={flexDirection === 'column' && 'center'} mb={4}>
            Need more help?
          </Heading>
          <Text textColor="white" textAlign={flexDirection === 'column' && 'center'} maxWidth={400}>
            Still can’t figure it out? We are available in the product support channel in the RaidGuild DAO Discord.
          </Text>
          <NextLink href='https://discord.gg/M2QaDPgKFR' target="_blank" passHref>
            <a target="_blank">
              <Button
                background="white"
                textColor="gray.dark"
                fontWeight={700}
                fontSize={18}
                paddingY={6}
                paddingX={8}
                _hover={{ background: 'rgba(255, 255, 255, 0.7)' }}
                mt={8}
              >
                Message Us on Discord
              </Button>
            </a>
          </NextLink>
        </Flex>
      </Flex>
    </Flex>
  );
}
