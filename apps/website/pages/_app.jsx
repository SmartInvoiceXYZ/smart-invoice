import '../styles/globals.css';

import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';

import { theme } from '../theme';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
