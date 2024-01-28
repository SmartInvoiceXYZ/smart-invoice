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
