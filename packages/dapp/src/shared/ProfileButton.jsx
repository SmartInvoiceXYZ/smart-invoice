import {
  Button,
  Flex,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react';
import React from 'react';

import { theme } from '../theme';
import { getAccountString } from '../utils/helpers';

export const ProfileButton = ({ profile, account, disconnect }) => (
  <Flex
    justify="center"
    align="center"
    mx={{ base: '2rem', sm: '3rem' }}
    zIndex={7}
    height="8rem"
    position="absolute"
    top="0"
    left="0"
  >
    <Popover>
      <PopoverTrigger>
        <Button
          h="auto"
          fontWeight="normal"
          borderRadius="full"
          variant="ghost"
          colorScheme="red"
          fontFamily="mono"
          p="2"
        >
          <Flex
            borderRadius="50%"
            w="2.5rem"
            h="2.5rem"
            overflow="hidden"
            justify="center"
            align="center"
            bgColor="black"
            bgImage={profile && `url(${profile.imageUrl})`}
            border={`1px solid ${theme.colors.white20}`}
            bgSize="cover"
            bgRepeat="no-repeat"
            bgPosition="center center"
          />
          <Text
            px={2}
            display="flex"
            fontFamily="'Roboto Mono', monospace;"
            color="red.500"
          >
            {profile && profile.name ? profile.name : getAccountString(account)}
          </Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent bg="none" w="auto">
        <Button
          onClick={() => {
            disconnect();
          }}
          colorScheme="red"
          fontWeight="normal"
          fontFamily="mono"
          textTransform="uppercase"
        >
          Disconnect
        </Button>
      </PopoverContent>
    </Popover>
  </Flex>
);
