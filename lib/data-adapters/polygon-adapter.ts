import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";
import { createCachedFetcher, CACHE_CONFIG, CacheKeys } from "../cache-config";
import {
  ConfigurationError,
  RateLimitError,
  NetworkError,
  ValidationError,
  NotFoundError,
  ErrorLogger,
} from "../api-error";

/**
 * Stock quote data from Polygon.io
 */
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: string;
  bid?: number;
  ask?: number;
}

/**
 * OHLCV bar data from Polygon.io
 */
export interface OHLCVBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Historical price data from Polygon.io
 */
export interface HistoricalData {
  symbol: string;
  bars: OHLCVBar[];
  source: string;
}

/**
 * Request queue item for rate limiting
 */
interface QueuedRequest {
  request: DataRequest;
  resolve: (value: DataResponse) => void;
  reject: (error: Error) => void;
}

/**
 * Adapter for Polygon.io API
 * Fetches real-time quotes and historical price data
 * 
 * Rate Limits:
 * - Free tier: 5 requests per minute
 * - Starter: 100 requests per minute
 * - Developer: 1000 requests per minute
 */
export class PolygonAdapter extends BaseDataSourceAdapter {
  sourceName = "Polygon.io";
  private apiKey: string;
  private pendingRequests: QueuedRequest[] = [];
  private isProcessingQueue: boolean = false;
  private errorLogger = ErrorLogger.getInstance();

  /**
   * Initialize Polygon adapter
   * @throws {ConfigurationError} If API key is missing or empty
   */
  constructor(apiKey?: string) {
    super("https://api.polygon.io", 5); // 5 requests per minute for free tier
    
    // Get API key from parameter or environment
    const key = apiKey !== undefined ? apiKey : process.env.POLYGON_API_KEY || "";
    
    // Validate API key on initialization
    if (!key || key.trim() === "") {
      const error = new ConfigurationError(
        "Polygon.io API key is required. Set POLYGON_API_KEY environment variable.",
        this.sourceName
      );
      this.errorLogger.log(error);
      throw error;
    }
    
    this.apiKey = key;
  }

  /**
   * Check if the adapter is properly configured
   * @returns true if API key is set
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== "";
  }

  /**
   * Fetch current quote for a symbol
   * Uses the last trade endpoint for real-time data
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @returns Stock quote with current price, bid, ask, and volume
   */
  async getCurrentQuote(symbol: string): Promise<StockQuote> {
    return this.getCurrentQuoteCached(symbol);
  }

