import {
  Box,
  Flex,
  Heading,
  List,
  ListIcon,
  ListItem,
  Text,
} from '@chakra-ui/react';
import NextImage from 'next/image';

import productImg from '../../public/assets/home/escrow-release-screenshot.svg';
import { CustomIcon } from '../icons/CheckSquare';

export function FeatureEscrow({ ...props }) {
  return (
    <Flex justify="center" overflowX="hidden">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        pt={{ base: 20, lg: 16 }}
        pb={{ base: 16, lg: 12 }}
        paddingX={8}
        justify="space-between"
        align="center"
        gap={{ base: 2, lg: 10 }}
        width="100%"
        {...props}
      >
        {/* Text */}
        <Flex
          direction="column"
          w={{ base: '100%', lg: '50%' }}
          align={{ base: 'center', lg: 'end' }}
        >
          <Text fontSize={16} fontWeight={700} textColor="blue.1">
            CRYPTOCURRENCY ESCROW
          </Text>
          <Heading>Protect your money.</Heading>
          <Heading mb={6}>Protect your time.</Heading>
          <List
            width={{
              base: '100%',
              lg: '80% ',
            }}
            spacing={3}
          >
            <ListItem
              display="flex"
              gap={2}
              alignItems={{ base: 'flex-start', lg: 'center' }}
            >
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type="client"
              />
              <Text>
                Do business with anyone, anywhere, even if you don’t know or
                trust them yet
              </Text>
            </ListItem>
            <ListItem
              display="flex"
              gap={2}
              alignItems={{ base: 'flex-start', lg: 'center' }}
            >
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type="trust"
              />
              <Text>
                Gain the peace of mind that you will get paid if you do the work
              </Text>
            </ListItem>
            <ListItem
              display="flex"
              gap={2}
              alignItems={{ base: 'flex-start', lg: 'center' }}
            >
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type="progress"
              />
              <Text>
                Get paid as you complete project milestones, instead of at the
                end of your project
              </Text>
            </ListItem>
            <ListItem
              display="flex"
              gap={2}
              alignItems={{ base: 'flex-start', lg: 'center' }}
            >
              <ListIcon
                as={CustomIcon}
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                type="warning"
              />
              <Text>Protect yourself from chargebacks and fraud</Text>
            </ListItem>
          </List>
        </Flex>

        {/* Image */}
        <Box
          width={{
            base: '100%',
            lg: '80% ',
          }}
        >
          <NextImage
            src={productImg}
            alt="screenshot from app"
            width={600}
            height={452.47}
          />
        </Box>
      </Flex>
    </Flex>
  );
}
