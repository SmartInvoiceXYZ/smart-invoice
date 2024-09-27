# Smart Invoice Subgraph

The Smart Invoice Subgraph package provides a Graph Protocol subgraph for indexing and querying Smart Invoice events on various blockchain networks. This subgraph enables efficient querying of Smart Invoice data, such as contract events, state changes, and other on-chain interactions, across supported networks.

## Installation

To set up the Smart Invoice Subgraph package locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/SmartInvoiceXYZ/smart-invoice.git
   cd smart-invoice/packages/subgraph
   ```

2. Install the dependencies:
   ```bash
   pnpm install
   ```

## Development

### Preparing and Deploying the Subgraph

To prepare the subgraph for a specific network, use the corresponding `prepare` script. After preparing, you can deploy the subgraph using the `deploy` script. The supported networks include:

- **Ethereum Mainnet**
- **Arbitrum**
- **Optimism**
- **Polygon**
- **Gnosis**
- **Base**
- **Sepolia**
- **Holesky**

#### Example: Deploying to Arbitrum

1. Prepare the subgraph for Arbitrum:

   ```bash
   pnpm prepare-arbitrum
   ```

2. Deploy the subgraph to Arbitrum:
   ```bash
   pnpm deploy-arbitrum
   ```

Replace `arbitrum` with any other supported network name to prepare and deploy to that network.

### Building the Subgraph

Before deploying, you must build the subgraph to generate the necessary artifacts:

```bash
pnpm build
```

### Local Development and Testing

To create and deploy a local instance of the subgraph for testing:

1. Create the local subgraph:

   ```bash
   pnpm create-local
   ```

2. Deploy the subgraph to your local Graph node:
   ```bash
   pnpm deploy-local
   ```

To remove the local subgraph when done:

```bash
pnpm remove-local
```

## Authentication

To authenticate with the Graph Protocol for deployments, use the `auth` script:

```bash
pnpm auth
```

Ensure that your `GRAPH_ACCESS_TOKEN` environment variable is set with the correct access token.
