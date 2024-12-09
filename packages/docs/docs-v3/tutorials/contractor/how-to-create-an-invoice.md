---
title: How to create an invoice
---

Once your wallet is connected to Smart Invoice, click the “Create Invoice” button.

<img src="/screenshots/smart-invoice-welcome-screen.png" />

This will open the multi-step form to create the invoice.

<img src="/screenshots/smart-invoice-create-invoice-step1.png" />

In Step 1, you will need to add the project details for this invoice.

**Project Name or ID:**
Choose something easily identifiable by you & your client. This is how the invoice will appear on your sortable invoices list later.

**Link to Project Agreement:**
This agreement will be referenced if there is a payment dispute that goes to arbitration. Link a file that cannot be modified. This data will be stored publicly on IPFS and can be viewed by anyone. If you have privacy concerns, we recommend adding permissions to this agreement so it’s encrypted and only you and your client can view it.

**Project Description:**
This brief description will help you and your client remember key project details in the future.

**Project Start Date:**
This is the date you expect to begin work on this project.

**Expected End Date:**
This is the date you expect to complete work on this project.

**Safety Valve Date:**
If you do not complete this project by this date, your client can withdraw deposited funds in escrow after 00:00:00 GMT on this date. (Add extra time after the expected end date, in case things take longer to complete).

<img src="/screenshots/smart-invoice-create-invoice-step2.png" />

In Step 2, you will add your payment details for the invoice.

**Client Address:**
This is the wallet address your client uses to access the invoice, pay with, & release escrow funds with. It’s essential your client has control of this address. (Only use a multisig wallet if the client has followed these instructions). You will need to request this wallet address from your client directly. Then paste it here.

**Service Provider Address:**
This is your wallet address. It’s how you access this invoice & where you’ll receive funds released from escrow. It’s essential you have control of this address. (Only use a multisig wallet if you understand the process listed here).

**Total Payment Due:**
This is the total payment for the entire invoice. This number is not based on fiat, but rather the number of tokens you’ll receive in your chosen cryptocurrency. (e.g. 7.25 WETH, 100 USDC, etc).

**Payment Token:**
This is the cryptocurrency you’ll receive payment in. The network your wallet is connected to determines which tokens display here. (If you change your wallet network now, you’ll be forced to start the invoice over).

**Number of Payments:**
How many milestone payments will there be for this invoice? (You’ll be able to customize the payment amount for each milestone later). It’s a good idea to have smaller milestones to complete so that you can maintain cash flow throughout your project, and avoid scope creep.

**Arbitration Provider:**
This arbitrator will be used in case of dispute. LexDAO is recommended, but you may include the wallet address of your preferred arbitrator. 

**Potential Dispute Fee:**
If a disputed milestone payment goes to arbitration, 5% of that milestone’s escrowed funds are automatically deducted as an arbitration fee to resolve the dispute.

**Tickbox:**
If using LexDAO for arbitration, you will need to tick the box to accept their terms of service.

<img src="/screenshots/smart-invoice-create-invoice-step3.png" />

In Step 3, you will list out the payment amount for each milestone.

If you need to add or remove payment milestones, click the back arrow at the top of the form to go back to the previous step and modify the “Number of Payments”.

The total amount between these milestones must add up to the “Total Payment Due” in Step 2.

<img src="/screenshots/smart-invoice-create-invoice-step4.png" />

In Step 4, you will create your invoice.

Review the details of the invoice to ensure everything is correct. 

If you find any errors, go back to the previous steps and make the necessary modifications.

When you are ready to create the invoice, click the “Create Invoice” button.

<img src="/screenshots/create-your-invoice-3.png" />

A prompt will appear from your wallet (MetaMask or WalletConnect).

Review the details and then click the “Confirm” button to finalize creation of your invoice on-chain. There will be a small gas fee to sign this transaction and complete the invoice.

<img src="/screenshots/smart-invoice-registration-received-2.png" />

Within a few minutes the invoice will be created and registered by the system. 

You can view the on-chain transaction by clicking the provided link.

Smart Invoice will display Invoice ID and a link to view it. 

Copy this link and give it to your client. That is where they will be able to deposit funds.
