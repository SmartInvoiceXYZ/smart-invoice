---
title: Kleros Arbitration Policy
---

## Introduction

Smart Invoice is committed to providing resilient and flexible arbitration solutions that satisfy institutional needs, as well as cost-effective alternatives for users working as freelancers or use Smart Invoice for small sums only. Our partnership with [Kleros](https://kleros.io) helps us to deliver on our objectives for chains. Kleros is a trialled and tested solution that allows Smart Invoice users with small to medium sized invoices, with a minimum value of USD 1,000 at the time of the dispute, a reliable option for settling their disputes. Should your invoice fall below the threshold value at the time of dispute, the arbitration is handled internally by Smart Invoice. Please refer to *Arbitration by Smart Invoice* for reference. Smart Invoice is handling the collection of further information on claims and executes the decision made by Kleros through a [HATs Signer Gate-protected](https://hats-signer-gate-portal.vercel.app/deploy/hsgws) multi-sig wallet.

Smart Invoice is Kleros recognised jurisdictions, which means that you will have to provide information about your claim to Smart Invoice, using a [Google Form](https://forms.gle/K3oMAzAb32G5SbpM9). We will then share the information with the responsible Kleros Court. After a decision was made, Smart Invoice shares the result with the disputants and releases the funds. In that process, you have the ability to appeal twice if your invoice exceeds a value of USD 2,000. In the following, the arbitration process, detailed conditions for enforcement and escalation, our arbitration policy, the court parameters, and the Kleros integration type are described. Finally, this documents references the multi-sig addresses for executing the arbitration, the fees, and the arbitration interface.

## *Kleros* Arbitration Process

1. A conflict arises between two Smart Invoice users, who have chosen Kleros as arbitration provider. One of the parties locks the funds in the Smart Invoice escrow by calling the `lock()` function.
2. The user locking the funds is prompted to complete a form detailing the reason for the claim, a justification, and evidence.
3. After `lock()` was called, the funds are forwarded to a three out of five signers multi-signature wallet controlled by Smart Invoice representatives.
4. Kleros receives both forms and automatically converts them into a document that is easy for the jurors to read.
5. Kleros initiates the dispute in the appropriate court and uploads the statements from both parties. Then the Kleros court takes over the dispute and resolves it in four stages.
    1. Evidence - Evidence can be submitted and parties can withdraw.
    2. Vote - Jurors reveal/cast their vote.
    3. Appeal - The dispute can be appealed.
    4. Execution - Tokens are redistributed, and the ruling is executed.
6. Kleros informs Smart Invoice of the case resolution, and the Smart Invoice representatives execute the multi-sig accordingly.

### Submission of Evidence

The evidence you are submitting to the Kleros Court consists of the following:
- Smart Invoice data, including the project description, linked project specification
- additional information you are providing through the [Google form](https://forms.gle/K3oMAzAb32G5SbpM9)
- a claim statement collected from you when locking the funds

Please note that all evidence must be provided through the forms provided on [smartinvoice.xyz](https://smartinvoice.xyz)to be admitted to the arbitration process. **Failing to provide relevant information in the project description and through the forms will lead to its exclusion in the arbitration process.** It is your sole responsibility to provide all necessary information. Providing additional information when locking the funds shall be done through this [Google form](https://forms.gle/K3oMAzAb32G5SbpM9).

For a project description that is linked to an escrow account on SmartInvoice upon creation, to be valid and considered as evidence by Kleros, the project description must be available as tamperproof and  non-repudiable document. That may be a linked document that was signed using DocuSign, an IPFS hash, or similar. Otherwise, you will have to submit evidence in the [Google Form for claim submissions](https://forms.gle/K3oMAzAb32G5SbpM9) that irrefutably proofs that the version of the document linked in the escrow description matches the version and document that was agreed upon by both parties.

## Escalation and Enforcement

Smart Invoice will only escalate claims to Kleros that are linked to smart escrows holding tokens with **a minimum value of USD 1,000 at the time of locking the funds**. Smart Invoice is a **Kleros recognised jurisdictions**, when choosing the Kleros arbitration you acknowledge and agree to Smart Invoice executing the arbitration result on behalf of Kleros. Furthermore, you agree your case to be arbitrated by a Kleros court of Kleros' sole discretion and with a fixed number of three jurors assigned exclusively by Kleros. Finally, you acknowledge that from the time of locking the funds until their release, the funds are safeguarded by a multi-sig under the control of Smart Invoice. The arbitration process is provided as is and without warranty.

### Escalation conditions

If you adhere to the following conditions, SmartInvoice escalates the dispute to Kleros courts for resolution. Please keep in mind that the Kleros courts, however, reject your claim in cases where the requested remedy exceeds the value of the claim. You are thus encouraged to properly quantify damages to avoid unnecessary resubmissions of your claim.

1. You have selected Kleros Arbitration when creating the escrow contract on Smart Invoice.
2. The Smart Invoice holds tokens with a minimum value of USD 1,000 at the time of filing the dispute.
3. Your Smart Invoice has a project description, a title, and a project specification linked.
4. You have filled out the [Claimant form](https://forms.gle/K3oMAzAb32G5SbpM9), as well as the lock comment.
5. You have provided sufficient information in these forms to allow for arbitration.
6. You have created the smart invoice through  [smartinvoice.xyz](https://smartinvoice.xyz).
7. The goods and services provided do not conflict neither with the laws in the United States of America nor the European Union.
8. You agree to pay a five (5) percent fee for the arbitration service.
9. You acknowledge that Smart Invoice or Kleros may anytime, at their sole discretion and without having to provide information decide to halt, abort, or decline arbitration.
10. You provided a means for SmartInvoice, Kleros, and its agents to contact you in form of an email and you consent to the processing of the related data by these entities.

### Conditions for Resubmission of Claims

Claimants may resubmit their claim in cases, when the court rejected the claim because it is out of proportion to the incurred damages (if damages occurred at all). A resubmission is only possible in cases, where the Kleros court rules that the claim in principle is warranted, however, the requested damages are disproportionate to the claim.

Only in such case of over-quantification, a resubmission with altered damage claims is permissible. The resubmission must be made **within five business days** of the ruling and can only be done **once**. To resubmit, please use the [Google Form for claim submissions](https://forms.gle/K3oMAzAb32G5SbpM9) and select *resubmission*.

All fees associated with a resubmission are to be paid in full by the resubmitting party in advance to the respective multi-sig referenced below **on the correct network**. Failure to do so will result in the resubmission to be disregarded by SmartInvoice and Kleros. Properly transmitting the required funds are your sole responsibility. Neither SmartInvoice nor Kleros can be held liable for your failure to resubmit and pay in an appropriate and timely fashion.

### Appeal

Following the Kleros process, you may appeal to a decision made by a Kleros court for invoices with holding tokens with a **minimum value of USD 2,000 at the time of the dispute**. An appeal will result in the reconsideration of your case as is by a new court that will consist of 2n+1 jurors. Given the limitations agreed upon between SmartInvoice and Kleros for the *Recognition of Jurisdiction* integration, you can only appeal twice. To disambiguate appeals and resubmission, please read the preceding section for clarification.

Appeals must be filed **within five business days** of the ruling and costs are to be paid in full by the appealing party **in advance**, as they are not covered by the fee retained from the invoice. Payments are to be made to the respective multi-sig referenced below **on the correct network**. Failure to do so will result in the appeal to be disregarded by SmartInvoice and Kleros. Properly transmitting the required funds are your sole responsibility. Neither SmartInvoice nor Kleros can be held liable for your failure to appeal and pay in an appropriate and timely fashion.

### Enforcement conditions

1. The dispute has been created only after the escalation conditions were fulfilled and the information provided allows for arbitration to take place.
2. There is no evidence of negligence, malicious intent, or otherwise ill guided behaviour.
3. The Kleros court is available to handle the arbitration.

## General Dispute Policy for [smartinvoice.xyz](https://smartinvoice.xyz)

| Version | Date       | Document                                                                                                                                           |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2024-04-22 | [Kleros General Dispute Policy for SmartInvoice](https://docs.google.com/document/d/1z_l2Wc8YHSspB0Lm5cmMDhu9h0W5G4thvDLqWRtuxbA/edit?usp=sharing) |

This policy is crafted for Kleros Jurors to ensure transparency, fairness, and efficiency in resolving disputes, safeguarding the interests of both Clients and Providers engaged in transactions on SmartInvoice.xyz. Thus, it falls outside of the responsibility and liability of SmartInvoice. If you choose Kleros as an arbitration provider, you are entering into a contractual relationship with the Kleros entities on the basis of this policy.

It functions as the basis of decision making for jurors in cases related to Smart Invoice. This policy honours the principle of contractual freedom, while providing clearer subsidiary rules for cases in which the agreement between the disputed parties is not sufficient to determine if there was a breach of contract and how to appropriately value damages.

## Court Parameters

Through the *Recognition of Jurisdiction* integration with Kleros, users of SmartInvoice may use choose from the list of three courts below when creating an escrow on [smartinvoive.xyz](https://smartinvoice.xyz). All courts offered by Kleros to SmartInvoice users are on the **Gnosis (xDAI) chain**. After an escrow was created courts **cannot be changed**.

### Available Courts

1. **[xDAI General Court](https://klerosboard.com/100/courts/0)**
	- Chain: Gnosis (xDai)
	- Jurors drawn in the first round: 3
	- Juror Vote Reward: 13 xDAI per juror
	- [Smart Contract](https://gnosis.blockscout.com/address/0xc7add3c961f7935cb4914e37da991d2f1cd7986c)
1. **[xDai Solidity Court](https://klerosboard.com/100/courts/13)**
	- Chain: Gnosis (xDai)
	- Jurors drawn in the first round: 2
	- Juror Vote Reward: 30 xDAI per juror
	- [Smart Contract](https://gnosis.blockscout.com/address/0xce9260c08272fa39c9af1307cd079dc5636bee01)
1. **[xDai Javascript Court](https://klerosboard.com/100/courts/14)**
	- Chain: Gnosis (xDai)
	- Jurors drawn in the first round: 2
	- Juror Vote Reward: 30 xDAI per juror
	- [Smart Contract](https://gnosis.blockscout.com/address/0x9fe4d9e4989ad031fdc424d8c34d77e70aa0b269)

## Integration with the Court

- Type: *Recognition of Jurisdiction* (*RoJ*)
- Github link: *[smart-invoice](https://github.com/SmartInvoiceXYZ/smart-invoice)*

## Fees

SmartInvoice takes a flat fee of five percent (5%) of the disputed funds for covering arbitration. For this reason, Kleros is not offered for disputed escrows that hold less than USD 1,000 in funds. Arbitration fees arising out of the use of Kleros that are above the 5% fee are to be paid in advance to the appropriate arbitration multi-sig of SmartInvoice for the respective network. Additional fees apply to the following services:

- choosing a specialised court,
- adding jurors,
- resubmitting a claim, and,
- appealing a claim

## Considerations

SmartInvoice wants to offer its users escrow services not only on Gnosis, but also on Optimism, Base, Arbitrum, and Polygon. For Polygon and Gnosis chain, you should consider which arbitration provider best fits your needs, as Smart Invoice has the broadest arbitration offering on these networks.

New chains that are not currently covered natively by Kleros, will be available on Smart Invoice through *Kleros RoJ*. This means that SmartInvoice will execute the decision made by Kleros jurors through the multi-sigs referenced in the next section.

### Hats Signer Gate Addresses (3/5)

If you are looking for more detailed documentation on our arbitration infrastructure, please visit our [arbitration infrastructure section](docs-v3/arbitration/arbitration_policies/arbitration_infra.md). Below is a list of all Safes currently operational for providing *Kleros RoJ* arbitration.

- Arbitrum Arbitration [Safe](https://app.safe.global/home?safe=arb1:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Base Arbitration [Safe](https://app.safe.global/home?safe=base:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Gnosis Arbitration [Safe](https://app.safe.global/home?safe=gno:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Optimism Arbitration [Safe](https://app.safe.global/home?safe=oeth:0x18542245cA523DFF96AF766047fE9423E0BED3C0)
- Polygon Arbitration [Safe](https://app.safe.global/home?safe=matic:0x18542245cA523DFF96AF766047fE9423E0BED3C0)

