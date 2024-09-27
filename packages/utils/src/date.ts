export function handleEpoch(value: number): Date {
  // If the value is too small to be in milliseconds, assume it's in seconds
  if (value < 1e10) {
    // Convert seconds to milliseconds
    // eslint-disable-next-line no-param-reassign
    value *= 1000;
  }
  return new Date(value);
}

export function parseToDate(input: number | string | Date | bigint): Date {
  if (input instanceof Date) {
    return input;
  }

  if (typeof input === 'number') {
    return handleEpoch(input);
  }

  if (typeof input === 'bigint') {
    return handleEpoch(Number(input));
  }

  const parsedDate = new Date(input);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const asNumber = Number(input);
  if (!Number.isNaN(asNumber)) {
    return handleEpoch(asNumber);
  }

  // Fallback to current date if all else fails
  return new Date();
}
export const sevenDaysFromNow = () => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() + 7);
  return localDate;
};

export const oneMonthFromNow = () => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() + 31);
  return localDate;
};

export const sevenDaysFromDate = (date: string | number | Date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 7);
  return result;
};

export const unixToDateTime = (d: number | string | Date): string => {
  const date = parseToDate(d);

  const humanDateFormat = date.toLocaleString();

  return humanDateFormat;
};

export const dateTimeToDate = (dateTime: string) => dateTime.split(',')[0];

export const getDateString = (d: number | string | Date) => {
  const date = parseToDate(d);
  const ye = new Intl.DateTimeFormat('en', {
    year: 'numeric',
  }).format(date);
  const mo = new Intl.DateTimeFormat('en', {
    month: 'long',
  }).format(date);
  const da = new Intl.DateTimeFormat('en', {
    day: '2-digit',
  }).format(date);
  return `${mo} ${da}, ${ye}`;
};

export const formatDate = (d: number | string | Date) => {
  const date = parseToDate(d);

  let month = `${date.getUTCMonth() + 1}`;
  if (month.length < 2) month = `0${month}`;

  let day = `${date.getUTCDate()}`;
  if (day.length < 2) day = `0${day}`;

  const year = date.getUTCFullYear();

  return [year, month, day].join('-');
};
