import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  Heading,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import NextLink from 'next/link';
import React, { useEffect, useState } from 'react';

import logo from '../../public/logos/smart-invoice/white.svg';

export function Footer({ ...props }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flexDirection, setFlexDirection] = useState('row');
  const toast = useToast();

  useEffect(() => {
    if (window) {
      toggleDirection();
      window.addEventListener('resize', toggleDirection);
    }
  });

  function toggleDirection() {
    if (window.innerWidth < 800) {
      setFlexDirection('column');
    } else {
      setFlexDirection('row');
    }
  }

  async function submitForm(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(process.env.GETFORM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const toastId = 'email-submitted';
      if (!toast.isActive(toastId)) {
        toast({
          id: toastId,
          duration: 3000,
          position: 'bottom',
          status: 'success',
          title: 'Email submitted!',
        });
      }
      setEmail('');
    } catch (error) {
      console.error(error);
    }
    setSubmitting(false);
  }

  return (
    <Flex direction="column" background="blue.dark" width="100%" align="center">
      <Flex
        direction={flexDirection}
        justify="space-between"
        align="center"
        paddingX={8}
        paddingY={10}
        gap={10}
        width="100%"
        maxWidth={1300}
        {...props}
      >
        <Box
          textColor="white"
          textAlign={flexDirection === 'column' ? 'center' : 'left'}
        >
          <Heading fontSize={32} fontWeight={700} textColor="white" mb={4}>
            Get the web3 freelancer edge
          </Heading>
          <Text maxWidth={725}>
            <span style={{ fontWeight: 700, fontStyle: 'italic' }}>
              Web3 moves fast. Things are always changing.{' '}
            </span>
            Add yourself to our notification list to get updates on new product
            features, and when something major happens in the web3 freelance
            space.
          </Text>
        </Box>
        <form onSubmit={e => submitForm(e)} method="POST">
          <FormControl
            display="flex"
            alignItems="center"
            justifyContent="right"
            maxWidth={500}
          >
            <Input
              type="email"
              name="email"
              borderRightRadius={0}
              background="white"
              color="gray.dark"
              maxWidth={300}
              minWidth={200}
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              placeholder="Email address"
              _placeholder={{ color: 'gray.light' }}
            />
            <Button
              type="submit"
              background="blue.1"
              textColor="white"
              fontWeight={700}
              fontSize={18}
              borderLeftRadius={0}
              paddingX={10}
              isLoading={submitting}
              _hover={{ background: 'blue.hover.1' }}
            >
              Add me!
            </Button>
          </FormControl>
        </form>
      </Flex>
      <Divider background="#DCF2ED" />
      <Flex
        direction={flexDirection === 'column' ? 'column-reverse' : 'row'}
        justify="space-between"
        align="center"
        paddingX={8}
        paddingY={4}
        textColor="white"
        rowGap={4}
        width="100%"
        {...props}
      >
        <NextImage
          src={logo}
          alt="Smart Invoice logo"
          width={160}
          height={25.34}
        />
        <Flex gap={8} justify="center" align="center">
          <NextLink href="/">Home</NextLink>
          <NextLink href="/getting-started/what-is-smart-invoice">
            Docs
          </NextLink>
          <NextLink href="https://twitter.com/SmartInvoiceXYZ" target="_blank">
            Twitter
          </NextLink>
          <NextLink href="https://discord.gg/Rws3gEu8W7" target="_blank">
            Discord
          </NextLink>
        </Flex>
      </Flex>
    </Flex>
  );
}
