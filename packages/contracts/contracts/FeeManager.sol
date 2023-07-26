// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeManager is Ownable {
    enum ExemptionType {
        None,
        Lending,
        Subscription
    }

    struct FeeExemption {
        ExemptionType exemptionType;
        uint256 endDate;
    }

    uint256 public feePercentage = 0;

    mapping(address => FeeExemption) public feeExempt;

    function setExemption(
        ExemptionType exemptionType,
        uint256 endDate,
        address _address
    ) external onlyOwner {
        FeeExemption storage exemption = feeExempt[_address];
        exemption.exemptionType = exemptionType;
        exemption.endDate = endDate;
    }

    function calculateInvoiceFee(uint256 _amount, address _address)
        external
        view
        returns (uint256)
    {
        FeeExemption storage exemption = feeExempt[_address];
        if (
            exemption.exemptionType != ExemptionType.None &&
            exemption.endDate > block.timestamp
        ) {
            return 0;
        }
        return (_amount * feePercentage) / 100;
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(
            _feePercentage <= 100,
            "Fee percentage should not be more than 100"
        );
        feePercentage = _feePercentage;
    }
}
