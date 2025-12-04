import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";
import { createCachedFetcher, CACHE_CONFIG } from "../cache-config";
import {
  ConfigurationError,
  RateLimitError,
  NetworkError,
  ValidationError,
  NotFoundError,
  ErrorLogger,
} from "../api-error";

/**
 * Financial statement data from FMP
 */
export interface FinancialStatement {
  symbol: string;
  date: Date;
  period: 'annual' | 'quarter';
  revenue: number;
  netIncome: number;
  eps: number;
  assets: number;
  liabilities: number;
  equity: number;
  operatingCashFlow: number;
  source: string;
}

/**
 * Company profile data from FMP
 */
export interface FMPCompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  source: string;
}

/**
 * Key metrics and valuation ratios from FMP
 */
export interface KeyMetrics {
  symbol: string;
  date: Date;
  peRatio: number | null;
  pbRatio: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
  dividendYield: number | null;
  source: string;
}

/**
 * Adapter for Financial Modeling Prep API
 * Fetches financial statements, company profiles, and valuation metrics
 * 
 * Rate Limits:
 * - Free tier: 250 requests per day
 * - Starter: 750 requests per day
 * - Professional: 3000 requests per day
 */
export class FinancialModelingPrepAdapter extends BaseDataSourceAdapter {
  sourceName = "Financial Modeling Prep";
  private apiKey: string;
  private dailyRequestCount: number = 0;
  private dailyResetTime: Date;
  private errorLogger = ErrorLogger.getInstance();

  /**
   * Initialize Financial Modeling Prep adapter
   * @throws {ConfigurationError} If API key is missing or empty
   */
  constructor(apiKey?: string) {
    // FMP uses daily rate limits, so we set a high per-minute limit
    // The actual limiting is done by tracking daily requests
    super("https://financialmodelingprep.com/api/v3", 250);
    
    this.apiKey = apiKey || process.env.FMP_API_KEY || "";
    
    // Validate API key on initialization
    if (!this.apiKey || this.apiKey.trim() === "") {
      const error = new ConfigurationError(
        "Financial Modeling Prep API key is required. Set FMP_API_KEY environment variable.",
        this.sourceName
      );
      this.errorLogger.log(error);
      throw error;
    }

    // Set daily reset time to midnight UTC
    this.dailyResetTime = this.getNextMidnightUTC();
  }

  /**
   * Get the next midnight UTC time
   */
  private getNextMidnightUTC(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Check if the adapter is properly configured
   * @returns true if API key is set
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== "";
  }

  /**
   * Override enforceRateLimit to implement daily rate limiting
   */
  protected async enforceRateLimit(): Promise<void> {
    const now = new Date();
    
    // Reset counter if we've passed the daily reset time
    if (now >= this.dailyResetTime) {
      this.dailyRequestCount = 0;
      this.dailyResetTime = this.getNextMidnightUTC();
    }

    // Check if we've exceeded the daily limit (250 for free tier)
    if (this.dailyRequestCount >= 250) {
      const waitTime = this.dailyResetTime.getTime() - now.getTime();
      const error = new RateLimitError(
        `FMP daily rate limit exceeded. Resets at ${this.dailyResetTime.toISOString()}`,
        this.sourceName,
        Math.ceil(waitTime / 1000)
      );
      this.errorLogger.log(error, { dailyRequestCount: this.dailyRequestCount, resetTime: this.dailyResetTime });
      throw error;
    }

    this.dailyRequestCount++;
  }

  /**
   * Fetch income statement for a symbol
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @param period - 'annual' or 'quarter'
   * @param limit - Number of periods to fetch (default: 5)
   * @returns Array of financial statements with income data
   */
  async getIncomeStatement(
    symbol: string,
    period: 'annual' | 'quarter' = 'annual',
    limit: number = 5
  ): Promise<FinancialStatement[]> {
    return this.getIncomeStatementCached(symbol, period, limit);
  }

