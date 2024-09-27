# Smart Invoice Docs

The Smart Invoice Docs package is a documentation site built with Docusaurus. It provides detailed guides, API references, and user instructions for the Smart Invoice protocol, helping developers and users understand and interact with the platform effectively.

## Installation

To set up the Smart Invoice documentation site locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/SmartInvoiceXYZ/smart-invoice.git
   cd smart-invoice/packages/docs
   ```

2. Install the dependencies:
   ```bash
   pnpm install
   ```

## Development

To start the documentation site locally, run:

```bash
pnpm start
```

This command starts the Docusaurus development server on `http://localhost:3000` and watches for file changes.

## Building for Production

To build the documentation site for production, run:

```bash
pnpm build
```

This command generates an optimized static site in the `build` directory, ready to be deployed.

## Deployment

To deploy the documentation site, use the following command:

```bash
pnpm deploy
```

This command builds the site and deploys it according to the configuration set in Docusaurus.

## Cleaning Up

To clear the Docusaurus cache and artifacts, run:

```bash
pnpm clear
```

## Customization

Docusaurus provides a `swizzle` command to customize components and themes. To use it:

```bash
pnpm swizzle
```

This command allows you to extend or override the default components to better fit your needs.
