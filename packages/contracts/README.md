# @smartinvoicexyz/contracts

Solidity smart contracts of the Smart Invoice protocol - a comprehensive escrow system with milestone-based payments, arbitration, and DAO integration.

## Overview

Smart Invoice is a decentralized escrow protocol that enables secure milestone-based payments between clients and providers. The protocol integrates with Gnosis Safe for multi-signature capabilities, 0xSplits for revenue distribution, and Kleros for decentralized arbitration.

## Architecture

### Core Contracts

- **SmartInvoiceEscrow** - Main escrow contract with milestone payments, dispute resolution, and fee handling
- **SmartInvoiceFactory** - Factory for deploying escrow instances with versioning support
- **SpoilsManager** - Manages fee distribution and receiver configurations
- **SpoilsManagerFactory** - Factory for deploying SpoilsManager instances

### Zap Contracts

- **SafeSplitsEscrowZap** - One-transaction deployment of Safe + 0xSplits + Escrow
- **SafeSplitsDaoEscrowZap** - Extended zap with DAO fee distribution
- **SafeSplitsEscrowZapFactory** - Factory for deploying zap instances

## Features

### Escrow Functionality

- ✅ Milestone-based payment releases
- ✅ Configurable termination times
- ✅ Individual and arbitrator dispute resolution
- ✅ Fee collection and treasury integration
- ✅ Support for any ERC20 token + ETH
- ✅ Client/provider address updates
- ✅ Evidence submission for disputes

### Integration Capabilities

- ✅ Gnosis Safe integration for multi-sig control
- ✅ 0xSplits integration for revenue distribution
- ✅ Kleros arbitration support (ERC-792/ERC-1497)
- ✅ DAO fee splitting with SpoilsManager
- ✅ Deterministic address deployment (CREATE2)

### Security Features

- ✅ Reentrancy protection
- ✅ Access control with role-based permissions
- ✅ Comprehensive input validation
- ✅ Upgrade-safe initializer patterns
- ✅ Emergency withdrawal mechanisms

## Supported Networks

| Network          | Chain ID | Status      |
| ---------------- | -------- | ----------- |
| Ethereum Mainnet | 1        | ✅ Deployed |
| Arbitrum One     | 42161    | ✅ Deployed |
| Polygon          | 137      | ✅ Deployed |
| Gnosis Chain     | 100      | ✅ Deployed |
| Optimism         | 10       | ✅ Deployed |
| Base             | 8453     | ✅ Deployed |
| Zora             | 7777777  | ✅ Deployed |

### Testnets

- Sepolia, Arbitrum Sepolia, Base Sepolia, Optimism Sepolia, Zora Sepolia, Holesky

## Development

### Prerequisites

```bash
npm install -g pnpm
```

### Installation

```bash
pnpm install
```

### Available Scripts

#### Compilation & Building

```bash
pnpm compile          # Compile contracts
pnpm build           # Compile and flatten contracts
pnpm clean           # Clean build artifacts
```

#### Testing

```bash
pnpm test                    # Run all tests
pnpm test-escrow            # Test SmartInvoiceEscrow
pnpm test-factory           # Test SmartInvoiceFactory
FORK=true pnpm test-zap               # Test SafeSplitsEscrowZap
FORK=true pnpm test-dao-zap           # Test SafeSplitsDaoEscrowZap
pnpm test-spoils            # Test SpoilsManager
pnpm test-spoils-factory    # Test SpoilsManagerFactory
```

#### Code Quality

```bash
pnpm lint            # Run all linters
pnpm lint:sol        # Lint Solidity files
pnpm lint:ts         # Lint TypeScript files
pnpm format          # Format code with Prettier
pnpm typecheck       # TypeScript type checking
```

#### Coverage

```bash
pnpm coverage        # Generate coverage report
pnpm coverage:report # Serve coverage report
```

#### Deployment

```bash
pnpm deploy-factory --network <network>           # Deploy SmartInvoiceFactory
pnpm deploy-zap --network <network>              # Deploy SafeSplitsEscrowZap
pnpm deploy-spoils-manager --network <network>    # Deploy SpoilsManagerFactory
pnpm add-implementation --network <network>       # Add new implementation
pnpm verify-contract --network <network>          # Verify on block explorer
```

#### Usage Examples

```bash
pnpm create-with-zap --network <network>         # Create Safe+Split+Escrow
```

## Contract Specifications

### SmartInvoiceEscrow

The main escrow contract supporting:

- **Milestone Management**: Add milestones, release payments progressively
- **Dispute Resolution**: Individual resolvers or Kleros arbitration
- **Fee Handling**: Configurable basis points with treasury integration
- **Asset Support**: Standard ERC20 tokens and native ETH (via WETH wrapping)
- **Security**: Comprehensive access controls and reentrancy protection

#### ⚠️ Token Compatibility Warning

**IMPORTANT**: The protocol only supports standard ERC20 tokens. The following token types may break contract functionality:

- **Fee-on-transfer tokens** - Fees reduce actual received amounts
- **Rebasing tokens** - Balance changes affect milestone calculations
- **ERC777 tokens** - Hooks can cause reentrancy issues despite protections
- **Tokens with non-standard behavior** - May cause unexpected failures

Always verify token compatibility before creating escrows with non-standard tokens.

### SafeSplitsEscrowZap

One-transaction deployment of complete payment infrastructure:

1. **Gnosis Safe** - Multi-signature wallet for provider team
2. **0xSplits Split** - Revenue distribution among team members
3. **SmartInvoice Escrow** - Milestone-based payment contract

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add comprehensive tests
5. Submit a pull request

## Support

For questions and support:

- GitHub Issues: [Create an issue](https://github.com/raid-guild/smart-invoice)
- Documentation: [Smart Invoice Docs](https://docs.smartinvoice.xyz)