  /**
   * Cached version of getIncomeStatement
   * Cache for 24 hours (financial statements update infrequently)
   */
  private getIncomeStatementCached = createCachedFetcher(
    async (symbol: string, period: 'annual' | 'quarter', limit: number): Promise<FinancialStatement[]> => {
      try {
        const request: DataRequest = {
          endpoint: "/income-statement/" + symbol.toUpperCase(),
          params: {
            period,
            limit,
          },
        };

        const response = await this.fetch(request);
        const statements = this.parseIncomeStatements(response.data, symbol, period);

        return statements;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch income statement for ${symbol}: ${errorMessage}`
        );
      }
    },
    "fmp-income-statement",
    CACHE_CONFIG.FINANCIAL_STATEMENTS
  );

  /**
   * Fetch balance sheet for a symbol
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @param period - 'annual' or 'quarter'
   * @param limit - Number of periods to fetch (default: 5)
   * @returns Array of financial statements with balance sheet data
   */
  async getBalanceSheet(
    symbol: string,
    period: 'annual' | 'quarter' = 'annual',
    limit: number = 5
  ): Promise<FinancialStatement[]> {
    return this.getBalanceSheetCached(symbol, period, limit);
  }

  /**
   * Cached version of getBalanceSheet
   * Cache for 24 hours
   */
  private getBalanceSheetCached = createCachedFetcher(
    async (symbol: string, period: 'annual' | 'quarter', limit: number): Promise<FinancialStatement[]> => {
      try {
        const request: DataRequest = {
          endpoint: "/balance-sheet-statement/" + symbol.toUpperCase(),
          params: {
            period,
            limit,
          },
        };

        const response = await this.fetch(request);
        const statements = this.parseBalanceSheets(response.data, symbol, period);

        return statements;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch balance sheet for ${symbol}: ${errorMessage}`
        );
      }
    },
    "fmp-balance-sheet",
    CACHE_CONFIG.FINANCIAL_STATEMENTS
  );

  /**
   * Fetch cash flow statement for a symbol
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @param period - 'annual' or 'quarter'
   * @param limit - Number of periods to fetch (default: 5)
   * @returns Array of financial statements with cash flow data
   */
  async getCashFlowStatement(
    symbol: string,
    period: 'annual' | 'quarter' = 'annual',
    limit: number = 5
  ): Promise<FinancialStatement[]> {
    return this.getCashFlowStatementCached(symbol, period, limit);
  }

  /**
   * Cached version of getCashFlowStatement
   * Cache for 24 hours
   */
  private getCashFlowStatementCached = createCachedFetcher(
    async (symbol: string, period: 'annual' | 'quarter', limit: number): Promise<FinancialStatement[]> => {
      try {
        const request: DataRequest = {
          endpoint: "/cash-flow-statement/" + symbol.toUpperCase(),
          params: {
            period,
            limit,
          },
        };

        const response = await this.fetch(request);
        const statements = this.parseCashFlowStatements(response.data, symbol, period);

        return statements;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch cash flow statement for ${symbol}: ${errorMessage}`
        );
      }
    },
    "fmp-cash-flow-statement",
    CACHE_CONFIG.FINANCIAL_STATEMENTS
  );

  /**
   * Parse income statement data from FMP API response
   * @param data - Raw API response data (array of income statements)
   * @param symbol - Stock ticker symbol
   * @param period - 'annual' or 'quarter'
   * @returns Array of parsed financial statements
   */
  private parseIncomeStatements(
    data: any,
    symbol: string,
    period: 'annual' | 'quarter'
  ): FinancialStatement[] {
    if (!Array.isArray(data) || data.length === 0) {
      const error = new NotFoundError(
        `No income statement data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, period, endpoint: "income-statement" });
      throw error;
    }

    return data.map((item: any) => ({
      symbol: item.symbol || symbol.toUpperCase(),
      date: new Date(item.date || item.fillingDate),
      period,
      revenue: item.revenue || 0,
      netIncome: item.netIncome || 0,
      eps: item.eps || item.epsdiluted || 0,
      // These will be filled from balance sheet
      assets: 0,
      liabilities: 0,
      equity: 0,
      // This will be filled from cash flow
      operatingCashFlow: 0,
      source: this.sourceName,
    }));
  }

  /**
   * Parse balance sheet data from FMP API response
   * @param data - Raw API response data (array of balance sheets)
   * @param symbol - Stock ticker symbol
   * @param period - 'annual' or 'quarter'
   * @returns Array of parsed financial statements
   */
  private parseBalanceSheets(
    data: any,
    symbol: string,
    period: 'annual' | 'quarter'
  ): FinancialStatement[] {
    if (!Array.isArray(data) || data.length === 0) {
      const error = new NotFoundError(
        `No balance sheet data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, period, endpoint: "balance-sheet" });
      throw error;
    }

    return data.map((item: any) => ({
      symbol: item.symbol || symbol.toUpperCase(),
      date: new Date(item.date || item.fillingDate),
      period,
      // These will be filled from income statement
      revenue: 0,
      netIncome: 0,
      eps: 0,
      assets: item.totalAssets || 0,
      liabilities: item.totalLiabilities || 0,
      equity: item.totalStockholdersEquity || item.totalEquity || 0,
      // This will be filled from cash flow
      operatingCashFlow: 0,
      source: this.sourceName,
    }));
  }

  /**
   * Parse cash flow statement data from FMP API response
   * @param data - Raw API response data (array of cash flow statements)
   * @param symbol - Stock ticker symbol
   * @param period - 'annual' or 'quarter'
   * @returns Array of parsed financial statements
   */
  private parseCashFlowStatements(
    data: any,
    symbol: string,
    period: 'annual' | 'quarter'
  ): FinancialStatement[] {
    if (!Array.isArray(data) || data.length === 0) {
      const error = new NotFoundError(
        `No cash flow statement data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, period, endpoint: "cash-flow-statement" });
      throw error;
    }

    return data.map((item: any) => ({
      symbol: item.symbol || symbol.toUpperCase(),
      date: new Date(item.date || item.fillingDate),
      period,
      // These will be filled from income statement
      revenue: 0,
      netIncome: 0,
      eps: 0,
      // These will be filled from balance sheet
      assets: 0,
      liabilities: 0,
      equity: 0,
      operatingCashFlow: item.operatingCashFlow || 0,
      source: this.sourceName,
    }));
  }

  /**
   * Fetch company profile for a symbol
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @returns Company profile with basic information
   */
  async getCompanyProfile(symbol: string): Promise<FMPCompanyProfile> {
    return this.getCompanyProfileCached(symbol);
  }

  /**
   * Cached version of getCompanyProfile
   * Cache for 7 days (company profiles rarely change)
   */
  private getCompanyProfileCached = createCachedFetcher(
    async (symbol: string): Promise<FMPCompanyProfile> => {
      try {
        const request: DataRequest = {
          endpoint: "/profile/" + symbol.toUpperCase(),
          params: {},
        };

        const response = await this.fetch(request);
        const profile = this.parseCompanyProfile(response.data, symbol);

        return profile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch company profile for ${symbol}: ${errorMessage}`
        );
      }
    },
    "fmp-company-profile",
    CACHE_CONFIG.COMPANY_PROFILES
  );

  /**
   * Fetch key metrics and valuation ratios for a symbol
   * @param symbol - Stock ticker symbol (e.g., "AAPL")
   * @param period - 'annual' or 'quarter'
   * @param limit - Number of periods to fetch (default: 5)
   * @returns Array of key metrics for multiple periods
   */
  async getKeyMetrics(
    symbol: string,
    period: 'annual' | 'quarter' = 'annual',
    limit: number = 5
  ): Promise<KeyMetrics[]> {
    return this.getKeyMetricsCached(symbol, period, limit);
  }

  /**
   * Cached version of getKeyMetrics
   * Cache for 24 hours
   */
  private getKeyMetricsCached = createCachedFetcher(
    async (symbol: string, period: 'annual' | 'quarter', limit: number): Promise<KeyMetrics[]> => {
      try {
        const request: DataRequest = {
          endpoint: "/key-metrics/" + symbol.toUpperCase(),
          params: {
            period,
            limit,
          },
        };

        const response = await this.fetch(request);
        const metrics = this.parseKeyMetrics(response.data, symbol);

        return metrics;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch key metrics for ${symbol}: ${errorMessage}`
        );
      }
    },
    "fmp-key-metrics",
    CACHE_CONFIG.VALUATION_DATA
  );

  /**
   * Parse company profile data from FMP API response
   * @param data - Raw API response data (array with single profile)
   * @param symbol - Stock ticker symbol
   * @returns Parsed company profile
   */
  private parseCompanyProfile(data: any, symbol: string): FMPCompanyProfile {
    // FMP returns an array with a single profile object
    const profile = Array.isArray(data) ? data[0] : data;

    if (!profile || Object.keys(profile).length === 0) {
      const error = new NotFoundError(
        `No company profile data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, endpoint: "profile" });
      throw error;
    }

    return {
      symbol: profile.symbol || symbol.toUpperCase(),
      name: profile.companyName || profile.name || symbol.toUpperCase(),
      description: profile.description || "",
      sector: profile.sector || "Unknown",
      industry: profile.industry || "Unknown",
      marketCap: profile.mktCap || profile.marketCap || 0,
      source: this.sourceName,
    };
  }

  /**
   * Parse key metrics data from FMP API response
   * Handles multi-period data correctly
   * @param data - Raw API response data (array of metrics)
   * @param symbol - Stock ticker symbol
   * @returns Array of parsed key metrics
   */
  private parseKeyMetrics(data: any, symbol: string): KeyMetrics[] {
    if (!Array.isArray(data) || data.length === 0) {
      const error = new NotFoundError(
        `No key metrics data found for ${symbol}`,
        this.sourceName
      );
      this.errorLogger.log(error, { symbol, endpoint: "key-metrics" });
      throw error;
    }

    // Helper to parse numeric values, handling null/undefined gracefully
    const parseNumeric = (value: any): number | null => {
      if (value === null || value === undefined || value === "-" || value === "None") {
        return null;
      }
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    return data.map((item: any) => ({
      symbol: item.symbol || symbol.toUpperCase(),
      date: new Date(item.date || item.period),
      peRatio: parseNumeric(item.peRatio),
      pbRatio: parseNumeric(item.pbRatio),
      debtToEquity: parseNumeric(item.debtToEquity),
      returnOnEquity: parseNumeric(item.roe),
      dividendYield: parseNumeric(item.dividendYield),
      source: this.sourceName,
    }));
  }

  /**
   * Perform the actual HTTP fetch with FMP API
   * Implements retry logic with exponential backoff for network failures
   * 
   * Retry behavior:
   * - Network errors: Retried up to 3 times with exponential backoff (1s, 2s, 4s)
   * - Rate limit errors: Retried after waiting the suggested time
   * - Validation errors: Not retried (thrown immediately)
   * 
   * @param request - The data request to perform
   * @returns The data response
   * @throws {NetworkError} For connection failures (retryable)
   * @throws {RateLimitError} For rate limit errors
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
      // Check for rate limit errors (HTTP 429)
      if (response.status === 429) {
        const rateLimitError = new RateLimitError(
          `FMP rate limit exceeded: ${response.statusText}`,
          this.sourceName,
          3600 // Suggest waiting 1 hour
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
    if (data.Error) {
      const validationError = new ValidationError(
        `FMP API Error: ${data.Error}`,
        this.sourceName
      );
      this.errorLogger.log(validationError, { endpoint: request.endpoint, error: data.Error });
      throw validationError;
    }

    if (data["Error Message"]) {
      const validationError = new ValidationError(
        `FMP API Error: ${data["Error Message"]}`,
        this.sourceName
      );
      this.errorLogger.log(validationError, { endpoint: request.endpoint, error: data["Error Message"] });
      throw validationError;
    }

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }
}
