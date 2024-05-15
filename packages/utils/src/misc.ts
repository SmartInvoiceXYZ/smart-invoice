export const getKeys = <T extends string | number | symbol>(
  record: Record<T, any>,
) => Object.keys(record) as T[];

export function hashCode(s?: string) {
  if (!s) return 0;
  let h = 0;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < s.length; i++)
    // eslint-disable-next-line no-bitwise
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
