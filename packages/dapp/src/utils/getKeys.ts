export const getKeys = <T extends string | number | symbol>(
  record: Record<T, any>,
) => Object.keys(record) as T[];
