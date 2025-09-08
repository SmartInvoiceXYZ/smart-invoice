// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/* solhint-disable func-name-mixedcase */

import {Test} from "forge-std/Test.sol";
import {
    ISmartInvoiceEscrow
} from "contracts/interfaces/ISmartInvoiceEscrow.sol";
import {SmartInvoiceEscrow} from "contracts/variants/SmartInvoiceEscrow.sol";
import {
    SmartInvoiceFactory,
    ISmartInvoiceFactory
} from "contracts/SmartInvoiceFactory.sol";
import {MockToken} from "contracts/mocks/MockToken.sol";
import {MockWETH} from "contracts/mocks/MockWETH.sol";
import {MockArbitrator} from "contracts/mocks/MockArbitrator.sol";

contract SmartInvoiceEscrowFuzzTest is Test {
    SmartInvoiceEscrow public implementation;
    SmartInvoiceFactory public factory;
    MockToken public token;
    MockWETH public wrappedETH;
    MockArbitrator public arbitrator;

    address public client = makeAddr("client");
    address public provider = makeAddr("provider");
    address public resolver = makeAddr("resolver");
    address public providerReceiver = makeAddr("providerReceiver");
    address public clientReceiver = makeAddr("clientReceiver");
    address public treasury = makeAddr("treasury");

    bytes32 public constant INVOICE_TYPE = keccak256("escrow-v3");

    function setUp() public {
        token = new MockToken();
        wrappedETH = new MockWETH();
        arbitrator = new MockArbitrator(10);

        factory = new SmartInvoiceFactory(address(wrappedETH));
        implementation = new SmartInvoiceEscrow(
            address(wrappedETH),
            address(factory)
        );

        factory.addImplementation(INVOICE_TYPE, address(implementation));
    }

    function _createInvoice(
        uint256[] memory amounts,
        uint256 terminationTime,
        uint256 feeBPS,
        bool useReceivers,
        uint256 salt
    ) internal returns (SmartInvoiceEscrow) {
        bytes memory resolverData = abi.encode(resolver, 1000);
        ISmartInvoiceEscrow.InitData memory initData = ISmartInvoiceEscrow
            .InitData({
                client: client,
                resolverData: resolverData,
                token: address(token),
                terminationTime: terminationTime,
                requireVerification: false,
                providerReceiver: useReceivers ? providerReceiver : address(0),
                clientReceiver: useReceivers ? clientReceiver : address(0),
                feeBPS: feeBPS,
                treasury: feeBPS > 0 ? treasury : address(0),
                details: "Fuzz test invoice"
            });

        bytes memory data = abi.encode(initData);

        address invoiceAddress = factory.createDeterministic(
            provider,
            amounts,
            data,
            INVOICE_TYPE,
            0,
            bytes32(salt)
        );

        return SmartInvoiceEscrow(payable(invoiceAddress));
    }

    /// @dev Fuzz test invoice creation with various milestone configurations
    function testFuzz_InvoiceCreation(
        uint8 milestoneCount,
        uint256 baseAmount,
        uint256 terminationOffset,
        uint16 feeBPS
    ) public {
        // Bound inputs to reasonable ranges
        milestoneCount = uint8(bound(milestoneCount, 1, 50)); // Max milestone limit
        baseAmount = bound(baseAmount, 1e15, 1e25); // 0.001 to 10M tokens
        terminationOffset = bound(terminationOffset, 1 hours, 730 days); // 1 hour to 2 years
        feeBPS = uint16(bound(feeBPS, 0, 1000)); // 0% to 10%

        uint256[] memory amounts = new uint256[](milestoneCount);
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < milestoneCount; i++) {
            amounts[i] = baseAmount + (i * 1e18); // Vary amounts slightly
            totalAmount += amounts[i];
        }

        uint256 terminationTime = block.timestamp + terminationOffset;

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            terminationTime,
            feeBPS,
            feeBPS > 0,
            baseAmount
        );

        // Verify basic properties
        assertEq(invoice.client(), client);
        assertEq(invoice.provider(), provider);
        assertEq(invoice.total(), totalAmount);
        assertEq(invoice.milestone(), 0);
        assertEq(invoice.locked(), false);
        assertEq(invoice.terminationTime(), terminationTime);
        assertEq(invoice.feeBPS(), feeBPS);

        // Verify receiver addresses
        if (feeBPS > 0) {
            assertEq(invoice.providerReceiver(), providerReceiver);
            assertEq(invoice.clientReceiver(), clientReceiver);
            assertEq(invoice.treasury(), treasury);
        } else {
            assertEq(invoice.providerReceiver(), address(0));
            assertEq(invoice.clientReceiver(), address(0));
            assertEq(invoice.treasury(), address(0));
        }

        uint256[] memory storedAmounts = invoice.getAmounts();
        assertEq(storedAmounts.length, milestoneCount);
    }

    /// @dev Fuzz test milestone releases with various scenarios
    function testFuzz_MilestoneReleases(
        uint8 milestoneCount,
        uint256 baseAmount,
        uint8 releaseUpTo,
        uint256 extraBalance
    ) public {
        milestoneCount = uint8(bound(milestoneCount, 2, 20));
        baseAmount = bound(baseAmount, 1e18, 1e23);
        extraBalance = bound(extraBalance, 0, baseAmount);

        uint256[] memory amounts = new uint256[](milestoneCount);
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < milestoneCount; i++) {
            amounts[i] = baseAmount;
            totalAmount += amounts[i];
        }

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            0,
            false,
            baseAmount
        );

        releaseUpTo = uint8(bound(releaseUpTo, 0, milestoneCount - 1));

        // Fund the contract with exact amount needed plus extra
        uint256 releaseAmount = 0;
        for (uint256 i = 0; i <= releaseUpTo; i++) {
            releaseAmount += amounts[i];
        }

        token.mint(address(invoice), releaseAmount + extraBalance);

        uint256 providerBalanceBefore = token.balanceOf(provider);

        vm.prank(client);
        invoice.release(releaseUpTo);

        uint256 expectedReleased = releaseAmount;
        // For last milestone, should release extra balance too
        if (releaseUpTo == milestoneCount - 1 && extraBalance > 0) {
            expectedReleased += extraBalance;
        }

        assertEq(invoice.milestone(), releaseUpTo + 1);
        assertEq(
            token.balanceOf(provider),
            providerBalanceBefore + expectedReleased
        );
    }

    /// @dev Fuzz test withdrawal scenarios after termination
    function testFuzz_Withdrawals(
        uint256 amount,
        uint256 terminationOffset,
        uint256 withdrawDelay
    ) public {
        amount = bound(amount, 1e18, 1e25);
        terminationOffset = bound(terminationOffset, 1 hours, 365 days);
        withdrawDelay = bound(withdrawDelay, 0, 365 days);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        uint256 terminationTime = block.timestamp + terminationOffset;

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            terminationTime,
            0,
            false,
            amount
        );

        // Fund the contract
        token.mint(address(invoice), amount);

        // Move past termination time
        vm.warp(terminationTime + withdrawDelay + 1);

        uint256 clientBalanceBefore = token.balanceOf(client);

        invoice.withdraw();

        assertEq(invoice.milestone(), amounts.length);
        assertEq(token.balanceOf(client), clientBalanceBefore + amount);
    }

    /// @dev Fuzz test fee calculations with various fee percentages
    function testFuzz_FeeCalculations(
        uint256 amount,
        uint16 feeBPS,
        bool isRelease
    ) public {
        amount = bound(amount, 1e18, 1e25);
        feeBPS = uint16(bound(feeBPS, 1, 1000)); // 0.01% to 10%

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            feeBPS,
            true,
            amount
        );

        token.mint(address(invoice), amount);

        uint256 expectedFee = (amount * feeBPS) / 10000;
        uint256 expectedNet = amount - expectedFee;

        uint256 treasuryBalanceBefore = token.balanceOf(treasury);

        if (isRelease) {
            uint256 receiverBalanceBefore = token.balanceOf(providerReceiver);

            vm.prank(client);
            invoice.release();

            assertEq(
                token.balanceOf(providerReceiver),
                receiverBalanceBefore + expectedNet
            );
        } else {
            vm.warp(invoice.terminationTime() + 1);

            uint256 receiverBalanceBefore = token.balanceOf(clientReceiver);

            invoice.withdraw();

            assertEq(
                token.balanceOf(clientReceiver),
                receiverBalanceBefore + expectedNet
            );
        }

        assertEq(
            token.balanceOf(treasury),
            treasuryBalanceBefore + expectedFee
        );
    }

    /// @dev Fuzz test dispute resolution with various award distributions
    function testFuzz_DisputeResolution(
        uint256 balance,
        uint256 clientAwardPct,
        uint256 resolutionRateBPS
    ) public {
        balance = bound(balance, 1e18, 1e25);
        clientAwardPct = bound(clientAwardPct, 0, 100);
        resolutionRateBPS = bound(resolutionRateBPS, 1, 1000);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = balance;

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            0,
            false,
            balance
        );

        // Mock resolution rate
        vm.mockCall(
            address(factory),
            abi.encodeWithSelector(
                ISmartInvoiceFactory.resolutionRateOf.selector,
                resolver
            ),
            abi.encode(resolutionRateBPS)
        );

        // Create new invoice with mocked resolution rate
        invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            0,
            false,
            balance + 1
        );

        token.mint(address(invoice), balance);

        // Lock the contract
        vm.prank(client);
        invoice.lock("Dispute");

        assertTrue(invoice.locked());

        // Calculate awards
        uint256 resolutionFee = (balance * resolutionRateBPS) / 10000;
        uint256 remainingBalance = balance - resolutionFee;
        uint256 clientAward = (remainingBalance * clientAwardPct) / 100;
        uint256 providerAward = remainingBalance - clientAward;

        uint256 clientBalanceBefore = token.balanceOf(client);
        uint256 providerBalanceBefore = token.balanceOf(provider);
        uint256 resolverBalanceBefore = token.balanceOf(resolver);

        vm.prank(resolver);
        invoice.resolve(clientAward, providerAward, "Fuzz resolution");

        assertEq(invoice.locked(), false);
        assertEq(token.balanceOf(client), clientBalanceBefore + clientAward);
        assertEq(
            token.balanceOf(provider),
            providerBalanceBefore + providerAward
        );
        assertEq(
            token.balanceOf(resolver),
            resolverBalanceBefore + resolutionFee
        );
    }

    /// @dev Fuzz test milestone additions with various configurations
    function testFuzz_MilestoneAdditions(
        uint8 initialCount,
        uint8 additionalCount,
        uint256 baseAmount,
        bool addDetails
    ) public {
        initialCount = uint8(bound(initialCount, 1, 25));
        additionalCount = uint8(bound(additionalCount, 1, 25));
        baseAmount = bound(baseAmount, 1e18, 1e23);

        // Ensure we don't exceed the limit
        if (initialCount + additionalCount > 50) {
            additionalCount = 50 - initialCount;
        }

        uint256[] memory amounts = new uint256[](initialCount);
        uint256 initialTotal = 0;

        for (uint256 i = 0; i < initialCount; i++) {
            amounts[i] = baseAmount + (i * 1e17);
            initialTotal += amounts[i];
        }

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            0,
            false,
            baseAmount
        );

        uint256[] memory newMilestones = new uint256[](additionalCount);
        uint256 additionalTotal = 0;

        for (uint256 i = 0; i < additionalCount; i++) {
            newMilestones[i] = baseAmount + ((i + initialCount) * 1e17);
            additionalTotal += newMilestones[i];
        }

        vm.prank(client);
        if (addDetails) {
            invoice.addMilestones(newMilestones, "Additional milestones");
        } else {
            invoice.addMilestones(newMilestones);
        }

        assertEq(invoice.total(), initialTotal + additionalTotal);

        uint256[] memory allAmounts = invoice.getAmounts();
        assertEq(allAmounts.length, initialCount + additionalCount);
    }

    /// @dev Fuzz test address updates with various scenarios
    function testFuzz_AddressUpdates(
        address newClient,
        address newProvider,
        address newProviderReceiver,
        address newClientReceiver
    ) public {
        // Ensure addresses are not zero or the contract itself
        vm.assume(
            newClient != address(0) &&
                newClient != address(0x1) &&
                newClient != client
        );
        vm.assume(
            newProvider != address(0) &&
                newProvider != address(0x1) &&
                newProvider != provider
        );
        vm.assume(
            newProviderReceiver != address(0) &&
                newProviderReceiver != address(0x1) &&
                newProviderReceiver != providerReceiver
        );
        vm.assume(
            newClientReceiver != address(0) &&
                newClientReceiver != address(0x1) &&
                newClientReceiver != clientReceiver
        );

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1e18;

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            0,
            true,
            1 ether
        );

        // Update client
        vm.prank(client);
        invoice.updateClient(newClient);
        assertEq(invoice.client(), newClient);

        // Update provider
        vm.prank(provider);
        invoice.updateProvider(newProvider);
        assertEq(invoice.provider(), newProvider);

        // Update provider receiver (using the new provider address)
        vm.prank(newProvider);
        invoice.updateProviderReceiver(newProviderReceiver);
        assertEq(invoice.providerReceiver(), newProviderReceiver);

        // Update client receiver (now using new client)
        vm.prank(newClient);
        invoice.updateClientReceiver(newClientReceiver);
        assertEq(invoice.clientReceiver(), newClientReceiver);
    }

    /// @dev Fuzz test ETH handling for wrapped ETH invoices
    function testFuzz_ETHHandling(uint256 ethAmount) public {
        ethAmount = bound(ethAmount, 1e15, 100 ether);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = ethAmount;

        bytes memory resolverData = abi.encode(resolver, 500);

        // Create invoice with wrapped ETH
        ISmartInvoiceEscrow.InitData memory initData = ISmartInvoiceEscrow
            .InitData({
                client: client,
                resolverData: resolverData,
                token: address(wrappedETH),
                terminationTime: block.timestamp + 30 days,
                requireVerification: false,
                providerReceiver: address(0),
                clientReceiver: address(0),
                feeBPS: 0,
                treasury: address(0),
                details: "ETH invoice"
            });

        bytes memory data = abi.encode(initData);

        address invoiceAddress = factory.createDeterministic(
            provider,
            amounts,
            data,
            INVOICE_TYPE,
            0,
            bytes32(ethAmount)
        );
        SmartInvoiceEscrow invoice = SmartInvoiceEscrow(
            payable(invoiceAddress)
        );

        // Send ETH to the invoice
        vm.deal(client, ethAmount);
        vm.prank(client);
        (bool success, ) = address(invoice).call{value: ethAmount}("");
        assertTrue(success);

        assertEq(wrappedETH.balanceOf(address(invoice)), ethAmount);

        // Test wrapETH function with additional ETH sent via selfdestruct simulation
        vm.deal(address(invoice), ethAmount / 2);

        invoice.wrapETH();

        assertEq(
            wrappedETH.balanceOf(address(invoice)),
            ethAmount + ethAmount / 2
        );
        assertEq(address(invoice).balance, 0);
    }

    /// @dev Fuzz test edge cases around balance and milestone interactions
    function testFuzz_BalanceEdgeCases(
        uint256 milestoneAmount,
        uint256 actualBalance,
        bool isLastMilestone
    ) public {
        milestoneAmount = bound(milestoneAmount, 1e18, 1e25);
        actualBalance = bound(
            actualBalance,
            milestoneAmount,
            milestoneAmount * 2
        );

        uint256[] memory amounts = new uint256[](isLastMilestone ? 1 : 2);
        amounts[0] = milestoneAmount;
        if (!isLastMilestone) {
            amounts[1] = milestoneAmount;
        }

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            0,
            false,
            milestoneAmount
        );

        token.mint(address(invoice), actualBalance);

        uint256 providerBalanceBefore = token.balanceOf(provider);

        vm.prank(client);
        invoice.release();

        if (isLastMilestone && actualBalance > milestoneAmount) {
            // Last milestone should release all balance
            assertEq(
                token.balanceOf(provider),
                providerBalanceBefore + actualBalance
            );
        } else {
            // Regular milestone should release exact amount
            assertEq(
                token.balanceOf(provider),
                providerBalanceBefore + milestoneAmount
            );
        }
    }

    /// @dev Fuzz test contract state consistency after various operations
    function testFuzz_StateConsistency(
        uint8 operations,
        uint256 baseAmount
    ) public {
        operations = uint8(bound(operations, 1, 10));
        baseAmount = bound(baseAmount, 1e18, 1e23);

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = baseAmount;
        amounts[1] = baseAmount;
        amounts[2] = baseAmount;

        SmartInvoiceEscrow invoice = _createInvoice(
            amounts,
            block.timestamp + 30 days,
            0,
            false,
            baseAmount
        );

        token.mint(address(invoice), baseAmount * 3);

        uint256 expectedMilestone = 0;
        uint256 expectedReleased = 0;

        // Perform random operations
        for (
            uint256 i = 0;
            i < operations && expectedMilestone < amounts.length;
            i++
        ) {
            vm.prank(client);
            invoice.release();

            expectedMilestone++;
            expectedReleased += amounts[expectedMilestone - 1];

            // Verify state consistency
            assertEq(invoice.milestone(), expectedMilestone);
            assertEq(invoice.released(), expectedReleased);
            assertEq(invoice.locked(), false);
        }
    }
}
