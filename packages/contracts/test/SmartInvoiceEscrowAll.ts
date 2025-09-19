/* eslint-disable mocha/no-setup-in-describe */
import {
  createSuiteContext,
  SuiteCtx,
  VARIANT_ARB_PULL,
  VARIANT_ARB_PUSH,
  VARIANT_MIN_PULL,
  VARIANT_MIN_PUSH,
  VARIANT_PULL,
  VARIANT_PUSH,
  VariantConfig,
  VariantName,
} from './helpers';
import { additionalErrorHandlingAndEdgeCasesTests } from './suites/additionalErrorHandlingAndEdgeCases';
import { addressUpdateFunctionalityTests } from './suites/addressUpdateFunctionality';
import { arbitrationOperationsTests } from './suites/arbitrationOperations';
import { basicFunctionalityTests } from './suites/basicFunctionality';
import { ethOperationsTests } from './suites/ethOperations';
import { evidenceAndAppealOperationsTests } from './suites/evidenceAndAppealOperations';
import { feeSystemTests } from './suites/feeSystem';
import { fundingStatusTests } from './suites/fundingStatus';
import { lockAndResolveOperationsTests } from './suites/lockAndResolveOperations';
import { milestoneManagementTests } from './suites/milestoneManagement';
import { releaseOperationsTests } from './suites/releaseOperations';
import { tokenReleaseAndWithdrawOperationsTests } from './suites/tokenReleaseAndWithdrawOperations';
import { unlockOperationsTests } from './suites/unlockOperations';
import { verificationTests } from './suites/verification';
import { withdrawOperationsTests } from './suites/withdrawOperations';

const VARIANTS = [
  VARIANT_PUSH,
  VARIANT_PULL,
  VARIANT_ARB_PUSH,
  VARIANT_ARB_PULL,
  VARIANT_MIN_PUSH,
  VARIANT_MIN_PULL,
] as const;

function suiteFor<const V extends VariantName>(variant: VariantConfig<V>) {
  describe(`SmartInvoiceEscrow - ${variant.label}`, function () {
    let ctx: SuiteCtx<V>;

    beforeEach(async function () {
      ctx = await createSuiteContext(variant);
    });

    basicFunctionalityTests<V>(() => ctx);
    fundingStatusTests<V>(() => ctx);
    releaseOperationsTests<V>(() => ctx);
    addressUpdateFunctionalityTests<V>(() => ctx);
    tokenReleaseAndWithdrawOperationsTests<V>(() => ctx);
    lockAndResolveOperationsTests<V>(() => ctx);
    unlockOperationsTests<V>(() => ctx);
    withdrawOperationsTests<V>(() => ctx);
    arbitrationOperationsTests<V>(() => ctx);
    evidenceAndAppealOperationsTests<V>(() => ctx);
    ethOperationsTests<V>(() => ctx);
    verificationTests<V>(() => ctx);
    milestoneManagementTests<V>(() => ctx);
    additionalErrorHandlingAndEdgeCasesTests<V>(() => ctx);
    feeSystemTests<V>(() => ctx);
  });
}

// Iterate with the generic wrapper so V is inferred for each element:
VARIANTS.forEach(v => suiteFor(v));
