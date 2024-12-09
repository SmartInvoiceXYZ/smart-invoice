import {
  Box,
  Flex,
  Heading,
  List,
  ListIcon,
  ListItem,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import NextImage from "next/image";

import { CustomIcon } from '../icons/CheckSquare';
import productImg from '../../public/assets/home/invoices-list-screenshot.svg'

export function FeatureInvoice({ ...props }) {
  const [flexDirection, setFlexDirection] = useState('row')

  useEffect(() => {
    if (window) {
      toggleDirection()
      window.addEventListener('resize', toggleDirection)
    }
  })

  function toggleDirection() {
    if (window.innerWidth < 800) {
      setFlexDirection('column-reverse')
    } else {
      setFlexDirection('row')
    }
  }

  return (
    <Flex justify="center" align="center" overflowX='hidden'>
      <Flex
        direction={flexDirection}
        paddingY={20}
        paddingX={8}
        justify="space-between"
        align="center"
        gap={20}
        width="100%"
        {...props}
      >
        {/* Image */}
        <Box width={flexDirection === 'row' ? '50%' : '100%'}>
          {/* <Box background="grey" width='100%' height={451} /> */}
          <NextImage src={productImg} width={600} height={431.4} />
        </Box>

        {/* Text */}
        <Box width={flexDirection === 'row' ? '50%' : '100%'} textAlign={flexDirection === 'row' ? 'left' : 'center'}>
          <Text fontSize={16} fontWeight={700} textColor="blue.1">
            CRYPTOCURRENCY INVOICING
          </Text>
          <Heading mb={6}>
            The smart way to get paid as a web3 freelancer.
          </Heading>
          <List spacing={6}>
            <ListItem display="flex" alignItems="center" gap={4} flexDirection={flexDirection === 'row' ? 'row' : 'column'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                type='avoid'
              />
              <Text maxWidth={flexDirection !== 'row' && '360px'}>
                Prevent clients sending funds to the wrong wallet address
              </Text>
            </ListItem>
            <ListItem display="flex" alignItems="center" gap={4} flexDirection={flexDirection === 'row' ? 'row' : 'column'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                type='menu'
              />
              <Text maxWidth={flexDirection !== 'row' && '360px'}>Stay organized with all of your invoices in one place</Text>
            </ListItem>
            <ListItem display="flex" alignItems="center" gap={4} flexDirection={flexDirection === 'row' ? 'row' : 'column'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                type='status'
              />
              <Text maxWidth={flexDirection !== 'row' && '360px'}>Quickly see the status of each invoice</Text>
            </ListItem>
            <ListItem display="flex" alignItems="center" gap={4} flexDirection={flexDirection === 'row' ? 'row' : 'column'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                type='pdf'
              />
              <Text maxWidth={flexDirection !== 'row' && '360px'}>Download PDFs of each invoice for your records</Text>
            </ListItem>
          </List>
        </Box>
      </Flex>
    </Flex>
  );
}
