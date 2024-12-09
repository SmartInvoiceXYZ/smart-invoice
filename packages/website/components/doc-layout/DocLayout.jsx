import {
  Flex,
  Link,
  VStack,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Button,
  Text
} from '@chakra-ui/react';
import Head from 'next/head';
import Script from 'next/script';
import React, { useState, useEffect } from 'react';

import { DocFooter } from './DocFooter';
import { NavBar } from '../layout/NavBar';
import NextLink from 'next/link';
import { docV3Menu } from '../../sidebars';
import { useRouter } from 'next/router';


export function DocLayout({ children, metatags, title, active }) {
  const [mobile, setMobile] = useState(true)
  const [category, setCategory] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  const { isOpen, onOpen, onClose } = useDisclosure()
  const mobileMenuBtnRef = React.useRef()

  useEffect(() => {
    if (window) {
      setIsLoaded(true)
      toggleMobileMode()
      window.addEventListener('resize', toggleMobileMode)
    }
  })

  useEffect(() => getCategory(), [router.pathname])

  function toggleMobileMode() {
    if (window.innerWidth < 900) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }

  function getCategory() {
    const docMenuItem = docV3Menu.find(item => router.pathname.includes(item.path))
    setCategory(docMenuItem.category)
  }

  return (
    <Flex direction="column" minHeight="100vh">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} | Smart Invoice Documentation</title>
        <meta name="description" content="Have a question about Smart Invoice? Find the answer here." />
        <meta name="keywords" content="online invoicing software, cryptocurrency invoicing, free invoicing, invoices, escrow, crypto escrow, crypto payments" />
        <meta name="author" content="Smart Invoice" />
        <meta property="og:title" content="Smart Invoice Documentation" />
        <meta property="og:description" content="Have a question about Smart Invoice? Find the answer here." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Smart Invoice" />
        <meta property="og:image" content="https://smartinvoice.xyz/meta/home-graphic.png" />
        <meta property="og:url" content="https://smartinvoice.xyz" />
        <meta name="twitter:card" content="https://smartinvoice.xyz/meta/about-graphic.png" />
        <meta name="twitter:image:alt" content="Crypto Invoicing & Escrow Tool" />
        <meta name="twitter:site" content="@SmartInvoiceXYZ" />
        <link rel="icon" href="/logos/smart-invoice/icon-blue.svg" />
      </Head>
      <Script
        async
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-30565BWGW9`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-30565BWGW9');
          `,
        }}
      />

      <NavBar />
      {isLoaded ? (
        <>
          {mobile ? (
            <Flex direction='column' flexGrow={1} paddingY={6} paddingX={4} gap={4}>
              <Button
                ref={mobileMenuBtnRef}
                background="white"
                textColor='blue.1'
                borderColor='blue.1'
                borderWidth={2}
                borderRadius={8}
                paddingY={6}
                _hover={{ background: 'gray.background' }}
                onClick={onOpen}
              >
                View All Documentation
              </Button>
              <Drawer
                isOpen={isOpen}
                placement='left'
                onClose={onClose}
                finalFocusRef={mobileMenuBtnRef}
              >
                <DrawerOverlay />
                <DrawerContent background="white">
                  <DrawerCloseButton />
                  <DrawerHeader>Documentation</DrawerHeader>

                  <DrawerBody>
                    <VStack align='flex-start' width='100%'>
                      {docV3Menu.map((item, i) => (
                        <>
                          <NextLink key={`${item.path}-${i}`} href={`/${item.path}/${item.topics[0].slug}`} passHref>
                            <Link
                              _hover={{ color: 'blue.1', background: 'gray.background' }}
                              paddingY={1}
                              paddingX={6}
                              width='100%'
                              borderRadius={8}
                              fontWeight='bold'
                              onClick={onClose}
                            >
                              {item.category}
                            </Link>
                          </NextLink>
                          {router.pathname.includes(item.path) && (
                            <VStack align='flex-start' paddingLeft={4} width='100%'>
                              {item.topics.map(topic => (
                                <NextLink key={`${topic.slug}`} href={`/${item.path}/${topic.slug}`} passHref>
                                  <Link
                                    _hover={{ color: 'blue.1', background: 'gray.background' }}
                                    paddingY={1}
                                    paddingX={6}
                                    width='100%'
                                    color={(active === topic.slug) && 'blue.1'}
                                    background={(active === topic.slug) && 'gray.background'}
                                    borderRadius={8}
                                    onClick={onClose}
                                  >
                                    {topic.title}
                                  </Link>
                                </NextLink>
                              ))}
                            </VStack>
                          )}
                        </>
                      ))}
                    </VStack>
                  </DrawerBody>

                  <DrawerFooter>
                    <Button
                      onClick={onClose}
                      background="transparent"
                      borderColor='blue.1'
                      borderWidth={2}
                      textColor="blue.1"
                      borderRadius={6}
                      _hover={{ background: 'gray.background' }}
                    >
                      Close
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
              <Text fontWeight='bold' textColor='gray.dark'>
                {category}
              </Text>
              {children}
            </Flex>
          ) : (
            <Flex flexGrow={1} paddingY={10}>
              <VStack align='flex-start' padding={2} width={350} minHeight='100vh' overflowY='auto'>
                {docV3Menu.map((item, i) => (
                  <>
                    <NextLink key={`${item.path}-${i}`} href={`/${item.path}/${item.topics[0].slug}`} passHref>
                      <Link
                        _hover={{ color: 'blue.1', background: 'gray.background' }}
                        paddingY={1}
                        paddingX={6}
                        width='100%'
                        borderRadius={8}
                        fontWeight='bold'
                      >
                        {item.category}
                      </Link>
                    </NextLink>
                    {router.pathname.includes(item.path) && (
                      <VStack align='flex-start' paddingLeft={4} width='100%'>
                        {item.topics.map(topic => (
                          <NextLink key={`${topic.slug}`} href={`/${item.path}/${topic.slug}`} passHref>
                            <Link
                              _hover={{ color: 'blue.1', background: 'gray.background' }}
                              paddingY={1}
                              paddingX={6}
                              width='100%'
                              color={(active === topic.slug) && 'blue.1'}
                              background={(active === topic.slug) && 'gray.background'}
                              borderRadius={8}
                            >
                              {topic.title}
                            </Link>
                          </NextLink>
                        ))}
                      </VStack>
                    )}
                  </>
                ))}
              </VStack>
              <Flex justify='flex-start' flexGrow={1} paddingX={4}>{children}</Flex>
            </Flex>
          )}
        </>
      ) : (
        <Flex flexGrow={1} />
      )}
      <DocFooter />
    </Flex>
  );
}