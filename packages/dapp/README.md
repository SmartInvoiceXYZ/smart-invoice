# Smart Invoice dApp

The Smart Invoice dApp is a Next.js application that serves as the interface for the Smart Invoice protocol. It enables web3 freelancers to create and manage cryptocurrency invoices, securely hold funds in escrow, and resolve disputes through arbitration.

## Installation

To set up the Smart Invoice dApp locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/SmartInvoiceXYZ/smart-invoice.git
   cd smart-invoice/packages/dapp
   ```

2. Install the dependencies:
   ```bash
   pnpm install
   ```

## Development

To start the development server, run:

```bash
pnpm dev
```

This command starts the dApp on `http://localhost:3000` and watches for file changes.

## Building for Production

To build the application for production, run:

```bash
pnpm build
```

This command generates an optimized build in the `.next` directory.

## Running in Production

To start the dApp in production mode, first build it using the `build` command, and then run:

```bash
pnpm start
```

This will start the production server on `http://localhost:3000`.

## Testing

The dApp includes a suite of tests to ensure its reliability. You can run the tests with the following commands:

- **Run all tests:**

  ```bash
  pnpm test
  ```

- **Watch mode:**
  ```bash
  pnpm test:watch
  ```

## Linting and Formatting

To maintain code quality and consistency, the dApp includes linting and formatting tools:

- **Lint the codebase:**

  ```bash
  pnpm lint
  ```

- **Format the codebase:**
  ```bash
  pnpm format
  ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with your improvements.
