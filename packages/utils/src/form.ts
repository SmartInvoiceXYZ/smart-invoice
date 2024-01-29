import { INVOICE_TYPES } from '@smart-invoice/constants';
import { ChangeEvent } from '@smart-invoice/types';
import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const schemaContext = (schema: any, defaultValues: any) => {
  if (!schema) {
    throw new Error('Schema is required');
  }
  const localSchema = schema;

  const isRequired = (name: string) => {
    return schema[name].required;
  };

  Object.entries(schema.describe({ value: defaultValues }).fields).forEach(
    ([key, value]) => {
      localSchema[key] = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        required: (value as any)?.tests.some((t: any) => t.name === 'required'),
      };
    },
  );

  return {
    schema: localSchema,
    isRequired,
  };
};

const checkedAtIndex = (index: number, checked: boolean[]) =>
  _.map(checked, (_c, i) => i <= index);

export const getUpdatedCheckAmount = ({
  e,
  i,
  invoice,
  previousChecked,
}: {
  e: ChangeEvent<HTMLInputElement>;
  i: number;
  previousChecked: boolean[];
  invoice: any; // InvoiceDetails;
}) => {
  const { amounts, deposited, invoiceType } = _.pick(invoice, [
    'amounts',
    'deposited',
    'invoiceType',
  ]);

  const updateChecked = e.target.checked
    ? checkedAtIndex(i, previousChecked)
    : checkedAtIndex(i - 1, previousChecked);
  // calculate values
  const sumChecked = amounts?.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tot: any, cur: any, ind: any) =>
      updateChecked[ind] ? tot + BigInt(cur) : tot,
    BigInt(0),
  );
  const updateAmount =
    deposited && sumChecked > BigInt(deposited)
      ? sumChecked - BigInt(deposited)
      : BigInt(0);

  if (invoiceType === INVOICE_TYPES.Instant) {
    return {
      updateChecked,
      updateAmount: sumChecked,
    };
  }

  return { updateAmount, updateChecked };
};
