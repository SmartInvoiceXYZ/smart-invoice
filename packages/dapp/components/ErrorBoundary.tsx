import React from 'react';

import { Flex, Text } from '@chakra-ui/react';

import { logError } from '../utils/helpers';

export class ErrorBoundary extends React.Component {
  // eslint-disable-next-line react/static-property-placement
  props: any;

  // eslint-disable-next-line react/state-in-constructor
  state: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    if (error) {
      return { hasError: true };
    }
    return { hasError: false };
  }

  componentDidCatch(error: any, errorInfo: any) {
    logError({ error, errorInfo });
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;
    if (hasError) {
      return (
        <Flex
          justify="center"
          align="center"
          direction="column"
          w="100%"
          minH="100vh"
          background="#F5F6F8"
          color="blue.1"
        >
          <Text fontSize="lg"> Something went wrong </Text>

          <Text> Please check console for errors </Text>
        </Flex>
      );
    }

    return children;
  }
}
