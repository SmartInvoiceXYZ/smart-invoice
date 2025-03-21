import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Flex,
  HStack,
} from '@chakra-ui/react';
import { useSubgraphHealth } from '@smartinvoicexyz/hooks';
import { getChainName } from '@smartinvoicexyz/utils';
import _ from 'lodash';

export function SubgraphHealthAlert() {
  const { health, error, isLoading } = useSubgraphHealth();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching subgraph health: ', error);
  }

  if (isLoading) {
    return null;
  }

  const { erroredChainIds, notSyncedChainIds } = _.reduce(
    _.entries(health),
    (acc, [chainId, h]) => {
      if (h.hasIndexingErrors) {
        acc.erroredChainIds.push(Number(chainId));
      }
      if (!h.hasSynced) {
        acc.notSyncedChainIds.push(Number(chainId));
      }
      return acc;
    },
    {
      erroredChainIds: [] as number[],
      notSyncedChainIds: [] as number[],
    },
  );

  const hasErrors = _.some(erroredChainIds);
  const notSynced = _.some(notSyncedChainIds);

  if (!(hasErrors || notSynced)) {
    return null;
  }

  const chainIds = _.uniq([...erroredChainIds, ...notSyncedChainIds]);
  const chains = _.map(chainIds, id => getChainName(id));

  return (
    <Flex
      position="absolute"
      bottom="0"
      left="0"
      right="0"
      justifyContent="center"
      alignItems="center"
      zIndex={10}
      boxShadow="0px -2px 16px rgba(0, 0, 0, 0.05)"
    >
      <Alert status="error" flexDirection="column" textAlign="center" gap={2}>
        <HStack spacing={0}>
          <AlertIcon />
          <AlertTitle>Data Sync Issue Detected!</AlertTitle>
        </HStack>
        <AlertDescription>
          The subgraph is behind on: {chains.join(', ')}. Some data may be
          outdated or incomplete. Please try again later.
        </AlertDescription>
      </Alert>
    </Flex>
  );
}
