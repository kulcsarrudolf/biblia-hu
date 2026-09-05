/**
 * Throttled HTTP client for the Károli scraper.
 *
 * The source site publishes `Crawl-delay: 10` in its robots.txt, so the
 * fetcher serializes every request and keeps at least `delayMs` between two
 * request starts. Transient failures (network errors, 429, 5xx) are retried
 * with an exponential backoff, everything else fails fast.
 *
 * Build time tooling, never shipped.
 */

/** A response status worth retrying: 429 or 5xx. */
export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** A response status that will not change on a retry: any 4xx other than 429. */
export class FatalHttpError extends HttpError {
  constructor(status: number, url: string) {
    super(status, url);
    this.name = 'FatalHttpError';
  }
}

/** How the fetcher is configured. Every field has a polite default. */
export interface FetcherOptions {
  /** Minimum milliseconds between two request starts. Defaults to 10000. */
  delayMs?: number;
  /** How many times a transient failure is retried. Defaults to 3. */
  retries?: number;
  /** Value of the User-Agent header. */
  userAgent?: string;
}

/** Fetches one URL and returns the response body as text. */
export type FetchHtml = (url: string) => Promise<string>;

export const DEFAULT_DELAY_MS = 10_000;
export const DEFAULT_RETRIES = 3;
export const DEFAULT_USER_AGENT =
  'biblia-hu-scraper/1.0 (+https://github.com/kulcsarrudolf/biblia-hu)';

/** Backoff before retry n (1 based): 2s, 4s, 8s, and so on. */
const backoffMs = (attempt: number): number => 2_000 * 2 ** (attempt - 1);

const sleep = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

/** A status the site may recover from on its own. */
const isRetryableStatus = (status: number): boolean => status === 429 || status >= 500;

/**
 * Creates a fetcher that respects the crawl delay across all of its calls.
 *
 * Calls are serialized through a promise chain, so concurrent callers queue up
 * instead of bursting. The delay is measured from request start to request
 * start, which means a slow response does not add to the wait.
 */
export const createFetcher = (options: FetcherOptions = {}): FetchHtml => {
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  let lastStart = 0;
  let queue: Promise<void> = Promise.resolve();

  const requestOnce = async (url: string): Promise<string> => {
    await sleep(lastStart + delayMs - Date.now());
    lastStart = Date.now();

    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'text/html' },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw isRetryableStatus(response.status)
        ? new HttpError(response.status, url)
        : new FatalHttpError(response.status, url);
    }

    return response.text();
  };

  const request = async (url: string): Promise<string> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await requestOnce(url);
      } catch (error) {
        if (error instanceof FatalHttpError) throw error;
        lastError = error;
        if (attempt === retries) break;
        await sleep(backoffMs(attempt + 1));
      }
    }

    throw lastError;
  };

  return (url: string): Promise<string> => {
    const result = queue.then(() => request(url));
    // Keep the chain alive even when this request rejects.
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
};
