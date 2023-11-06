### Testing Set-Up

1.  `npx hardhat node` will create a goerli fork

2.  `yarn deploy-local` to deploy local factory

3.  `yarn deploy-fee-manager-local` will deploy a local fee manager

4.  **YOU NEED TO COPY THIS ADDRESS INTO SmartInvoiceFeeEscrow ON LINE 128**. It will normally be `0x8787678DB688eaD8D53F8F96f33Ceeb0FD821d5a` if these deployments are first and in order.

5.  `yarn fee-escrow-add-local` to add to the contract

6.  There are separate testing files for the FeeManager itself, and the FeeEscrow
