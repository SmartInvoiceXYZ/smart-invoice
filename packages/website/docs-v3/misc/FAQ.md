---
title: FAQ
---

### Does Smart Invoice have access to my funds?

No. Each invoice created with Smart Invoice configures a custom smart contract that is only linked to the wallet addresses of the contractor, client, and arbitrator. 

No one else besides these 3 parties can interact with the invoice in any way.

This means the Smart Invoice team cannot edit, modify, fix, or delete the invoices you create. If funds are sent to the wrong address, we cannot help you.


### Is KYC required?

No. You do not need to share your personal identity to use Smart Invoice.


### Is there a minimum / maximum invoice amount?

There are no maximum or minimum amount or milestone restrictions when creating an invoice.

For very large projects, you can add as many milestones and payments as you like either during or after invoice creation.  

While differing network fees will change the considerations for a rational minimum invoice amount, invoices can be created with very small amounts and will work exactly the same.

### I don’t see a specific token listed, why?

If you don’t see a supported token listed in the drop down menu, you may be connected to the wrong Network. 

Check your wallet to ensure you are connected to the proper network for your preferred token, and then refresh your browser. 

This will reset your invoice to the beginning and you will need to start over, but you should see your preferred token in the drop down menu now.


### Does Smart Invoice allow payment methods besides cryptocurrency?

No. Smart Invoice is cryptocurrency specific. 


### How much does Smart Invoice cost?

Smart Invoice is a free tool. We do not charge any fee to use it.

However, you will need to pay gas fees to transact on the blockchain. Your preferred wallet will display the fees to process a transaction. 

If you dispute a payment and it goes to arbitration, there will be a fee that goes to the arbitrator to resolve the dispute. This is currently set at 5% of the disputed funds for Kleros - however, you can modify this amount if you choose a custom arbitrator.


### Can I put my logo on these invoices?

At the moment it is not possible to customize invoices with custom branding. 

### Can I use non-Ethereum wallet addresses?

No. Smart Invoice only supports ERC-20 tokens. If your wallet address doesn’t support those, don’t use it with Smart Invoice.

### What blockchains does Smart Invoice support?

Smart Invoice supports Ethereum Mainnet, Gnosis, Polygon, Arbitrum, Optimism, Base, Holesky, and Sepolia Testnet.


### Does Smart Invoice work with Bitcoin (BTC)?

No. Smart Invoice is NOT configured to accept BTC payments. If a client sends a BTC payment to the wallet address listed on an invoice, those funds will be lost forever.


### Can I sync my invoices with any accounting tools?

No. Smart Invoice is a standalone tool and does not currently integrate with any accounting software.

However, you are able to download PDFs of each invoice.


### MetaMask security and best practices

**Password, seed phrases, private keys**

Never, ever, ever, ever reveal your private key or seed phrase to anyone! Do not store it on your computer, device or in an email. Print it out and store it in a secure location. Your private key is functionally your identity to a blockchain. If you lose control of your private key or seed phrase your funds will be irrevocably lost. 

No support service will ever ask you for either of these. If they do, it’s a scam.

Do not use a browser extension wallet on a shared computer and use a unique password to access your wallet.

**Hot and Cold Wallets**
‘Hot’ wallets, such as Metamask, are connected to the internet. While the most convenient they are also the most vulnerable to security breaches.

‘Cold’ wallets, such as Ledger, are not connected to the internet, unless you connect them physically while you are performing a transaction. While much more secure, they are more inconvenient to use.

If you have any significant amount of crypto, consider having at least two wallets. One hot wallet with a small amount of crypto to interact with dApps and the ecosystem, and a second hot or cold (preferably cold if your funds are very significant) wallet that holds the majority of your funds.

**Contract Interaction**

Interacting with smart contracts is an elemental part of the blockchain ecosystem.

However, new, and even veteran users, are not often aware of what they are explicitly allowing the contract to do with their funds and wallets.

The below screenshot is from connecting to a web3 site. Read what permissions you are giving to the site with your connection.

<img src="/screenshots/smart-invoice-mm-security-1.png" />

Likewise when signing a transaction, the wallet will tell you exactly what function you are interacting with on the contract.

