import { Box, Flex, Heading, Text, VStack, Link } from "@chakra-ui/react";
import NextImage from 'next/image'
import { useEffect, useState } from "react";

import mdLogo from '../../public/logos/molochdao.svg';
import rgLogo from '../../public/logos/raidguild.svg';

export function Supporters({ ...props }) {
  const [flexDirection, setFlexDirection] = useState('row')
  const [alignment, setAlignment] = useState('flex-start')

  useEffect(() => {
    if (window) {
      changeFlexDirection()
      window.addEventListener('resize', changeFlexDirection)
    }
  })

  function changeFlexDirection() {
    if (window.innerWidth < 800) {
      setFlexDirection('column')
      setAlignment('center')
    } else {
      setFlexDirection('row')
      setAlignment('flex-start')
    }
  }

  return (
    <Flex width='100%' justify='center'>
      <Box background='white' textAlign='center' paddingY={20} paddingX={8}>
        <Heading mb={4}>
          Our Supporters
        </Heading>
        <Text>
          Meet the organizations helping Smart Invoice succeed.
        </Text>
        <Flex direction={flexDirection} justify='space-evenly' align={alignment} gap={20} mt={flexDirection === 'column' ? 20 : 10} {...props}>
          <VStack maxWidth={320} gap={8}>
            <Link href="https://www.raidguild.org/" isExternal>
              <NextImage src={rgLogo} width={180} height={47.45} />
            </Link>
            <Text>
              In October 2020, several members of Raid Guild DAO began developing the initial version of Smart Invoice as an internal tool to handle invoicing and escrow for the contract work the DAO provided to clients.
            </Text>
          </VStack>
          <VStack maxWidth={320} gap={4}>
            <Link href="https://molochdao.com/" isExternal>
              <NextImage src={mdLogo} width={220} height={55.24} />
            </Link>
            <Text>
              In May 2022, the MolochDAO community passed an $82,000 grant proposal to support the continued development of Smart Invoice as a public good.
            </Text>
          </VStack>
        </Flex>
      </Box>
    </Flex>
  )
}