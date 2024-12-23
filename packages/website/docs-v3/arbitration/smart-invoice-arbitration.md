---
title: Smart Invoice Arbitration Policy
---

## Introduction

Smart Invoice is committed to providing resilient and flexible arbitration solutions that satisfy institutional needs, as well as cost-effective alternatives for users working as freelancers or use Smart Invoice for small sums only. Since [Kleros](https://kleros.io) requires invoices to hold a minimum value of USD 1,000 at the time of the dispute and arbitration by LexDAO is only available on Gnosis Chain and Polygon, *Smart Invoice* also offers in-house arbitration for invoices not exceeding a value of USD 1,000 **at any time**. Should your invoice exceed the threshold value, the arbitration is escalated to Kleros automatically. Please refer to [Arbitration by Kleros](docs-v3/arbitration/arbitration_policies/kleros-arbitration.md) for reference. Smart Invoice executes in-house and *Kleros* arbitrations through a [HATs Signer Gate-protected](https://hats-signer-gate-portal.vercel.app/deploy/hsgws) multi-sig wallet.

## *Smart Invoice* Arbitration Process

1. A conflict arises between two Smart Invoice users, who have chosen arbitration to take place in-house by Smart Invoice. One of the parties locks the funds in the Smart Invoice escrow by calling the `lock()` function.
2. The user locking the funds is prompted to complete a form detailing the reason for the claim, a justification, and evidence.
3. After `lock()` was called, the funds are forwarded to a three out of five signers multi-signature wallet controlled by Smart Invoice representatives.
4. Smart Invoices' arbitration committee convenes and reviews the evidence submitted by the claimant through the lock form.
5. Smart Invoice finds a resolution for the case and the Smart Invoice representatives execute the multi-sig accordingly.

### Submission of Evidence

The evidence you are submitting to the Kleros Court consists of the following:
- Smart Invoice data, including the project description, linked project specification
- a claim statement collected from you when locking the funds

Please note that all evidence must be provided through the **lock form** provided on [smartinvoice.xyz](https://smartinvoice.xyz)to be admitted to the arbitration process. **Failing to provide relevant information in the project description and through the forms will lead to its exclusion in the arbitration process.** It is your sole responsibility to provide all necessary information. Providing additional information when locking the funds.

For a project description that is linked to an escrow account on SmartInvoice upon creation, to be valid and considered as evidence by Kleros, the project description must be available as tamperproof and  non-repudiable document. That may be a linked document that was signed using DocuSign, an IPFS hash, or similar. Otherwise, you will have to submit evidence in the lock form that irrefutably proofs that the version of the document linked in the escrow description matches the version and document that was agreed upon by both parties.

## Escalation and Enforcement

Smart Invoice will only arbitrate or escalate claims that are linked to smart escrows holding tokens with **a maximum value of USD 1,000 anytime**. When choosing the Smart Invoice arbitration you acknowledge and agree to Smart Invoice executing the arbitration result and certify that your counterparty agrees to the arbitration by Smart Invoice. Furthermore, you agree your case to be arbitrated by Smart Invoices' sole discretion and with a fixed number of three arbitrators assigned ONLY by Smart Invoice and its entities. Finally, you acknowledge that from the time of locking the funds until their release, the funds are safeguarded by a multi-sig under the control of Smart Invoice. The arbitration process is provided as is and without warranty.

### Escalation conditions

If you adhere to the following conditions, SmartInvoice arbitrates your dispute. Please keep in mind that Smart Invoice MAY reject your claim in cases where the requested remedy exceeds the value of the claim. You are thus encouraged to properly quantify damages to avoid unnecessary resubmissions of your claim.

1. You have selected Smart Invoice Arbitration when creating the escrow contract on Smart Invoice.
2. The Smart Invoice never held tokens with worth an excess of USD 1,000.
3. Your Smart Invoice has a project description, a title, and a project specification linked.
4. You have filled out the lock form.
5. You have provided sufficient information in these forms to allow for arbitration.
6. You have created the smart invoice through  [smartinvoice.xyz](https://smartinvoice.xyz).
7. The goods and services provided do not conflict neither with the laws in the United States of America nor the European Union.
8. You agree to pay a five (5) percent fee for the arbitration service.
9. You acknowledge that Smart Invoice may anytime, at their sole discretion and without having to provide information decide to halt, abort, or decline arbitration.
10. You provided a means for SmartInvoice and its agents to contact you in form of an email and you consent to the processing of the related data by these entities.

### Conditions for Resubmission of Claims

Claimants MAY NOT resubmit their claim in cases, when the court rejected the claim because it is out of proportion to the incurred damages (if damages occurred at all).

### Appeal

Claimants MAY NOT appeal to a decision made by Smart Invoice.

### Enforcement conditions

1. The dispute has been created only after the escalation conditions were fulfilled and the information provided allows for arbitration to take place.
2. There is no evidence of negligence, malicious intent, or otherwise ill guided behaviour.
3. Smart Invoice is available to handle the arbitration.

## Fees

SmartInvoice takes a flat fee of five percent (5%) of the disputed funds for covering arbitration.

## Considerations

SmartInvoice wants to offer its users escrow services not only on Gnosis, but also on Optimism, Base, Arbitrum, and Polygon. For Polygon and Gnosis chain, you should consider which arbitration provider best fits your needs, as Smart Invoice has the broadest arbitration offering on these networks.

### Hats Signer Gate Addresses (3/5)

If you are looking for more detailed documentation on our arbitration infrastructure, please visit our [arbitration infrastructure section](docs-v3/arbitration/arbitration_policies/arbitration_infra.md). Below is a list of all Safes currently operational for providing *in-house* arbitration.

- Arbitrum Arbitration [Safe](https://app.safe.global/home?safe=arb1:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Base Arbitration [Safe](https://app.safe.global/home?safe=base:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Gnosis Arbitration [Safe](https://app.safe.global/home?safe=gno:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Optimism Arbitration [Safe](https://app.safe.global/home?safe=oeth:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Polygon Arbitration [Safe](https://app.safe.global/home?safe=matic:0x18542245cA523DFF96AF766047fE9423E0BED3C0)

## Terms    
    
### Disclaimer Regarding the Selection of Custom Arbitration Arbitrators
    
In the event of a user (hereinafter “the User”) choosing a Smart Invoice in-house arbitration for [smartinvoice.xyz](https://smartinvoice.xyz)  (hereinafter referred to as "In-House Arbitrator"), the User assumes full and exclusive responsibility for the selection, engagement, and outcomes associated with the use of the In-House Arbitrator. The User, hereby, agrees and acknowledges that SmartInvoice.xyz, its affiliates, representatives, agents, advisors (collectively, "SmartInvoice.xyz") SHALL bear no liability, whether direct, indirect, incidental, special, punitive, consequential, or otherwise, for any and all claims, damages, losses, expenses, costs, obligations, or liabilities, including but not limited to legal fees, arising out of, related to, or in connection with the User's decision to utilise the In-House Arbitrator for arbitration purposes.    
    
The User acknowledges and agrees that SmartInvoice.xyz provides no warranties, express or implied, as to the suitability, legality, reliability, quality, integrity, or availability of the In-House Arbitrator selected by the User. Furthermore, the User explicitly absolves SmartInvoice.xyz from any responsibility for the acts, omissions, decisions, or outcomes produced by the In-House Arbitrator, including but not limited to the resolution of disputes, the handling of any funds in escrow, and the enforcement of any arbitration awards.    
    
By choosing a In-House Arbitrator, the User confirms their understanding of and agreement to the fact that SmartInvoice.xyz's provision of its platform and related services SHALL be governed entirely by the terms and conditions, rules, and procedures established in the context of engaging the In-House Arbitrator.  
    
### Indemnification Clause  
    
The User hereby agrees to indemnify, defend, and hold harmless SmartInvoice.xyz from and against any and all claims, damages, liabilities, costs, and expenses, including reasonable attorneys’ fees and costs, arising out of or in any way connected with the User’s selection, engagement, and use of its In-House Arbitrator, or the User’s breach of any representation, warranty, or covenant under this disclaimer or the terms and conditions of SmartInvoice.xyz and its In-House Arbitrator. This indemnification obligation will survive the termination or expiration of the User’s use of SmartInvoice.xyz and/or the selection of a In-House Arbitrator.    
    
### Severability Clause
    
If any provision of this disclaimer, or the application thereof to any person or circumstance, is found to be invalid, void, or unenforceable to any extent, such invalidity, voidness, or unenforceability shall not affect the remaining provisions hereof, and the application of such provision to other persons or circumstances, which shall enforce to the fullest extent permitted by law. The parties hereby agree to replace any invalid, void, or unenforceable provision with a valid and enforceable provision that most closely matches the intent of the original provision. The remaining provisions of this disclaimer shall continue in full force and effect.  