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
 * Stock quote data from Alpha Vantage
 */
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: string;
}

/**
 * Company profile and fundamental data from Alpha Vantage
 */
export interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  beta: number | null;
  source: string;
}

/**
 * Adapter for Alpha Vantage API
 * Fetches stock quotes and company fundamentals
 * 
 * Rate Limits:
 * - Free tier: 5 requests per minute, 500 per day
 * - Premium: 75 requests per minute, 75,000 per day
 */
export class AlphaVantageAdapter extends BaseDataSourceAdapter {
  sourceName = "Alpha Vantage";
  private apiKey: string;
  private errorLogger = ErrorLogger.getInstance();

  /**
   * Initialize Alpha Vantage adapter
   * @throws {ConfigurationError} If API key is missing or empty
   */
  constructor(apiKey?: string) {
    super("https://www.alphavantage.co", 5); // 5 requests per minute for free tier
    
    this.apiKey = apiKey !== undefined ? apiKey : (process.env.ALPHA_VANTAGE_API_KEY || "");
    
    // Validate API key on initialization
    if (!this.apiKey || this.apiKey.trim() === "") {
      const error = new ConfigurationError(
        "Alpha Vantage API key is required. Set ALPHA_VANTAGE_API_KEY environment variable.",
        this.sourceName
      );
      this.errorLogger.log(error);
      throw error;
    }
  }

  /**
   * Check if the adapter is properly configured
   * @returns true if API key is set
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== "";
  }

  /**
   * Fetch real-time stock quote for a symbol
   * Uses the GLOBAL_QUOTE endpoint
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @returns Stock quote with current price, change, and volume
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    return this.getQuoteCached(symbol);
  }

  /**
   * Cached version of getQuote
   * Cache for 15 minutes (quotes update frequently)
   */
  private getQuoteCached = createCachedFetcher(
    async (symbol: string): Promise<StockQuote> => {
      try {
        const request: DataRequest = {
          endpoint: "/query",
          params: {
            function: "GLOBAL_QUOTE",
            symbol: symbol.toUpperCase(),
          },
        };

        const response = await this.fetch(request);
        const quote = this.parseQuote(response.data, symbol);

        return quote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch quote for ${symbol}: ${errorMessage}`
        );
      }
    },
    CacheKeys.quote("dynamic"),
    { ...CACHE_CONFIG.QUOTES }
  );

  /**
   * Fetch company overview and fundamental data
   * Uses the OVERVIEW endpoint
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @returns Company profile with fundamentals
   */
  async getCompanyOverview(symbol: string): Promise<CompanyProfile> {
    return this.getCompanyOverviewCached(symbol);
  }

  /**
   * Cached version of getCompanyOverview
   * Cache for 7 days (company profiles rarely change)
   */
  private getCompanyOverviewCached = createCachedFetcher(
    async (symbol: string): Promise<CompanyProfile> => {
      try {
        const request: DataRequest = {
          endpoint: "/query",
          params: {
            function: "OVERVIEW",
            symbol: symbol.toUpperCase(),
          },
        };

        const response = await this.fetch(request);
        const profile = this.parseCompanyOverview(response.data, symbol);

        return profile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch company overview for ${symbol}: ${errorMessage}`
        );
      }
    },
    CacheKeys.companyProfile("dynamic"),
    { ...CACHE_CONFIG.COMPANY_PROFILES }
  );

  /**
   * Parse quote data from Alpha Vantage GLOBAL_QUOTE response
   * @param data - Raw API response data
   * @param symbol - Stock ticker symbol
   * @returns Parsed stock quote
   */
  private parseQuote(data: any, symbol: string): StockQuote {
    const globalQuote = data["Global Quote"];

    if (!globalQuote || Object.keys(globalQuote).length === 0) {
      const error = new NotFoundError(
        `No quote data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, endpoint: "GLOBAL_QUOTE" });
      throw error;
    }

    const price = parseFloat(globalQuote["05. price"] || "0");
    const change = parseFloat(globalQuote["09. change"] || "0");
    const changePercent = parseFloat(
      (globalQuote["10. change percent"] || "0").replace("%", "")
    );
    const volume = parseInt(globalQuote["06. volume"] || "0", 10);

    return {
      symbol: globalQuote["01. symbol"] || symbol.toUpperCase(),
      price,
      change,
      changePercent,
      volume,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }

  /**
   * Parse company overview data from Alpha Vantage OVERVIEW response
   * Handles missing or null values gracefully
   * @param data - Raw API response data
   * @param symbol - Stock ticker symbol
   * @returns Parsed company profile
   */
  private parseCompanyOverview(data: any, symbol: string): CompanyProfile {
    // Check if we have valid data
    if (!data || Object.keys(data).length === 0 || !data.Symbol) {
      const error = new NotFoundError(
        `No company overview data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, endpoint: "OVERVIEW" });
      throw error;
    }

    // Parse numeric values, handling null/undefined/"-" gracefully
    const parseNumeric = (value: any): number | null => {
      if (value === null || value === undefined || value === "-" || value === "None") {
        return null;
      }
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const marketCap = parseNumeric(data.MarketCapitalization);
    const peRatio = parseNumeric(data.PERatio);
    const dividendYield = parseNumeric(data.DividendYield);
    const beta = parseNumeric(data.Beta);

    return {
      symbol: data.Symbol || symbol.toUpperCase(),
      name: data.Name || symbol.toUpperCase(),
      description: data.Description || "",
      sector: data.Sector || "Unknown",
      industry: data.Industry || "Unknown",
      marketCap: marketCap || 0,
      peRatio,
      dividendYield: dividendYield ? dividendYield * 100 : null, // Convert to percentage
      beta,
      source: this.sourceName,
    };
  }

  /**
   * Perform the actual HTTP fetch with Alpha Vantage API
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
      apikey: this.apiKey,
    });

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
    if (data["Error Message"]) {
      const validationError = new ValidationError(
        `Alpha Vantage API Error: ${data["Error Message"]}`,
        this.sourceName
      );
      this.errorLogger.log(validationError, { endpoint: request.endpoint, errorMessage: data["Error Message"] });
      throw validationError;
    }

    // Rate limit errors - these should trigger retry with backoff
    if (data["Note"]) {
      const rateLimitError = new RateLimitError(
        `Alpha Vantage Rate Limit: ${data["Note"]}`,
        this.sourceName,
        60 // Suggest waiting 60 seconds
      );
      this.errorLogger.log(rateLimitError, { endpoint: request.endpoint });
      throw rateLimitError;
    }

    if (data["Information"]) {
      // Information message (often rate limiting)
      const rateLimitError = new RateLimitError(
        `Alpha Vantage: ${data["Information"]}`,
        this.sourceName,
        60
      );
      this.errorLogger.log(rateLimitError, { endpoint: request.endpoint });
      throw rateLimitError;
    }

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }
}
