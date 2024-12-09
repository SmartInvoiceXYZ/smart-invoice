---
title: Custom Arbitration Policy
---

## Introduction      
    
[smartinvoice.xyz](https://smartinvoice.xyz) is determined to provide users with the utmost flexibility when configuring the escrow functionality of their SmartInvoice escrow contract. To this end, SmartInvoice offers users to include their custom contract address for arbitration when creating their invoice. All users are advised to verify that the smart contract acting as arbitrator is deployed on the same network the SmartInvoice escrow contract is going to be created.  
  
Furthermore, we advise users to agree with their counterparty on the use of a custom arbitrator in writing, as an improper configuration of an arbitrator MAY severely limit the functionality and security of the smart invoice protocol. The escrow functionality is non-custodial, thus, once the SmartInvoice escrow contract is deployed and funded, **we cannot help you** in recovering funds locked in the contract.  
  
The platform, however, provides minimal functionality to support any arbitration and independently of the provider chosen, by prompting users to file a claim that is propagated to IPFS when locking the funds.  
    
## Setup of Custom Arbitration Provider  
  
For choosing a custom arbitration provider select “**Custom**” in the dropdown menu for selecting an arbitration provider. Once you selected the option “**Custom**”, please proceed to input the desired smart contract address for the contract acting as arbitrator. You can now continue the flow as you would with any other arbitration provider.  
  
<img alt="Custom Arbitration Provider Selection" src="public/arbitration/custom_arb_provider.png">

    
## Arbitration Process    
    
1. A conflict arises between two SmartInvoice users, who have chosen a custom arbitration provider. One of the parties locks the funds in the Smart Invoice escrow by calling the `lock()`.    
2. The user locking the funds is prompted to complete a form detailing the reason for the claim, a justification, and evidence.    
3. After `lock()` was called, the funds are forwarded to the smart contract specified upon signup.    
4. The specified smart contract, acting as arbitrator, receives the funds.  
5. The form is publicly available through an IPFS hash.    
6. An operator, controlling the smart contract acting as arbitrator SHALL review the information provided in the document on IPFS, which are associated with the contested SmartInvoice escrow.  
7. Based on the information provided, an operator controlling the smart contract acting as custom arbitration provider, SHALL make a ruling and release the funds accordingly.  
    
## Fees    
    
SmartInvoice cannot provide any information on the fees that are incurred when choosing a custom arbitration provider as SmartInvoice has neither control over the provider used, nor knowledge of which provider is being used.   
    
## Specification    
  
SmartInvoice cannot provide any details on the arbitration architecture and safeguards in place, when choosing a custom arbitration provider.  
    
## Terms    
    
**Disclaimer Regarding the Selection of Custom Arbitration Arbitrators**    
    
In the event of a user (hereinafter “the User”) choosing a custom arbitration provider for [smartinvoice.xyz](https://smartinvoice.xyz)  (hereinafter referred to as "Custom Arbitrator") instead of a pre-approved arbitration providers endorsed by [smartinvoice.xyz](https://smartinvoice.xyz), such as LexDAO or Kleros, the User assumes full and exclusive responsibility for the selection, engagement, and outcomes associated with the use of said Custom Arbitrator. The User, hereby, agrees and acknowledges that SmartInvoice.xyz, its affiliates, representatives, agents, advisors (collectively, "SmartInvoice.xyz") SHALL bear no liability, whether direct, indirect, incidental, special, punitive, consequential, or otherwise, for any and all claims, damages, losses, expenses, costs, obligations, or liabilities, including but not limited to legal fees, arising out of, related to, or in connection with the User's decision to utilise a Custom Arbitrator for arbitration purposes.    
    
The User acknowledges and agrees that SmartInvoice.xyz provides no warranties, express or implied, as to the suitability, legality, reliability, quality, integrity, or availability of any Custom Arbitrator selected by the User. Furthermore, the User explicitly absolves SmartInvoice.xyz from any responsibility for the acts, omissions, decisions, or outcomes produced by the Custom Arbitrator, including but not limited to the resolution of disputes, the handling of any funds in escrow, and the enforcement of any arbitration awards.    
    
By choosing a Custom Arbitrator, the User confirms their understanding of and agreement to the fact that SmartInvoice.xyz's provision of its platform and related services does not extend to the vetting, approval, or endorsement of any Custom Arbitrator. The user further agrees that the use of a Custom Arbitrator SHALL be governed entirely by the terms and conditions, rules, and procedures established by such Custom Arbitrator, and that any recourse for dissatisfaction or dispute with a Custom Arbitrator shall lie solely against the Custom Arbitrator and not SmartInvoice.xyz.  
    
**Indemnification Clause**    
    
The User hereby agrees to indemnify, defend, and hold harmless SmartInvoice.xyz from and against any and all claims, damages, liabilities, costs, and expenses, including reasonable attorneys’ fees and costs, arising out of or in any way connected with the User’s selection, engagement, and use of a Custom Arbitrator, or the User’s breach of any representation, warranty, or covenant under this disclaimer or the terms and conditions of SmartInvoice.xyz. This indemnification obligation will survive the termination or expiration of the User’s use of SmartInvoice.xyz and/or the selection of a Custom Arbitrator.    
    
**Severability Clause**    
    
If any provision of this disclaimer, or the application thereof to any person or circumstance, is found to be invalid, void, or unenforceable to any extent, such invalidity, voidness, or unenforceability shall not affect the remaining provisions hereof, and the application of such provision to other persons or circumstances, which shall enforce to the fullest extent permitted by law. The parties hereby agree to replace any invalid, void, or unenforceable provision with a valid and enforceable provision that most closely matches the intent of the original provision. The remaining provisions of this disclaimer shall continue in full force and effect.  