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
    <Flex justify="center" align="center" overflowX='hidden' background="gray.background">
      <Flex
        direction={flexDirection}
        paddingTop={flexDirection === 'row' ? 20 : 20}
        paddingBottom={flexDirection === 'row' ? 6 : 8}
        paddingX={8}
        justify="space-between"
        align={flexDirection === 'column' && 'center'}
        textAlign={flexDirection === 'column' ? 'center' : 'left'}
        gap={flexDirection === 'row' ? 10 : 2}
        width="100%"
        {...props}
      >
        {/* Image */}
        <Box width={flexDirection === 'row' ? '50%' : '100%'}>
          {/* <Box background="grey" width='100%' height={451} /> */}
          <NextImage src={productImg} alt='screenshot from app' width={600} height={431.4}/>
        </Box>

        {/* Text */}
        <Box width={flexDirection === 'row' ? '50%' : '100%'} textAlign={flexDirection === 'row' ? 'left' : 'center'}>
          <Text fontSize={16} fontWeight={700} textColor="blue.1">
            CRYPTOCURRENCY INVOICING
          </Text>
          <Heading mb={6}>
            The smart way to get paid as a web3 freelancer.
          </Heading>
          <List spacing={1} textAlign="left">
            <ListItem display="flex" gap={1} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type='avoid'
              />
              <Text>
                Prevent clients sending funds to the wrong wallet address
              </Text>
            </ListItem>
            <ListItem display="flex" gap={1} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type='menu'
              />
              <Text>Stay organized with all of your invoices in one place</Text>
            </ListItem>
            <ListItem display="flex" gap={1} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type='status'
              />
              <Text>Quickly check the status of each of your invoices</Text>
            </ListItem>
            <ListItem display="flex" gap={1} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type='pdf'
              />
              <Text>Download PDFs of each invoice for your records</Text>
            </ListItem>
          </List>
        </Box>
      </Flex>
    </Flex>
  );
}