  /**
   * Cached version of getCurrentQuote
   * Cache for 15 minutes (quotes update frequently)
   */
  private getCurrentQuoteCached = createCachedFetcher(
    async (symbol: string): Promise<StockQuote> => {
      try {
        const request: DataRequest = {
          endpoint: `/v2/last/trade/${symbol.toUpperCase()}`,
          params: {},
        };

        const response = await this.fetch(request);
        const quote = this.parseCurrentQuote(response.data, symbol);

        return quote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch current quote for ${symbol}: ${errorMessage}`
        );
      }
    },
    CacheKeys.quote("dynamic"),
    { revalidate: CACHE_CONFIG.QUOTES.revalidate, tags: [...CACHE_CONFIG.QUOTES.tags] }
  );

  /**
   * Fetch previous day's close for a symbol
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @returns Stock quote with previous close data
   */
  async getPreviousClose(symbol: string): Promise<StockQuote> {
    return this.getPreviousCloseCached(symbol);
  }

  /**
   * Cached version of getPreviousClose
   * Cache for 24 hours (previous close doesn't change)
   */
  private getPreviousCloseCached = createCachedFetcher(
    async (symbol: string): Promise<StockQuote> => {
      try {
        const request: DataRequest = {
          endpoint: `/v2/aggs/ticker/${symbol.toUpperCase()}/prev`,
          params: {
            adjusted: "true",
          },
        };

        const response = await this.fetch(request);
        const quote = this.parsePreviousClose(response.data, symbol);

        return quote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch previous close for ${symbol}: ${errorMessage}`
        );
      }
    },
    CacheKeys.quote("dynamic"),
    { revalidate: CACHE_CONFIG.QUOTES.revalidate, tags: [...CACHE_CONFIG.QUOTES.tags] }
  );

  /**
   * Fetch aggregated bars (OHLCV data) for a symbol
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @param timespan - Timeframe: 'day', 'week', 'month'
   * @param from - Start date
   * @param to - End date
   * @param multiplier - Multiplier for timespan (default: 1)
   * @returns Historical data with OHLCV bars
   */
  async getAggregates(
    symbol: string,
    timespan: 'day' | 'week' | 'month',
    from: Date,
    to: Date,
    multiplier: number = 1
  ): Promise<HistoricalData> {
    return this.getAggregatesCached(symbol, timespan, from, to, multiplier);
  }

  /**
   * Cached version of getAggregates
   * Cache for 24 hours (historical data doesn't change)
   */
  private getAggregatesCached = createCachedFetcher(
    async (
      symbol: string,
      timespan: 'day' | 'week' | 'month',
      from: Date,
      to: Date,
      multiplier: number
    ): Promise<HistoricalData> => {
      try {
        const fromStr = this.formatDate(from);
        const toStr = this.formatDate(to);

        const request: DataRequest = {
          endpoint: `/v2/aggs/ticker/${symbol.toUpperCase()}/range/${multiplier}/${timespan}/${fromStr}/${toStr}`,
          params: {
            adjusted: "true",
            sort: "asc",
          },
        };

        const response = await this.fetch(request);
        const historicalData = this.parseAggregates(response.data, symbol);

        return historicalData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch aggregates for ${symbol}: ${errorMessage}`
        );
      }
    },
    "polygon-aggregates",
    { revalidate: CACHE_CONFIG.HISTORICAL_DATA.revalidate, tags: [...CACHE_CONFIG.HISTORICAL_DATA.tags] }
  );

  /**
   * Fetch daily prices for a symbol
   * Helper method that uses getAggregates with daily timespan
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @param days - Number of days to fetch (default: 30)
   * @returns Historical data with daily OHLCV bars
   */
  async getDailyPrices(symbol: string, days: number = 30): Promise<HistoricalData> {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    return this.getAggregates(symbol, 'day', from, to, 1);
  }

  /**
   * Format date as YYYY-MM-DD for Polygon API
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse current quote data from Polygon last trade response
   * @param data - Raw API response data
   * @param symbol - Stock ticker symbol
   * @returns Parsed stock quote
   */
  private parseCurrentQuote(data: any, symbol: string): StockQuote {
    if (!data || !data.results) {
      const error = new NotFoundError(
        `No quote data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, endpoint: "last/trade" });
      throw error;
    }

    const result = data.results;
    const price = result.p || 0;

    return {
      symbol: result.T || symbol.toUpperCase(),
      price,
      change: 0, // Last trade doesn't include change
      changePercent: 0,
      volume: result.s || 0,
      timestamp: new Date(result.t || Date.now()),
      source: this.sourceName,
    };
  }

  /**
   * Parse previous close data from Polygon aggregates response
   * @param data - Raw API response data
   * @param symbol - Stock ticker symbol
   * @returns Parsed stock quote
   */
  private parsePreviousClose(data: any, symbol: string): StockQuote {
    if (!data || !data.results || data.results.length === 0) {
      const error = new NotFoundError(
        `No previous close data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, endpoint: "aggs/prev" });
      throw error;
    }

    const result = data.results[0];
    const close = result.c || 0;
    const open = result.o || 0;
    const change = close - open;
    const changePercent = open !== 0 ? (change / open) * 100 : 0;

    return {
      symbol: data.ticker || symbol.toUpperCase(),
      price: close,
      change,
      changePercent,
      volume: result.v || 0,
      timestamp: new Date(result.t || Date.now()),
      source: this.sourceName,
    };
  }

  /**
   * Parse aggregates data from Polygon API response
   * @param data - Raw API response data
   * @param symbol - Stock ticker symbol
   * @returns Parsed historical data with OHLCV bars
   */
  private parseAggregates(data: any, symbol: string): HistoricalData {
    if (!data || !data.results || data.results.length === 0) {
      const error = new NotFoundError(
        `No aggregate data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, endpoint: "aggs/range" });
      throw error;
    }

    const bars: OHLCVBar[] = data.results.map((bar: any) => ({
      timestamp: new Date(bar.t),
      open: bar.o || 0,
      high: bar.h || 0,
      low: bar.l || 0,
      close: bar.c || 0,
      volume: bar.v || 0,
    }));

    return {
      symbol: data.ticker || symbol.toUpperCase(),
      bars,
      source: this.sourceName,
    };
  }

  /**
   * Add a request to the queue
   * Requests are processed within rate limits
   * @param request - The data request to queue
   * @returns Promise that resolves when the request is processed
   */
  private queueRequest(request: DataRequest): Promise<DataResponse> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ request, resolve, reject });
      
      // Start processing the queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests within rate limits
   * Processes one request at a time, respecting rate limits
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.pendingRequests.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.pendingRequests.length > 0) {
      const queuedRequest = this.pendingRequests.shift();
      if (!queuedRequest) break;

      try {
        // Enforce rate limit before processing
        await this.enforceRateLimit();
        
        // Process the request
        const response = await this.performFetch(queuedRequest.request);
        queuedRequest.resolve(response);
      } catch (error) {
        queuedRequest.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Override fetch to use request queueing for rate limiting
   * @param request - The data request to perform
   * @returns The data response
   */
  async fetch(request: DataRequest): Promise<DataResponse> {
    // Use the queue for rate limiting
    return this.queueRequest(request);
  }

  /**
   * Perform the actual HTTP fetch with Polygon API
   * Implements retry logic with exponential backoff for network failures
   * Handles rate limit errors with appropriate waiting
   * @param request - The data request to perform
   * @returns The data response
   * @throws {NetworkError} For connection failures (retryable)
   * @throws {RateLimitError} For rate limit errors (retryable with delay)
   * @throws {Error} For other API errors
   */
  protected async performFetch(request: DataRequest): Promise<DataResponse> {
    const url = this.buildUrl(request.endpoint, {
      ...request.params,
      apiKey: this.apiKey,
    });

    // Debug logging
    const maskedUrl = url.replace(/apiKey=[^&]+/, 'apiKey=***MASKED***');
    console.log(`[${this.sourceName}] Fetching: ${maskedUrl}`);
    console.log(`[${this.sourceName}] API Key present: ${!!this.apiKey}, length: ${this.apiKey?.length || 0}`);

    let response: Response;
    
    try {
      response = await fetch(url, {
        headers: {
          ...request.headers,
          "User-Agent": "ResurrectionStockPicker/1.0",
        },
      });
    } catch (error) {
      // Network failure - will be retried by base adapter with exponential backoff
      const networkError = new NetworkError(
        `Network request failed: ${error instanceof Error ? error.message : String(error)}`,
        this.sourceName,
        error instanceof Error ? error : undefined
      );
      this.errorLogger.log(networkError, { endpoint: request.endpoint, params: request.params });
      throw networkError;
    }

    if (!response.ok) {
      // Check for rate limit errors (HTTP 429)
      if (response.status === 429) {
        const rateLimitError = new RateLimitError(
          `Polygon rate limit exceeded: ${response.statusText}`,
          this.sourceName,
          60 // Suggest waiting 60 seconds
        );
        this.errorLogger.log(rateLimitError, { endpoint: request.endpoint, status: response.status });
        throw rateLimitError;
      }
      
      // HTTP error - treat as network error for retry
      const networkError = new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        this.sourceName
      );
      this.errorLogger.log(networkError, { endpoint: request.endpoint, status: response.status });
      throw networkError;
    }

    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      const validationError = new ValidationError(
        `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`,
        this.sourceName,
        error instanceof Error ? error : undefined
      );
      this.errorLogger.log(validationError, { endpoint: request.endpoint });
      throw validationError;
    }

    // Check for API error responses
    if (data.error) {
      const validationError = new ValidationError(
        `Polygon API Error: ${data.error}`,
        this.sourceName
      );
      this.errorLogger.log(validationError, { endpoint: request.endpoint, error: data.error });
      throw validationError;
    }

    if (data.status === "ERROR") {
      const errorMsg = data.error || data.message || "Unknown error";
      const validationError = new ValidationError(
        `Polygon API Error: ${errorMsg}`,
        this.sourceName
      );
      this.errorLogger.log(validationError, { endpoint: request.endpoint, error: errorMsg });
      throw validationError;
    }

    // Check if we got a "NOT_FOUND" status
    if (data.status === "NOT_FOUND") {
      const notFoundError = new NotFoundError(
        `Polygon API: Data not found for ${request.endpoint}`,
        this.sourceName
      );
      this.errorLogger.log(notFoundError, { endpoint: request.endpoint });
      throw notFoundError;
    }

    // Debug: Log response summary
    console.log(`[${this.sourceName}] Response status: ${data.status}, resultsCount: ${data.resultsCount || data.results?.length || 0}`);

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }
}
