import {
  Box,
  Flex,
  List,
  ListIcon,
  ListItem,
  // Grid,
  // GridItem,
  Heading,
  // Icon,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import NextImage from 'next/image';

import { CustomIcon } from '../icons/CheckSquare';
// import productImg from '../../public/assets/home/invoices-list-screenshot.svg'
import productImg from '../../public/assets/home/lock-funds-screenshot.png'

export function FeatureArbitration({ ...props }) {
  const [flexDirection, setFlexDirection] = useState('row')
  // const [columns, setColumns] = useState(2)

  useEffect(() => {
    if (window) {
      toggleDirection()
      window.addEventListener('resize', toggleDirection)
    }
  })

  function toggleDirection() {
    if (window.innerWidth < 800) {
      setFlexDirection('column-reverse')
      // setColumns(1)
    } else {
      setFlexDirection('row')
      // setColumns(2)
    }
  }

  return (
    <Flex justify="center" align="center" overflowX='hidden' background="gray.background">
      <Flex
        direction={flexDirection}
        // paddingTop={flexDirection === 'row' ? 20 : 20}
        // paddingBottom={flexDirection === 'row' ? 20 : 20}
        paddingY={20}
        paddingX={8}
        justify="space-between"
        // align='center'
        align={flexDirection === 'column' && 'center'}
        textAlign={flexDirection === 'column' ? 'center' : 'left'}
        gap={flexDirection === 'row' ? 10 : 8}
        width="100%"
        {...props}
      >
        {/* Image */}
        <Box width={flexDirection === 'row' ? '50%' : '100%'} display='flex' justifyContent='center'>
          {/* <Box background="grey" width='100%' height={451} /> */}
          <Flex  width={flexDirection === 'row' ? 400 : 250} height={flexDirection === 'row' ? 400 : 250} justify='center' borderRadius='12px' overflow='hidden'>
            <NextImage src={productImg} alt='screenshot from app'/>
          </Flex>
        </Box>

        {/* Text */}
        <Box width={flexDirection === 'row' ? '50%' : '100%'} textAlign={flexDirection === 'row' ? 'left' : 'center'}>
          <Text fontSize={16} fontWeight={700} textColor="blue.1">
            THIRD PARTY ARBITRATION
          </Text>
          <Heading>Dispute resolution,</Heading>
          <Heading mb={6}>without the stress.</Heading>
          <List spacing={1} textAlign="left">
            <ListItem display="flex" gap={1} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type='scale'
              />
              <Text>
              Benefit from impartial decision making in case of conflict
              </Text>
            </ListItem>
            <ListItem display="flex" gap={1} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type='piechart'
              />
              <Text>Maximum arbitration service fee of 5%, automatically deducted from escrow</Text>
            </ListItem>
            <ListItem display="flex" gap={1} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type='search'
              />
              <Text>No need to find a third party arbitrator on your own</Text>
            </ListItem>
          </List>
        </Box>

        {/* <Grid gridTemplateColumns={columns === 1 ? `repeat(${columns}, minmax(260px, 360px))` : `repeat(${columns}, 260px)`} gap={8} rowGap={10}>
          <GridItem>
            <Icon
              as={CustomIcon}
              width={30}
              height={30}
              type='scale'
            />
            <Text mt={2}>
              Benefit from impartial decision making in case of conflict
            </Text>
          </GridItem>
          <GridItem>
            <Icon
              as={CustomIcon}
              width={30}
              height={30}
              type='piechart'
            />
            <Text mt={2}>
              Maximum arbitration service fee of 5%, automatically deducted from
              escrow
            </Text>
          </GridItem>
          <GridItem>
            <Icon
              as={CustomIcon}
              width={30}
              height={30}
              type='search'
            />
            <Text mt={2}>
              No need to find a third party arbitrator on your own
            </Text>
          </GridItem>
        </Grid> */}
      </Flex>
    </Flex>
  );
}
