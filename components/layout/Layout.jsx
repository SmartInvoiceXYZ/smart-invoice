import { Box, Flex } from '@chakra-ui/react';
import Head from 'next/head';
import Script from 'next/script';
import React from 'react';

import { Footer } from './Footer';
import { NavBar } from './NavBar';

export function Layout({ children, metatags, title }) {
  return (
    <Flex direction="column" minHeight="100vh">
      <Head>
        <meta charSet="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>{title}</title>
        {metatags}
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
      <Box flexGrow={1}>{children}</Box>
      <Footer />
    </Flex>
  );
}
