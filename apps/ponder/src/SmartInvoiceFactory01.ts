import { ponder } from 'ponder:registry';

ponder.on(
  'SmartInvoiceFactory01:AddImplementation',
  async ({ event, context }) => {
    console.log(event.args);
  },
);

ponder.on('SmartInvoiceFactory01:LogNewInvoice', async ({ event, context }) => {
  console.log(event.args);
});

ponder.on(
  'SmartInvoiceFactory01:RoleAdminChanged',
  async ({ event, context }) => {
    console.log(event.args);
  },
);

ponder.on('SmartInvoiceFactory01:RoleGranted', async ({ event, context }) => {
  console.log(event.args);
});
