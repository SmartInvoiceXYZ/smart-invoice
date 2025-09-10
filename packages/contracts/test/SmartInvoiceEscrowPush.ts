import {
  createSuiteContext,
  VARIANT_ARB_PUSH,
  VARIANT_MIN_PUSH,
  VARIANT_PUSH,
} from './helpers/variants';
import { basicFunctionalityTests } from './suites/basicFunctionality';

const PUSH_VARIANTS = [
  VARIANT_PUSH,
  VARIANT_ARB_PUSH,
  VARIANT_MIN_PUSH,
] as const;

PUSH_VARIANTS.forEach(variant => {
  // eslint-disable-next-line mocha/no-setup-in-describe
  describe(`SmartInvoiceEscrow - ${variant.label}`, function () {
    let ctx: Awaited<ReturnType<typeof createSuiteContext>>;

    beforeEach(async function () {
      ctx = await createSuiteContext(variant);
    });

    // Basic Functionality Tests
    // eslint-disable-next-line mocha/no-setup-in-describe
    basicFunctionalityTests(() => ctx);

    // TODO: Add other test suites as we refactor them
  });
});
