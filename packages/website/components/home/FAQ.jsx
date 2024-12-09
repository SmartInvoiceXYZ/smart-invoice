import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Heading,
  Link,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';

export function FAQSection() {
  return (
    <Flex paddingY={20} paddingX={8} direction="column" align="center" overflowX='hidden'>
      <Heading fontSize={40} textAlign="center">
        Frequently asked questions
      </Heading>
      <Accordion allowToggle maxWidth={600} width='100%' mt={10}>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>Can I accept credit card payments and ACH transfers?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            No. Smart Invoice is cryptocurrency specific.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>What cryptocurrencies can I accept payment with?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            <Text mb={2}>
              Smart Invoice supports Ethereum Mainnet, Gnosis Chain, Rinkeby Testnet.
            </Text>
            <Text>
              17 tokens are currently available including USDT, USDC, WETH, and DAI. View the full list <Link textColor="blue.1" href='https://help.smartinvoice.xyz/article/30-what-cryptocurrencies-does-smart-invoice-support' target="_blank" isExternal>here</Link>.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>Can I accept Bitcoin (BTC) payments?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            No. Smart Invoice is NOT configured to accept BTC payments. If your client sends a BTC payment to the wallet address listed on your invoice, those funds will be lost forever.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>Is this software really free?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            Yes! Smart Invoice doesn’t charge any fees for you to use it. There’s no trials, subscriptions, or hidden fees. 
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>Do you have your own token?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            Nope. Smart Invoice is a free public goods tool and doesn’t require any tokens to use. 
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>How do you make money?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            We don’t. Smart Invoice is a public good tool and its development has been funded through web3 grants and donations.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>Why are you doing this for free?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            <Text mb={2}>
              To improve the overall freelance experience in web3, for both freelancers and their clients.
            </Text>
            <Text mb={2}>
              To minimize the risk of hiring a web3 freelancer online.
            </Text>
            <Text mb={2}>
              To have a safe and credible way to handle disputes without the burden of a formal written contract with an attorney and litigation.
            </Text>
            <Text>
              To provide a trusted, common solution for the greater freelancer community around the world.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>Do I need to install any software?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            No. Smart Invoice is a web-based app. You just need a browser and an internet connection. 
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>How do I create an account?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            <Text mb={2}>
              Smart Invoice is a web3 application, which means you don’t actually create an account with an email address like you would with credit card invoicing tools. 
            </Text>
            <Text>
              To use Smart Invoice, you simply connect your cryptocurrency wallet to the site and you are logged in. Super easy and safe. 
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>How private are my transactions?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            <Text mb={2}>
              Transactions on the blockchain are public for anyone to see. 
            </Text>
            <Text mb={2}>
              Your transactions with Smart Invoice are no different. Your wallet address, balance, client’s wallet address, payment history, and payment amount are all visible to anyone that looks.
            </Text>
            <Text>
              Additionally, all invoice data is stored publicly on IPFS and can be viewed by anyone. If you have privacy concerns, we recommend encrypting or adding permissions to your project agreement document before linking to it in the invoice. 
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>How does arbitrations work?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            <Text mb={2}>
              If there is a dispute, you or your client can “lock” funds held by that invoice. This lock triggers the arbitration provider (LexDAO, or the custom provider you chose) to review and resolve the dispute. 
            </Text>
            <Text>
              Based on the arbitrator’s review, they will determine who should receive funds and will send a transaction to Smart Invoice that transfers those funds to you or your client. Our recommended arbitrator, LexDAO, currently charges a 5% fee that is automatically deducted from the funded milestone for their arbitration services.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          border="1px solid #C2CFE0"
          borderRadius={10}
          padding={2}
          mb={2}
        >
          <AccordionButton
            display="flex"
            justifyContent="space-between"
            textColor="gray.dark"
            fontSize={18}
            fontWeight={700}
            borderRadius={10}
            textAlign='left'
          >
            <Text>Do you provide support if I need help?</Text>
            <AccordionIcon color="blue.1" />
          </AccordionButton>
          <AccordionPanel>
            Yes. Please view our FAQ and Documentation here first. If you still need help, you can post a message in the <NextLink href='https://docs.smartinvoice.xyz/'>product support channel</NextLink> in the RaidGuild Discord (RaidGuild is the DAO that operates Smart Invoice). Our team usually responds within a few hours, Monday through Friday.
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Flex>
  );
}