<img src="/screenshots/smart-invoice-mm-security-2.png" />

However, even at this level, there are attack vectors for unsuspecting users. Your wallet that interacts the most with the ecosystem should hold only enough crypto for transaction fees.

 Contract interaction: Token Allowances

If you interact with an exchange or bridge, you will often need to sign a token approval/allowance transaction to allow the smart contract access to your funds. While this is a necessary step for the contract to work with your funds, the typical token approval limit is the maximum amount of tokens in your wallet. Which essentially means the contract could spend every token in your wallet if you grant that allowance to a malicious actor. 

If you only interact with vetted exchanges and bridges, you eliminate almost all of the risk from this attack vector.

To see all the contract allowances your wallet has granted visit https://revoke.cash/ and connect your wallet. Once connected, you will see all token allowances and can rescind them from the same page. 

Revoke.cash is Gitcoin funded, open-source, and professionally audited.

Tip: Rescind all token permissions on your wallet with some regularity i.e. once a month. 



### How to add an ERC-20 token to your wallet

Given that Metamask is by far the most popular wallet in use, we will be using Metamask for all our examples. The concepts below hold true for all wallets, although the UI will change slightly from wallet to wallet. 

**Adding Common Tokens on Ethereum Mainnet**
Metamask makes it very simple to add common ERC-20 tokens on mainnet.

Make sure you are connected to Ethereum Mainnet.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-1.png" />

Click on the assets tab. Scroll down and select ‘Import Tokens’.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-2.png" />

Type in the token symbol for the token you want to add. Click on the desired token, then click Next.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-3.png" />

Click ‘Import Tokens’.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-4.png" />

Your selected token will now appear under the Assets tab.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-5.png" />

Importing tokens on other networks (xDai, Rinkeby, etc…)

For every other network you will need to add new tokens manually. 

In this example we will be adding WXDAI to our wallet on the Gnosis chain.

1) Navigate to the block explorer for Gnosis: https://blockscout.com/xdai/mainnet

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-6.png" />

2) Type in WXDAI in the search bar. Click on the result below: Wrapped XDAI.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-7.png" />

3) Copy the token contract address: 0xe91d153e0b41518a2ce8dd3d7944fa863463a97d

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-8.png" />

5) Open Metamask. Confirm you are on the Gnosis chain. 

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-9.png" />

6) Click on the Assets tab and scroll down to Import Tokens.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-10.png" />

7) Enter the required information. 

Paste the token contract address you copied from the block explorer into ‘Token Contract Address’. 


The token symbol (WXDAI) should automatically appear. Type it in if it does not.

Enter 18 for ‘Token Decimal’. All tokens added with Smart Invoice will use 18 decimals. 

Click ‘Add Custom Token’ after all information is added.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-10.png" />

8) Click ‘Import Tokens’.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-11.png" />

9) You now have access to your WXDAI in Metamask.

<img src="/screenshots/smart-invoice-add-erc20-token-to-wallet-12.png" />


### What is the safety valve date?

The Safety Valve is a built-in function that allows the client to withdraw funds from the funded escrow.

In the event the contractor is unresponsive or bails on the project, the Safety Valve prevents the client from losing the funds already deposited into the escrow or relying on an arbitrator to release them. 

Once the selected Safety Valve Date is passed, the client can withdraw the funds out of the escrow and back into their own wallet. 


### What’s the difference between my wallet address and the invoice escrow address?

Your wallet address is the address in which you will transact with Smart Invoice. It’s how invoices are created, escrow is funded, milestones payments are released, and disputes are initiated. 

For the client, they use their wallet address to send funds to the invoice escrow address.

For the contractor, milestone payments are released from the invoice escrow address to their wallet address.


### How private are my invoice transactions?

Transactions on the blockchain are public for anyone to see. 

Your transactions with Smart Invoice are no different. Your wallet address, balance, client’s wallet address, payment history, and payment amount are all visible to anyone that looks.

Additionally, all invoice data is stored publicly on IPFS and can be viewed by anyone. If you have privacy concerns, we recommend encrypting or adding permissions to your project agreement document before linking to it in the invoice. 
