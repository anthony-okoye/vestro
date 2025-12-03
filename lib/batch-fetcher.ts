/**
 * Utility for batching and parallelizing data fetching operations
 * Improves performance by fetching multiple items concurrently
 */

/**
 * Batch fetch items with a maximum concurrency limit
 * Prevents overwhelming external APIs with too many simultaneous requests
 */
export async function batchFetch<T, R>(
  items: T[],
  fetcher: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    onError?: (item: T, error: Error) => void;
  } = {}
): Promise<R[]> {
  const { batchSize = 5, onError } = options;
  const results: R[] = [];

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map((item) => fetcher(item))
    );

    // Collect successful results and handle errors
    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else if (onError) {
        onError(batch[index], result.reason);
      }
    });
  }

  return results;
}

/**
 * Fetch multiple items in parallel with Promise.all
 * Use when all items must succeed or you want to handle failures individually
 */
export async function parallelFetch<T, R>(
  items: T[],
  fetcher: (item: T) => Promise<R>
): Promise<Array<R | null>> {
  const results = await Promise.allSettled(
    items.map((item) => fetcher(item))
  );

  return results.map((result) =>
    result.status === "fulfilled" ? result.value : null
  );
}

/**
 * Fetch with timeout to prevent hanging requests
 */
export async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string = "Request timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutError)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry a failed fetch operation with exponential backoff
 */
export async function retryFetch<T>(
  fetcher: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (!shouldRetry(lastError) || attempt === maxRetries - 1) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Batch stock quotes fetching
 * Fetches multiple stock quotes in parallel with batching
 */
export async function batchFetchStockQuotes<T>(
  tickers: string[],
  quoteFetcher: (ticker: string) => Promise<T>,
  batchSize: number = 10
): Promise<Map<string, T>> {
  const results = new Map<string, T>();

  const quotes = await batchFetch(
    tickers,
    quoteFetcher,
    {
      batchSize,
      onError: (ticker, error) => {
        console.warn(`Failed to fetch quote for ${ticker}:`, error.message);
      },
    }
  );

  // Map results back to tickers
  quotes.forEach((quote, index) => {
    if (index < tickers.length) {
      results.set(tickers[index], quote);
    }
  });

  return results;
}
