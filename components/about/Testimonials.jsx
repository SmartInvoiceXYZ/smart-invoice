import { Box, Flex, Heading, Text, Button, Grid, GridItem } from "@chakra-ui/react"
import NextLink from 'next/link'
import NextImage from 'next/image'

import quoteIcon from '../../public/quote-icon.svg';

export function Testimonials({...props}) {
  const testimonials = [
    {
      id: 1,
      quote:
        "This is the best invoicing tool we've ever used to accept crypto payments. It rocks!",
      name: 'John Smith',
      title: 'Title',
      company: 'Company',
    },
    {
      id: 2,
      quote: 'Another testimonial statement.',
      name: 'Jane Doe',
      title: 'Title',
      company: 'Company',
    },
    {
      id: 3,
      quote: 'Hello world!',
      name: 'Joe Jones',
      title: 'Title',
      company: 'Company',
    },
  ];

  return (
    <Box background='gray.background' padding={20}>
      <Flex direction='column' width='100%' gap={10} {...props}>
        <Flex justify="space-between" align="end">
          <Box maxWidth={700}>
            <Heading mb={2}>What web3 freelancers are saying</Heading>
            <Text>
              Here’s what a few freelancers have to say about Smart Invoice and their experience.
            </Text>
          </Box>
          <NextLink href="https://app.smartinvoice.xzy">
            <Button background="blue.1">Open dApp</Button>
          </NextLink>
        </Flex>
        <Grid gridTemplateColumns='repeat(auto-fit, minmax(250px, 1fr))' gap={6}>
          {testimonials.map(item => (
            <GridItem
              key={item.id}
              display='flex'
              flexDir='column'
              justifyContent='space-between'
              background='white'
              borderRadius={20}
              padding={10}
              minHeight={400}
            >
              <Box>
                <NextImage src={quoteIcon} width={31} height={25} />
                <Text mt={8} fontSize={24}>{item.quote}</Text>
              </Box>
              <Box justifySelf='end'>
                <Text fontWeight={700} fontSize={18}>{item.name}</Text>
                <Text fontSize={14}>{item.title}</Text>
              </Box>
            </GridItem>
          ))}
        </Grid>
      </Flex>
    </Box>
  )
}