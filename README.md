# Smart Invoice

Smart Invoice is an easy-to-use tool that empowers web3 freelancers with secure cryptocurrency invoicing, escrow services, and arbitration. Designed to streamline the payment process, Smart Invoice ensures that freelancers and clients can transact with confidence, knowing that funds are securely held in escrow until work is completed to satisfaction.

## Features

- **Cryptocurrency Invoicing:** Generate and send invoices directly in cryptocurrency, simplifying payments across borders.
- **Escrow Services:** Funds are held securely in a smart contract until the agreed-upon work is completed.
- **Arbitration:** In case of disputes, Smart Invoice provides an arbitration mechanism to ensure fair resolution.

## Repository Structure

This project is organized as a pnpm monorepo, containing several packages to handle different aspects of the Smart Invoice protocol. Below is an overview of the key packages:

- **constants:** Unified source for configs and constants used across the Smart Invoice protocol. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/constants)
- **contracts:** Contains the smart contracts and contract interaction utilities that power Smart Invoice.
- **dapp:** The decentralized application that provides the user interface for interacting with Smart Invoice.
- **docs:** Documentation for the Smart Invoice protocol, including guides, API references, and usage instructions.
- **forms:** Reusable form components for collecting and validating user input in the Smart Invoice dapp. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/forms)
- **graphql:** GraphQL helpers and schema for querying and interacting with Smart Invoice data. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/graphql)
- **hooks:** A collection of React hooks for accessing and manipulating Smart Invoice states and effects. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/hooks)
- **shared:** Common utilities and components shared across multiple packages in the Smart Invoice ecosystem. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/shared)
- **subgraph:** Subgraph for indexing and querying Smart Invoice events and data from the blockchain.
- **types:** TypeScript types and interfaces used across the Smart Invoice monorepo for type safety and consistency. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/types)
- **ui:** Reusable UI components for integrating Smart Invoice functionalities into web applications. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/ui)
- **utils:** A set of utility functions and helpers used throughout the Smart Invoice codebase. [npm package](https://www.npmjs.com/package/@smartinvoicexyz/utils)

## Installation

To get started with Smart Invoice, install the necessary dependencies using `pnpm`:

```bash
pnpm install
```

## Using Smart Invoice Packages

Several packages in the Smart Invoice monorepo are published on npm and can be used directly in your project. Below are the installation commands for these packages:

- **constants:** Install the constants package:

  ```bash
  pnpm add @smartinvoicexyz/constants
  ```

- **graphql:** Install the GraphQL package:

  ```bash
  pnpm add @smartinvoicexyz/graphql
  ```

- **hooks:** Install the React hooks package:

  ```bash
  pnpm add @smartinvoicexyz/hooks
  ```

- **utils:** Install the utilities package:

  ```bash
  pnpm add @smartinvoicexyz/utils
  ```

- **types:** Install the TypeScript types package:

  ```bash
  pnpm add @smartinvoicexyz/types
  ```

- **forms:** Install the forms package:

  ```bash
  pnpm add @smartinvoicexyz/forms
  ```

- **ui:** Install the ui package:

  ```bash
  pnpm add @smartinvoicexyz/ui
  ```

- **shared:** Install the shared utilities and components package:
  ```bash
  pnpm add @smartinvoicexyz/shared
  ```

These packages can be integrated into your own projects to leverage the core functionalities of the Smart Invoice protocol.

## Versioning

We follow [Semantic Versioning](https://semver.org/) for all packages in the Smart Invoice monorepo. To keep versions synchronized across packages, we use `syncpack`. After making changes and updating versions in `package.json`, you can ensure consistency by running:

```bash
pnpx syncpack fix-mismatches
```

This command checks for version mismatches and updates them across the monorepo to maintain alignment.

## Metadata Schema Standard

All metadata uploaded to IPFS and saved as details in a Smart Invoice contract must adhere to the following schema:

```js
{
  projectName: "Project Name",
  projectDescription: "Description of the project",
  projectAgreement: [{
    type: "https", // or "ipfs"
    src: "https://urlToAgreement.com",
    createdAt: "seconds since epoch"
  }],
  startDate: UNIX_TIMESTAMP,
  endDate: UNIX_TIMESTAMP
}
```

- **projectName:** The name of the project.
- **projectDescription:** A brief description of the project.
- **projectAgreement:** An array of agreements related to the project, each with a `type` and `src` that must match exactly.
- **startDate:** The project start date, represented as a UNIX timestamp.
- **endDate:** The project end date, represented as a UNIX timestamp.

## Community

Join our community on [Discord](https://discord.com/invite/Rws3gEu8W7) for support, discussions, and updates about Smart Invoice.
