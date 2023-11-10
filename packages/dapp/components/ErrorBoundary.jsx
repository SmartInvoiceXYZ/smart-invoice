import { Flex, Text } from '@chakra-ui/react';
import React from 'react';

import { logError } from '../utils/helpers';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    if (error) {
      return { hasError: true };
    }
    return { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
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
