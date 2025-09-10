/* eslint-disable mocha/no-setup-in-describe */
import {
  createSuiteContext,
  SuiteCtx,
  VariantConfig,
  VariantName,
  VARIANTS,
} from './helpers';
import { addressUpdateFunctionalityTests } from './suites/addressUpdateFunctionality';
import { basicFunctionalityTests } from './suites/basicFunctionality';
import { fundingStatusTests } from './suites/fundingStatus';
import { releaseOperationsTests } from './suites/releaseOperations';

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

    // TODO: Add other test suites as we refactor them
  });
}

// Iterate with the generic wrapper so V is inferred for each element:
VARIANTS.forEach(v => suiteFor(v));
