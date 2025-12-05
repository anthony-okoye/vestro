import {
  DataSourceAdapter,
  DataRequest,
  DataResponse,
  RateLimitInfo,
} from "./types";

/**
 * Base abstract class for data source adapters with retry and rate limiting
 */
export abstract class BaseDataSourceAdapter implements DataSourceAdapter {
  abstract sourceName: string;
  protected baseUrl: string;
  protected rateLimitInfo: RateLimitInfo;
  protected requestQueue: Date[] = [];

  constructor(baseUrl: string, requestsPerMinute: number = 60) {
    this.baseUrl = baseUrl;
    this.rateLimitInfo = {
      requestsPerMinute,
      requestsRemaining: requestsPerMinute,
      resetTime: new Date(Date.now() + 60000),
    };
  }

  /**
   * Fetch data with retry logic and rate limiting
   * Implements exponential backoff: 1s, 2s, 4s for retries
   * Handles rate limit errors with appropriate waiting
   */
  async fetch(request: DataRequest): Promise<DataResponse> {
    await this.enforceRateLimit();

    let lastError: Error | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.performFetch(request);
        this.updateRateLimit();
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts) {
          // Check if this is a rate limit error with a suggested retry time
          const isRateLimitError = error instanceof Error && 
            (error.name === 'RateLimitError' || 
             error.message.includes('Rate Limit') ||
             error.message.includes('rate limit'));
          
          let backoffMs: number;
          
          if (isRateLimitError) {
            // For rate limit errors, wait longer (60 seconds by default)
            // Check if error has a retryAfter property
            const retryAfter = (error as any).retryAfter;
            backoffMs = retryAfter ? retryAfter * 1000 : 60000;
            console.warn(
              `[${this.sourceName}] Rate limit error on attempt ${attempt}/${maxAttempts}. ` +
              `Waiting ${backoffMs / 1000}s before retry...`
            );
          } else {
            // For other errors, use exponential backoff: 1s, 2s, 4s
            backoffMs = this.calculateBackoff(attempt);
            console.warn(
              `[${this.sourceName}] Request failed on attempt ${attempt}/${maxAttempts}: ${lastError.message}. ` +
              `Retrying in ${backoffMs / 1000}s...`
            );
          }
          
          await this.sleep(backoffMs);
        } else {
          // Final attempt failed
          console.error(
            `[${this.sourceName}] All ${maxAttempts} attempts failed for ${request.endpoint}. ` +
            `Last error: ${lastError.message}`
          );
        }
      }
    }

    throw new Error(
      `Failed to fetch from ${this.sourceName} after ${maxAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Check if the data source is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const testRequest: DataRequest = {
        endpoint: "/",
        params: {},
      };
      await this.performFetch(testRequest);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current rate limit information
   */
  getRateLimit(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Abstract method to be implemented by specific adapters
   */
  protected abstract performFetch(request: DataRequest): Promise<DataResponse>;

  /**
   * Enforce rate limiting by waiting if necessary
   */
  protected async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requestQueue = this.requestQueue.filter(
      (timestamp) => timestamp.getTime() > oneMinuteAgo
    );

    // Check if we've exceeded the rate limit
    if (this.requestQueue.length >= this.rateLimitInfo.requestsPerMinute) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = 60000 - (now - oldestRequest.getTime());
      
      if (waitTime > 0) {
        await this.sleep(waitTime);
        // Recursively check again after waiting
        return this.enforceRateLimit();
      }
    }

    this.requestQueue.push(new Date());
  }

  /**
   * Update rate limit information after a successful request
   */
  protected updateRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Count requests in the last minute
    const recentRequests = this.requestQueue.filter(
      (timestamp) => timestamp.getTime() > oneMinuteAgo
    ).length;

    this.rateLimitInfo.requestsRemaining =
      this.rateLimitInfo.requestsPerMinute - recentRequests;

    // Update reset time to 1 minute from the oldest request
    if (this.requestQueue.length > 0) {
      const oldestRequest = this.requestQueue[0];
      this.rateLimitInfo.resetTime = new Date(
        oldestRequest.getTime() + 60000
      );
    } else {
      this.rateLimitInfo.resetTime = new Date(now + 60000);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  protected calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.pow(2, attempt - 1) * 1000;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Build full URL from endpoint and params
   */
  protected buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Ensure baseUrl ends without trailing slash and endpoint handling is correct
    let fullUrl: string;
    
    // If endpoint starts with /, we need to append it to baseUrl properly
    // new URL("/path", "https://example.com/api") incorrectly gives "https://example.com/path"
    // We want "https://example.com/api/path"
    if (endpoint.startsWith('/')) {
      // Remove trailing slash from baseUrl if present, then append endpoint
      const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
      fullUrl = base + endpoint;
    } else {
      // For relative paths without leading slash, use URL constructor
      const base = this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/';
      fullUrl = base + endpoint;
    }
    
    const url = new URL(fullUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }
}
