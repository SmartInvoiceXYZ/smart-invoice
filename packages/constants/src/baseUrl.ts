const { NODE_ENV } = process.env;

const { SI_BASE_URL } = process.env;

const DEFAULT_BASE_URL = 'https://app.smartinvoice.xyz';

/**
 * BASE_URL resolution order:
 * 1. __SI_BASE_URL__  (injected at build-time)
 * 2. process.env.SI_BASE_URL (runtime override)
 * 3. "https://app.smartinvoice.xyz" (default)
 */
function resolveBaseUrl(): string {
  // pick value from constants/env
  const raw =
    typeof __SI_BASE_URL__ !== 'undefined' && !!__SI_BASE_URL__
      ? __SI_BASE_URL__
      : (SI_BASE_URL ?? DEFAULT_BASE_URL);

  // validate format
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    const msg = `[smartinvoicexyz:constants] Invalid BASE_URL "${raw}". Must be a valid absolute URL (e.g., https://example.com).`;
    if (NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      // eslint-disable-next-line no-console
      console.warn(msg);
      return DEFAULT_BASE_URL;
    }
  }

  // ensure it does NOT end with a trailing slash
  const clean = url.href.endsWith('/') ? url.href.slice(0, -1) : url.href;

  return clean;
}

export const BASE_URL = resolveBaseUrl();
