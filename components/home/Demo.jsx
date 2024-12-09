import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import NextImage from 'next/image';
import React, { useEffect, useState } from 'react';

import imgConnectWallet from '../../public/product/si-connect-wallet-mockup.png'
import imgCreateInvoice from '../../public/product/si-create-invoice-mockup.png'
import imgDepositFunds from '../../public/product/si-deposit-funds-mockup.png'
import imgFunds from '../../public/product/si-funds-smart-contract-mockup.png'
import imgReceive from '../../public/product/si-receive-funds-mockup.png'
import imgRelease from '../../public/product/si-release-funds-mockup.png'
import imgArbitration from '../../public/product/si-request-arbitration-mockup.png'

export function DemoSection({ ...props }) {
  const [flexDirection, setFlexDirection] = useState('row')
  const [active, setActive] = useState(0)

  const demoItems = [
    {
      title: 'Connect your wallet',
      description: 'No email signup needed. Just connect your crypto wallet and Smart Invoice is ready to use.',
      img: imgConnectWallet
    },
    {
      title: 'Create your invoice',
      description: 'Follow the prompts to quickly create a new invoice with one or more project milestones.',
      img: imgCreateInvoice
    },
    {
      title: 'Client deposits funds',
      description: 'Share the invoice with your client so they can fund one or more milestones.',
      img: imgDepositFunds
    },
    {
      title: 'Funds held in smart contracts',
      description: 'Once your client has sent payment, those funds are held in the smart contract linked to your invoice.',
      img: imgFunds
    },
    {
      title: 'Client releases funds',
      description: "When you complete a milestone, ask your client to release that milestone’s funds to you. Also ask your client to fund the next milestone so you can continue work.",
      img: imgRelease
    },
    {
      title: 'Receive funds',
      description: "Within a few minutes, released funds will be automatically sent to your wallet address.",
      img: imgReceive
    },
    {
      title: "Request arbitration (optional)",
      description: "In the event of a dispute, you or your client can lock funds in Smart Invoice and a submission will automatically be made to a 3rd party arbitrator to help resolve the dispute.",
      img: imgArbitration
    }
  ]

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

  return (
    <Flex justify="center" align="center" overflowX='hidden'>
      <Box paddingY={20} paddingX={8} width="100%" {...props}>
        <Flex direction={flexDirection} justify="space-between" align={flexDirection === 'column' ? 'center' : 'end'} gap={6}>
          <Box maxWidth={700} textAlign={flexDirection === 'column' ? 'center' : 'left'}>
            <Heading mb={2}>Designed for all freelancers</Heading>
            <Text>
              Smart Invoice was created to be a simple and secure tool that
              freelancers in all fields could easily use, regardless of project
              size. You don’t have to be a developer or “technical.”
            </Text>
          </Box>
          <NextLink href="https://app.smartinvoice.xyz" target="_blank" passHref>
            <a target="_blank">
              <Button background="blue.1" minW={'fit-content'} _hover={{ background: 'blue.hover.1' }}>
                Open dApp
              </Button>
            </a>
          </NextLink>
        </Flex>
        <Divider background="blue.1" mt={8} mb={8} />
        <Flex direction={flexDirection === 'column' ? 'column-reverse' : 'row'} justify="space-between" align={flexDirection === 'column' && 'center'} gap={10}>
          <Accordion width={flexDirection === 'column' ? '100%' : 380} textColor="white" defaultIndex={0}>
            {demoItems.map((item, i) => (
              <AccordionItem mb={2} key={i} border="none">
                <AccordionButton
                  fontWeight={700}
                  fontSize={18}
                  paddingX={8}
                  paddingY={4}
                  textColor="gray.dark"
                  borderRadius={10}
                  borderWidth="1px"
                  borderColor="#C2CFE0"
                  _expanded={{
                    background: 'blue.dark',
                    color: 'white',
                    borderBottomRadius: 0,
                    borderColor: "transparent"
                  }}
                  onClick={() => setActive(i)}
                >
                  {item.title}
                </AccordionButton>
                <AccordionPanel
                  paddingX={8}
                  paddingTop={0}
                  background="blue.dark"
                  borderBottomRadius={10}
                >
                  {item.description}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Image */}
          <NextImage src={demoItems[active].img} width={800} height={643.55} />
        </Flex>
      </Box>
    </Flex>
  );
}
