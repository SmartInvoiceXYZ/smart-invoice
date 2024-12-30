---
title: How to verify client's wallet address
---

Please take all precautions before creating an invoice to double check that all information (**especially** client, provider and arbitrator addresses) is accurate. After the invoice is created this information cannot be changed. The only addresses able to interact with the invoice once it is on-chain will be the client, provider and, to a more limited extent, the arbitrator.

Client address verification is a safety feature to ensure extraneous funds are not lost to the contract.  

Before any deposits are allowed from any address except the client address, the client address must verify that they have access to that address by sending an extremely small on-chain transaction.

Before the client has verified their address, all other addresses will be unable to deposit on the invoice page:

<img src="/screenshots/smart-invoice-verfiy-client-wallet-address-1.png" />

If you are the client, you must follow these steps to enable non-client deposits:

1) Make sure you are using your client address and navigate to the invoice page. 

2) Click on ‘Enable Non-Client Account Deposits’.

<img src="/screenshots/smart-invoice-verfiy-client-wallet-address-2.png" />

3) You will be prompted to sign a transaction from your wallet provider. The verify transaction uses the smallest possible amount of gas, so the transaction cost will be extremely small.  

If you have successfully signed the transaction you will see the enable button change to a spinner:

<img src="/screenshots/smart-invoice-verfiy-client-wallet-address-3.png" />

4) Once the transaction is confirmed on-chain, ‘Not Enabled’ will update to ‘Enabled!’. Non-client accounts can now deposit to the invoice contract.

<img src="/screenshots/smart-invoice-verfiy-client-wallet-address-4.png" />
