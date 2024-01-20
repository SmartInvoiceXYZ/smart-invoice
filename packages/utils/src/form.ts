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
        required: (value as any)?.tests.some((t: any) => t.name === 'required'),
      };
    },
  );

  return {
    schema: localSchema,
    isRequired,
  };
};
