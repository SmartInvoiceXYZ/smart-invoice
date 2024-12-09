---
title: LexDAO Arbitration Policy
---

## Introduction  
  
As part of our commitment to providing secure, transparent, and efficient mechanisms for resolving disputes, [smartinvoice.xyz](https://smartinvoice.xyz) provides an advanced arbitration feature in collaboration with the LexDAO Cooperative. This feature brings trust and reliability in pseudonymous digital transactions, making service agreements in Web3 safe. The arbitration process we have implemented serves is a crucial component in ensuring that all parties engaged in a transaction can resolve their conflicts in a fair and unbiased manner.  
  
The choice of arbitration as a dispute resolution mechanism is motivated by the necessity to address disagreements swiftly and effectively, without the need for lengthy and often costly court proceedings. By integrating with the *LexDAO Resolver*,  [smartinvoice.xyz](https://smartinvoice.xyz) leverages the expertise of seasoned arbitrators and the robustness of smart contracts to offer a streamlined, secure process for resolving disputes.  
  
## Arbitration Process  
  
Below, the arbitration process is outlined in detail. Beginning with the selection of the arbitration provider at the inception of the smart invoice contract, the takes effect when a dispute is triggered by either of the contracting parties. At this point and until the final resolution with the fund disbursement in accordance with the arbitrators' ruling representatives of the *LexDAO Resolver* manage the arbitration process for the contracting parties.  
  
1. LexDAO is selected as arbitration provider at the creation of the smart invoice contract.  
2. A conflict arises between two Smart Invoice users, who have chosen *LexDAO Resolver* as arbitration provider. One of the parties locks the funds in the Smart Invoice escrow by calling the `lock()` function.  
3. The user locking the funds is prompted to complete a form detailing the reason for the claim, a justification, and evidence.  
4. The document is stored on IPFS.  
5. After `lock()` was called, the funds are forwarded to a three out of five signers multi-signature wallet controlled by representatives of the *LexDAO Resolver*.  
6. Representatives of the *LexDAO Resolver* are notified by the claimant via email to [lexdaocoop@gmail.com](mailto:lexdaocoop@gmail.com).   
7. The arbitrators of the *LexDAO Resolver* review the evidence and rule according to the [UNCITRAL arbitration rules](https://uncitral.un.org/en/texts/arbitration/contractualtexts/arbitration).  
8. *LexDAO Resolver* releases the disputed funds pro rata minus the fee in line with their ruling.  
  
## Fees  
  
Arbitration by LexDAO is subject to a five (5) percent fee of the disputed amount payable pro rata by the parties according to the ruling of the arbitrator.  
  
## Specifications  
  
The LexDAO Arbitration is specified in this [document](https://github.com/lexDAO/Arbitration).  
  
## Terms of Use  
  
The terms of use for the LexDAO Resolver are set out [here](https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md).  
  
**Any controversy, dispute or claim among the parties arising out of or relating to this agreement, or the breach, termination or validity thereof, shall be finally settled by LexDAO Arbitration in accordance with the rules and procedures recorded on [https://github.com/lexDAO/Arbitration](https://github.com/lexDAO/Arbitration).**  