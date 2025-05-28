---
title: How to use a multisig wallet as a client
---

Using a multisig (multi-signature) wallet provides an additional layer of security in blockchain transactions.  A multisig requires more than signer to sign a transaction for the transaction to confirm. 

This mechanism provides multiple benefits:

1) If one address’s private key is compromised, a multisig ensures a hacker cannot drain the wallet of funds.
2) If the funds are mutually owned by a larger organization, a multisig ensures that one party cannot unilaterally spendl the funds in the wallet.

Smart Invoice recommends using Gnosis Safe as a time-tested, intuitive, and safe multisig wallet. For larger projects involving significant funds, a multisig adds compelling transparency and security.

Smart Invoice is configured to use Gnosis Safe as an integrated Safe app.

### Creating a multisig with Gnosis Safe:

1. Navigate to gnosis-safe.io and click ‘Open app’.

<img src="/screenshots/smart-invoice-client-multisig-1.png" />

2. Assuming you don’t already have a multisig setup, click ‘Create Safe’.

<img src="/screenshots/smart-invoice-client-multisig-2.png" />

3. Connect your wallet to Gnosis Safe. Your wallet provider will pop up on clicking ‘Connect’ and ask you to approve the account and connection.

<img src="/screenshots/smart-invoice-client-multisig-3.png" />

4. Click here to select the chain for your multisig.

<img src="/screenshots/smart-invoice-client-multisig-4.png" />

5. Select your chain. 

**PLEASE CONFIRM THIS IS THE CHAIN NETWORK AS YOUR INVOICE.**
<img src="/screenshots/smart-invoice-client-multisig-5.png" />

6. Add all the addresses of the multisig owners. Click ‘Add another owner’ to keep adding additional owners. These are the only addresses that will be able to sign transactions for the multisig. 

The first address will always be the wallet that is currently connected to Gnosis Safe.

**PLEASE CHECK AND VERIFY THAT THE OWNERS ADDRESSES ARE ACCURATE.**
<img src="/screenshots/smart-invoice-client-multisig-6.png" />

7. Select how many owners must sign the transaction for that transaction to process.

This is the essential function of the multisig so consider this option carefully.

As in most cases, security and convenience are mutually exclusive tradeoffs in using a multisig. The most common multisig setup has three owners, while requiring two of those owners to sign transactions.  The more owners a wallet has, and the more of those owners that are required to sign a transaction for that transaction to process, then the more secure that multisig will be. 

However, the more required signers then consequently the potentially slower it will be to process transactions (especially if you are using the Gnosis Apps portal to interact with Smart Invoice, which is covered below).

<img src="/screenshots/smart-invoice-client-multisig-7.png" />

8. Confirm the safe name, required number of signers, and owners addresses are correct. Click ‘Create’.

<img src="/screenshots/smart-invoice-client-multisig-8.png" />

9. Make sure to fund your multisig. Copy the multisig address here. 

Gnosis Safe automatically inserts a helper chain prefix (in this case ‘rin:’ as this safe is on the Rinkeby test network) to the address.  Make sure to delete this prefix when you paste the address into your wallet to send funds.

<img src="/screenshots/smart-invoice-client-multisig-9.png" />

### Adding Smart Invoice as a Custom App to Gnosis Safe

Gnosis Safe supports an intuitive platform for interacting with apps using your Gnosis Safe multisig. Likewise Smart Invoice is configured to use Gnosis Safe’s Apps platform. 

In order to use Smart Invoice using your multisig from within Gnosis Safe follow the below steps:

1. Choose ‘Apps’ from the sidebar of the homescreen.

<img src="/screenshots/smart-invoice-client-multisig-10.png" />

2. Click ‘Add custom app’.  Smart Invoice is in the process of becoming a trusted Safe app, and will appear in the default list after confirmation.

<img src="/screenshots/smart-invoice-client-multisig-12.png" />

3. Paste https://app.smartinvoice.xyz/ in the field for the url.  Make sure you do not copy the website address to this field (https://smartinvoice.xyz/), otherwise an error will appear (‘Failed to fetch app manifest’).

<img src="/screenshots/smart-invoice-client-multisig-13.png" />

