import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Icon,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import { CustomIcon } from '../icons/CheckSquare';

export function FeatureArbitration({ ...props }) {
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
    <Flex justify="center" align="center" overflowX='hidden' background="gray.background">
      <Flex
        direction={flexDirection}
        paddingY={20}
        paddingX={8}
        justify="space-between"
        align={flexDirection === 'column' && 'center'}
        textAlign={flexDirection === 'column' ? 'center' : 'left'}
        gap={10}
        width="100%"
        {...props}
      >
        <Box>
          <Text fontSize={16} fontWeight={700} textColor="blue.1">
            THIRD PARTY ARBITRATION
          </Text>
          <Heading>Dispute resolution,</Heading>
          <Heading mb={6}>without the stress.</Heading>
        </Box>

        <Grid gridTemplateColumns={columns === 1 ? `repeat(${columns}, minmax(260px, 360px))` : `repeat(${columns}, 260px)`} gap={8} rowGap={10}>
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
        </Grid>
      </Flex>
    </Flex>
  );
}
