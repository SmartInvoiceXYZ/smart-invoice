// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logError = (message?: any, ...optionalParams: any[]) => {
  // eslint-disable-next-line no-console
  console.error(message, optionalParams);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logDebug = (message?: any, ...optionalParams: any[]) => {
  if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
    // eslint-disable-next-line no-console
    console.debug(message, optionalParams);
  }
};
