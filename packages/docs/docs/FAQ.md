---
title: FAQ
---

<h4><details>
<summary> What is Lock? (CLIENT/PROVIDER) </summary>

<p>&nbsp;</p>

###### Lock is a feature that allows clients and providers to lock the funds deposited into their smart invoice, triggering arbitration.

###### If the client loses confidence in the provider at any time or the provider under delivers on their promise, the client may lock any remaining funds in smart invoice so they cannot be released or withdrawn.

###### Alternatively, if the client has not released funds after a milestone is complete, the provider may lock any remaining funds in smart invoice.

</details></h4>

<h4><details>
<summary> What is Arbitration? (CLIENT/PROVIDER) </summary>

<p>&nbsp;</p>

###### Arbitration is triggered by either the client or provider locking funds held by their smart invoice. Arbitration is the process of resolving a dispute between a client and a provider, and it is facilitated by a third-party adjudicator.

</details></h4>

<h4><details>
<summary> How does the dispute resolution process work? (CLIENT/PROVIDER) </summary>

<p>&nbsp;</p>

###### Lock triggers the arbitration provider (i.e., LexDAO or Custom) to review and resolve the dispute.

###### Based on their review, the arbitration provider will determine which party should receive "x" amount of funds, and will send a transaction to smart invoice that transfers the appropriate amount to each party.

</details></h4>

<h4><details>
<summary>How is Deposit different from Release? (CLIENT/PROVIDER)</summary>

<p>&nbsp;</p>

###### Deposit is a function that allows the client to deposit funds into the milestone(s), and before or after the milestone is completed, the client can use the release function to release the funds to the provider for their service. In order to release funds, the client must first make a deposit!

</details></h4>

<h4><details>
<summary>Why can’t I release or withdraw my payment? (CLIENT)</summary>

<p>&nbsp;</p>

###### In order to release or withdraw your payment, first you will want to navigate to "view existing invoice" and check the status shown in the right column next to your smart invoice. If the status of your smart invoice shows:

1. Awaiting deposit - this means you need to make a deposit, following your deposit you will be able to release payment
2. In dispute - You will not be able to release/withdraw payment until the dispute is resolved
3. Safety valve withdrawal date passed

</details></h4>

<h4><details>
<summary>Can I make multiple payments? (through “deposit” or “release”) to the provider with one transaction? (CLIENT)</summary>

<p>&nbsp;</p>

###### Yes, you can execute one transaction for all milestone deposits and releases respectivley.

</details></h4>

<h4><details>
<summary>What statuses can an invoice have? (CLIENT/PROVIDER)</summary>

<p>&nbsp;</p>

1. Awaiting Deposit
2. Funded
3. Completed
4. Expired
5. In dispute

</details></h4>

##### Have additional questions? Drop into our discord where we will be happy to help you! https://discord.gg/M2QaDPgKFR 