4. After adding the Smart Invoice logo and name should automatically populate.  Click the checkbox and ‘Add’.

<img src="/screenshots/smart-invoice-client-multisig-14.png" />

5. Several screens will appear asking you to confirm you are interacting with a third party app. Click through and agree. At the end, you will Smart Invoice within a Gnosis Safe app interface. From here you can interact with Smart Invoice from your multisig.

<img src="/screenshots/smart-invoice-client-multisig-15.png" />

6. The next time you open Gnosis Safe, Smart Invoice will be saved as a custom app under the Apps header in the sidebar.

<img src="/screenshots/smart-invoice-client-multisig-16.png" />

### Interacting with Smart Invoice using a Gnosis Safe multisig as the Client

1. Navigate to the Apps tab in the sidebar on the Gnosis Safe home screen. If you followed the above steps to add Smart Invoice to Gnosis Safe, Smart Invoice will appear as a custom app. Click on it. You will get several pop ups warning you will be interacting with an outside app. 

Click through all of the pop ups and you will arrive at Smart Invoice within the Gnosis Safe wrapper.

<img src="/screenshots/smart-invoice-client-multisig-17.png" />

2. We will demonstrate making a deposit to an existing invoice using your multisig wallet.

As service providers will almost always be the ones creating the invoice, please ensure you give them your multisig address in order for your organization to pay with your Gnosis Safe Wallet and interact with Smart Invoice as the Client.

**Make sure you are signed into your wallet provider, using an owner address and on the same network as the invoice.**

Navigate to the invoice page and click ‘Deposit’. 

<img src="/screenshots/smart-invoice-client-multisig-18.png" />

3. Choose the amount you want to deposit. This amount can be a milestone amount, or any arbitrary amount of the chosen token. Click ‘Deposit’ on the pop up.

<img src="/screenshots/smart-invoice-client-multisig-19.png" />

4. Another confirmation modal will pop up, this time from Gnosis Safe. 

**If you are not signed in, using an owner address or on the same network as the invoice you will get an error.**

Click ‘Submit’.

<img src="/screenshots/smart-invoice-client-multisig-20.png" />

5. Sign the transaction in your wallet provider.

<img src="/screenshots/smart-invoice-client-multisig-21.png" />

6. **IMPORTANT NOTE: On submission the modal will appear to submit and a spinner will appear. Using a multisig, this spinner will not resolve as the required number of owners have not yet signed for the transaction to complete.**

**Everything is working normally.**

<img src="/screenshots/smart-invoice-client-multisig-22.png" />

7. Your transaction has now been placed in the transaction queue in Gnosis Safe.

From the Smart Invoice app page, a transaction queue notification will appear at the bottom of the screen. You can also reach pending transactions from the Transactions tab in the sidebar.

<img src="/screenshots/smart-invoice-client-multisig-23.png" />

8. The Transactions page will list all pending transactions. Make sure you process pending transactions in order (the ‘nonce’ is the transaction number). Gnosis Safe will alert you to this fact as well.

<img src="/screenshots/smart-invoice-client-multisig-24.png" />

9. One or more multisig owners will then need to navigate to this page and click on the next pending transaction. 
 
‘Confirmations’ will show how many more signers are needed for the transaction to process.

Click ‘Confirm’.

<img src="/screenshots/smart-invoice-client-multisig-25.png" />

10. The ‘Approve Transaction’ modal will pop up. Click ‘Submit’.

<img src="/screenshots/smart-invoice-client-multisig-26.png" />

11. Sign the transactions from your wallet provider prompt.

12. The transaction will take anywhere from a couple seconds to several minutes to process depending on the network.  

13. After the transaction completes, Gnosis Safe will display the successful transaction. This transaction can be viewed at any time in ‘History’ in the Transactions tab in the sidebar.

<img src="/screenshots/smart-invoice-client-multisig-27.png" />

14. If you navigate back to the invoice page, you will see that the Smart Invoice interface registers your deposit. 

*Note: The invoice displays ‘Partially Deposited’ as we only deposited a very small amount of test eth in this test case. This message has nothing to do with Gnosis Safe or multisig use.*

<img src="/screenshots/smart-invoice-client-multisig-28.png" />