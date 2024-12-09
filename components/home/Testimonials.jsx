import {
  Box,
  Flex,
  Heading,
  HStack,
  Slide,
  Text,
  useInterval,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import React, { useState } from 'react';

import quoteIcon from '../../public/quote-icon.svg';

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const testimonials = [
    {
      id: 1,
      quote:
        "Super smooth, great UI. The most straightforward escrow.",
      name: 'MadFinance team',
      title: '',
      company: '',
    },
    {
      id: 2,
      quote: "This changes everything!",
      name: '0xhanvalen',
      title: 'Freelance Developer',
      company: '',
    },
    {
      id: 3,
      quote: "We're forking this!",
      name: 'Based Ghouls Dev Team',
      title: '',
      company: ''
    },
    {
      id: 4,
      quote: "That time we really got f***ed we forgot to use Smart Invoice.",
      name: 'Ξ2T',
      title: '',
      company: '',
    }
  ];

  useInterval(toggleInterval, 5000);

  function toggleInterval() {
    if (index + 1 < testimonials.length) {
      setIndex(index + 1);
    } else {
      setIndex(0);
    }
  }

  return (
    <Flex
      direction="column"
      background="blue.dark"
      justify="center"
      align="center"
      padding={8}
    >
      {testimonials.map((t, i) => (
        <Slide
          key={t.id}
          in={i === index}
          direction="left"
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: '700px',
          }}
        >
          <Flex
            display={i === index ? 'flex' : 'none'}
            direction="column"
            align="center"
            justify="center"
            textColor="white"
            textAlign="center"
            height={400}
            width="100%"
            maxWidth={700}
            paddingY={6}
          >
            <NextImage src={quoteIcon} width={41} height={33} />
            <Heading textColor="white" size='2xl' fontWeight={700} mt={10}>
              {t.quote}
            </Heading>
            <Box textAlign="center" mt={10}>
              <Text fontWeight={700} fontSize={18}>
                {t.name}
              </Text>
              {(t.title && t.company) && (
                <Text fontSize={16}>
                  {t.title}, {t.company}
                </Text>
              )}
              {(t.title && !t.company) && (
                <Text fontSize={16}>
                  {t.title}
                </Text>
              )}
              {(!t.title && t.company) && (
                <Text fontSize={16}>
                  {t.company}
                </Text>
              )}
            </Box>
          </Flex>
        </Slide>
      ))}
      <HStack gap={0.1} mt={6}>
        {testimonials.map((t, i) => (
          <Box
            key={t.id}
            height={1}
            width={10}
            borderRadius={5}
            background={i === index ? 'blue.1' : 'white'}
            onClick={() => setIndex(i)}
          />
        ))}
      </HStack>
    </Flex>
  );
}
