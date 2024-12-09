import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  Heading,
  Input,
  Link,
  Text,
  useToast,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import NextLink from 'next/link';
import React, { useEffect, useState } from 'react';

import logo from '../../public/logos/smart-invoice/white.svg';

export function DocFooter({ ...props }) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [flexDirection, setFlexDirection] = useState('row')
  const toast = useToast()

  useEffect(() => {
    if (window) {
      toggleDirection()
      window.addEventListener('resize', toggleDirection)
    }
  })

  function toggleDirection() {
    if (window.innerWidth < 800) {
      setFlexDirection('column')
    } else {
      setFlexDirection('row')
    }
  }

  async function submitForm(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch(process.env.GETFORM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      console.log("Submitted")
      const toastId = "email-submitted"
      if (!toast.isActive(toastId)) {
        toast({
          id: toastId,
          duration: 3000,
          position: "bottom",
          status: "success",
          title: "Email submitted!"
        })
      }
      setEmail('')
    } catch (error) {
      console.error(error)
    }
    setSubmitting(false)
  }

  return (
    <Flex direction='column' background="blue.dark" width='100%' align='center'>
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
        <NextImage src={logo} width={160} height={25.34} />
        <Flex gap={8} justify="center" align="center">
          <NextLink href="https://smartinvoice.xyz" target='_blank' passHref>
            <Link isExternal>Website</Link>
          </NextLink>
          <NextLink href="/getting-started/what-is-smart-invoice" passHref>
            <Link>Documentation</Link>
          </NextLink>
          <NextLink href="/misc/get-support" passHref>
            <Link>Support</Link>
          </NextLink>
          <NextLink href="https://twitter.com/SmartInvoiceXYZ" target="_blank" passHref>
            <Link target="_blank">Twitter</Link>
          </NextLink>
        </Flex>
      </Flex>
    </Flex>
  );
}
