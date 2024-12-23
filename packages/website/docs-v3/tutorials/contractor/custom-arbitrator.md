---
title: How to add a custom arbitrator
---

Currently Smart Invoice uses Kleros as a trusted arbitration provider with a history of fairly resolving disputes.

However you can choose to use your own arbitrator if you wish.  You will be prompted to enter an Arbitration Provider Address while creating your invoice on Step 2: Payment Details.

<img src="/screenshots/custom-arbitrator.png" />

You must confirm the arbitrator address is correct, and that your chosen arbitrator has access to this address. Otherwise, if the invoice is in dispute and locked, these funds will be unreachable until after the Safety Valve date.

This arbitrator address will be the only who can award the client and/or provider the disputed funds if the invoice is in dispute.

Currently the arbitrator is awarded 5% of the disputed amount for their arbitration services.  
