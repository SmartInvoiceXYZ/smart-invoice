import React, { useContext } from 'react';
import { Address, formatUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import {
  Divider,
  Flex,
  Link,
  Spacer,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { AccountLink } from '@smart-invoice/ui';
import { getDateString, getTokenInfo } from '@smart-invoice/utils';
import { ChainId } from '@smart-invoice/constants';
import { TokenData } from '@smart-invoice/types';

type FormConfirmationProps = {
  display?: boolean;
  tokenData: Record<ChainId, Record<Address, TokenData>>;
};

export function FormConfirmation({
  display,
  tokenData,
}: FormConfirmationProps) {
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  // const {
  //   projectName,
  //   projectDescription,
  //   projectAgreement,
  //   clientAddress,
  //   paymentAddress,
  //   startDate,
  //   endDate,
  //   deadline,
  //   lateFee,
  //   lateFeeInterval,
  //   paymentDue,
  //   paymentToken,
  // } = useContext(CreateContext);

  // const { decimals, symbol } = getTokenInfo(chainId, paymentToken, tokenData);

  const flexWidth = useBreakpointValue({
    base: '95%',
    sm: '95%',
    md: '80%',
    lg: '70%',
  });

  return (
    <VStack
      w="100%"
      spacing="1rem"
      color="#323C47"
      display={display ? 'flex' : 'none'}
    >
      {/* <Text
        id="project-title"
        color="#323C47"
        fontWeight="bold"
        fontSize="xl"
        align="center"
      >
        {projectName}
      </Text>

      {projectDescription && <Text align="center">{projectDescription}</Text>}

      <Link
        href={projectAgreement.src}
        isExternal
        mb="1rem"
        textDecor="underline"
      >
        {projectAgreement.src}
      </Link> */}

      <Divider />

      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Client Address: `}</Text>

        <Spacer />

        {/* <AccountLink address={clientAddress} chainId={chainId} /> */}
      </Flex>

      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Payment Address: `}</Text>

        {/* <AccountLink address={paymentAddress} chainId={chainId} /> */}
      </Flex>
      {/* {startDate && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Project Start Date: `}</Text>

          <Text textAlign="right">{getDateString(startDate / 1000)}</Text>
        </Flex>
      )}
      {endDate && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Expected End Date: `}</Text>

          <Text textAlign="right">{getDateString(endDate / 1000)}</Text>
        </Flex>
      )}
      {deadline && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Payment Deadline: `}</Text>

          <Text textAlign="right">{getDateString(deadline / 1000)}</Text>
        </Flex>
      )}
      {lateFee && lateFeeInterval ? (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Late Fee: `}</Text>

          <Text textAlign="right">
            {`${formatUnits(lateFee, decimals)} ${symbol} 
              every ${lateFeeInterval / (1000 * 60 * 60 * 24)} 
              day${lateFeeInterval / (1000 * 60 * 60 * 24) > 1 && 's'}`}
          </Text>
        </Flex>
      ) : null}

      {paymentDue ? (
        <>
          <Divider
            color="black"
            w="calc(100% + 2rem)"
            transform="translateX(-1rem)"
          />
          <Flex justify="flex-end">
            <Text color="blue.1" ml="2.5rem" fontWeight="bold">
              {`${formatUnits(paymentDue, decimals)} ${symbol} Total`}
            </Text>
          </Flex>
        </>
      ) : null} */}
    </VStack>
  );
}
