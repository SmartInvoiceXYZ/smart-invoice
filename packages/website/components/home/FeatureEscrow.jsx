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
import productImg from "../../public/assets/home/escrow-release-screenshot.svg";

export function FeatureEscrow({ ...props }) {
  const [flexDirection, setFlexDirection] = useState('row')
  const [columns, setColumns] = useState(2)

  useEffect(() => {
    if (window) {
      toggleDirection()
      window.addEventListener('resize', toggleDirection)
    }
  })

  function toggleDirection() {
    if (window.innerWidth < 800) {
      setFlexDirection('column')
      setColumns(1)
    } else {
      setFlexDirection('row')
      setColumns(2)
    }
  }

  return (
    <Flex justify="center" overflowX='hidden'>
      <Flex
        direction={flexDirection}
        paddingTop={flexDirection === 'row' ? 16 : 20}
        paddingBottom={flexDirection === 'row' ? 16 : 12}
        paddingX={8}
        justify="space-between"
        align="center"
        gap={flexDirection === 'row' ? 10 : 2}
        width="100%"
        {...props}
      >
        {/* Text */}
        <Flex 
          direction='column' 
          width={flexDirection === 'row' ? '50%' : '100%'} 
          alignItems={flexDirection === 'row' ? 'end' : 'center'} 
        >
          <Text fontSize={16} fontWeight={700} textColor="blue.1">
            CRYPTOCURRENCY ESCROW
          </Text>
          <Heading>Protect your money.</Heading>
          <Heading mb={6}>Protect your time.</Heading>
          <List width={flexDirection === 'row' ? '80%' : '100%'} spacing={3}>
            <ListItem display="flex" gap={2} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={30}
                height={30}
                type='client'
              />
              <Text>
                Do business with anyone, anywhere, even if you don’t know or trust them yet
              </Text>          
            </ListItem>
            <ListItem display="flex" gap={2} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={30}
                height={30}
                type='trust'
              />
              <Text>Gain the peace of mind that you will get paid if you do the work</Text>
            </ListItem>
            <ListItem display="flex" gap={2} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={30}
                height={30}
                type='progress'
              />
              <Text>
                Get paid as you complete project milestones, instead of at the end of your project
              </Text>
            </ListItem>
            <ListItem display="flex" gap={2} alignItems={flexDirection === 'row' ? 'center' : 'flex-start'}>
              <ListIcon
                as={CustomIcon}
                width={30}
                height={30}
                type='warning'
              />
              <Text>Protect yourself from chargebacks and fraud</Text>
            </ListItem>
          </List>

          {/* <Grid gridTemplateColumns={`repeat(${columns}, minmax(100px, 360px))`} gap={8} rowGap={10}>
            <GridItem
              display="flex"
              flexDir="column"
              alignItems={flexDirection === 'row' ? "flex-start" : "center"}
              textAlign={flexDirection === 'row' ? "left" : "center"}
            >
              <Icon
                as={CustomIcon}
                width={30}
                height={30}
                type='client'
              />
              <Text mt={2}>
                Do business with anyone, anywhere, even if you don’t know or
                trust them yet
              </Text>
            </GridItem>
            <GridItem
              display="flex"
              flexDir="column"
              alignItems={flexDirection === 'row' ? "flex-start" : "center"}
              textAlign={flexDirection === 'row' ? "left" : "center"}
            >
              <Icon
                as={CustomIcon}
                width={30}
                height={30}
                type='trust'
              />
              <Text mt={2}>
                Gain the peace of mind that you will get paid if you do the work
              </Text>
            </GridItem>
            <GridItem
              display="flex"
              flexDir="column"
              alignItems={flexDirection === 'row' ? "flex-start" : "center"}
              textAlign={flexDirection === 'row' ? "left" : "center"}
            >
              <Icon
                as={CustomIcon}
                width={30}
                height={30}
                type='progress'
              />
              <Text mt={2}>
                Get paid as you complete project milestones, instead of at the
                end of your project
              </Text>
            </GridItem>
            <GridItem
              display="flex"
              flexDir="column"
              alignItems={flexDirection === 'row' ? "flex-start" : "center"}
              textAlign={flexDirection === 'row' ? "left" : "center"}
            >
              <Icon
                as={CustomIcon}
                width={30}
                height={30}
                type='warning'
              />
              <Text mt={2}>Protect yourself from chargebacks and fraud</Text>
            </GridItem>
          </Grid> */}
        </Flex>

        {/* Image */}
        <Box width={flexDirection === 'row' ? '50%' : '100%'}>
          <NextImage src={productImg} width={600} height={452.47} />
        </Box>
      </Flex>
    </Flex>
  );
}
