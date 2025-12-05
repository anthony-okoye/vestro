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

export interface EconomicData {
  seriesId: string;
  date: string;
  value: number;
  units?: string;
}

/**
 * Adapter for Federal Reserve Economic Data (FRED)
 * Fetches interest rates and other economic indicators
 */
export class FederalReserveAdapter extends BaseDataSourceAdapter {
  sourceName = "Federal Reserve FRED";
  private apiKey: string;
  private errorLogger = ErrorLogger.getInstance();

  constructor(apiKey?: string) {
    super("https://api.stlouisfed.org/fred", 120);
    this.apiKey = apiKey || process.env.FRED_API_KEY || "";
    this.validateApiKey();
  }

  /**
   * Validate that API key is configured
   * @throws {ConfigurationError} If API key is missing or empty
   */
  private validateApiKey(): void {
    if (!this.apiKey || this.apiKey.trim() === "") {
      const error = new ConfigurationError(
        "FRED API key is required. Please set FRED_API_KEY environment variable or provide it in the constructor.",
        this.sourceName
      );
      this.errorLogger.log(error);
      throw error;
    }
  }

  /**
   * Check if the adapter is properly configured
   */
  isConfigured(): boolean {
    return this.apiKey !== "" && this.apiKey.trim() !== "";
  }

  /**
   * Fetch interest rate data
   */
  async fetchInterestRate(): Promise<number> {
    return this.fetchInterestRateCached();
  }

  /**
   * Cached version of fetchInterestRate
   * Cache for 1 hour (macro data updates infrequently)
   */
  private fetchInterestRateCached = createCachedFetcher(
    async (): Promise<number> => {
      try {
        // Federal Funds Effective Rate series
        const data = await this.fetchSeries("FEDFUNDS");
        
        if (data.length === 0) {
          throw new Error("No interest rate data available");
        }

        // Return the most recent value
        return data[data.length - 1].value;
      } catch (error) {
        throw new Error(
          `Failed to fetch interest rate: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.interestRate(),
    { ...CACHE_CONFIG.MACRO_DATA }
  );

  /**
   * Fetch inflation rate data (CPI)
   */
  async fetchInflationRate(): Promise<number> {
    return this.fetchInflationRateCached();
  }

  /**
   * Cached version of fetchInflationRate
   * Cache for 1 hour (macro data updates infrequently)
   */
  private fetchInflationRateCached = createCachedFetcher(
    async (): Promise<number> => {
      try {
        // Consumer Price Index for All Urban Consumers
        const data = await this.fetchSeries("CPIAUCSL", 13); // Get 13 months for YoY calculation
        
        if (data.length < 13) {
          throw new Error("Insufficient data for inflation calculation");
        }

        // Calculate year-over-year inflation
        const current = data[data.length - 1].value;
        const yearAgo = data[data.length - 13].value;
        const inflationRate = ((current - yearAgo) / yearAgo) * 100;

        return inflationRate;
      } catch (error) {
        throw new Error(
          `Failed to fetch inflation rate: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.inflationRate(),
    { ...CACHE_CONFIG.MACRO_DATA }
  );

  /**
   * Fetch unemployment rate data
   */
  async fetchUnemploymentRate(): Promise<number> {
    return this.fetchUnemploymentRateCached();
  }

  /**
   * Cached version of fetchUnemploymentRate
   * Cache for 1 hour (macro data updates infrequently)
   */
  private fetchUnemploymentRateCached = createCachedFetcher(
    async (): Promise<number> => {
      try {
        // Unemployment Rate series
        const data = await this.fetchSeries("UNRATE");
        
        if (data.length === 0) {
          throw new Error("No unemployment data available");
        }

        return data[data.length - 1].value;
      } catch (error) {
        throw new Error(
          `Failed to fetch unemployment rate: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.unemploymentRate(),
    { ...CACHE_CONFIG.MACRO_DATA }
  );

  /**
   * Fetch a specific economic data series
   * @param seriesId - FRED series ID (e.g., "FEDFUNDS", "CPIAUCSL")
   * @param startDate - Optional start date for the series
   * @param endDate - Optional end date for the series
   * @param limit - Maximum number of observations to return
   * @returns Array of economic data observations
   */
  async getSeries(
    seriesId: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<EconomicData[]> {
    try {
      const params: Record<string, any> = {
        series_id: seriesId,
        api_key: this.apiKey,
        file_type: "json",
        sort_order: "desc",
      };

      if (startDate) {
        params.observation_start = startDate.toISOString().split("T")[0];
      }
      if (endDate) {
        params.observation_end = endDate.toISOString().split("T")[0];
      }
      if (limit) {
        params.limit = limit;
      }

      const request: DataRequest = {
        endpoint: "/series/observations",
        params,
      };

      const response = await this.fetch(request);
      return this.parseSeriesData(response.data, seriesId);
    } catch (error) {
      throw new Error(
        `Failed to fetch series ${seriesId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch multiple economic data series in batch
   * @param seriesIds - Array of FRED series IDs
   * @param startDate - Optional start date for all series
   * @param endDate - Optional end date for all series
   * @returns Map of series ID to array of economic data
   */
  async getMultipleSeries(
    seriesIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string, EconomicData[]>> {
    const results = new Map<string, EconomicData[]>();

    // Fetch all series in parallel
    const promises = seriesIds.map(async (seriesId) => {
      try {
        const data = await this.getSeries(seriesId, startDate, endDate);
        return { seriesId, data };
      } catch (error) {
        // Log error but don't fail the entire batch
        console.error(`Failed to fetch series ${seriesId}:`, error);
        return { seriesId, data: [] };
      }
    });

    const settled = await Promise.all(promises);

    settled.forEach(({ seriesId, data }) => {
      results.set(seriesId, data);
    });

    return results;
  }

  /**
   * Fetch the most recent value for a series
   * @param seriesId - FRED series ID
   * @returns The most recent observation value
   */
  async getLatestValue(seriesId: string): Promise<number> {
    const data = await this.getSeries(seriesId, undefined, undefined, 1);

    if (data.length === 0) {
      const error = new NotFoundError(
        `No data available for series ${seriesId}`,
        this.sourceName
      );
      this.errorLogger.log(error, { seriesId });
      throw error;
    }

    return data[0].value;
  }

  /**
   * Fetch a specific economic data series (legacy method for backward compatibility)
   * @deprecated Use getSeries() instead
   */
  async fetchSeries(seriesId: string, limit: number = 1): Promise<EconomicData[]> {
    return this.getSeries(seriesId, undefined, undefined, limit);
  }

  /**
   * Perform the actual HTTP fetch
   */
  protected async performFetch(request: DataRequest): Promise<DataResponse> {
    const url = this.buildUrl(request.endpoint, request.params);

    // Debug: Log the URL being called (mask API key for security)
    const maskedUrl = url.replace(/api_key=[^&]+/, 'api_key=***MASKED***');
    console.log(`[${this.sourceName}] Fetching: ${maskedUrl}`);
    console.log(`[${this.sourceName}] API Key present: ${!!this.apiKey}, length: ${this.apiKey?.length || 0}`);

    let response: Response;
    
    try {
      response = await fetch(url);
    } catch (error) {
      const networkError = new NetworkError(
        `Network request failed: ${error instanceof Error ? error.message : String(error)}`,
        this.sourceName,
        error instanceof Error ? error : undefined
      );
      this.errorLogger.log(networkError, { endpoint: request.endpoint, params: request.params });
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

    // Check for FRED API errors in the response
    if (data.error_code || data.error_message) {
      this.throwFredError(data.error_code, data.error_message, response.status, request.endpoint);
    }

    if (!response.ok) {
      const networkError = new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        this.sourceName
      );
      this.errorLogger.log(networkError, { endpoint: request.endpoint, status: response.status });
      throw networkError;
    }

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }

  /**
   * Parse and throw descriptive FRED API errors
   * @param errorCode - FRED error code
   * @param errorMessage - FRED error message
   * @param httpStatus - HTTP status code
   * @param endpoint - API endpoint for logging
   */
  private throwFredError(errorCode: string, errorMessage: string, httpStatus: number, endpoint: string): never {
    const code = errorCode || "UNKNOWN_ERROR";
    const message = errorMessage || "Unknown error occurred";

    // Map common FRED error codes to descriptive messages
    const errorMap: Record<string, string> = {
      "400": "Bad Request - Invalid parameters provided",
      "401": "Unauthorized - Invalid or missing API key",
      "404": "Not Found - Series or endpoint does not exist",
      "429": "Rate Limit Exceeded - Too many requests",
      "500": "Internal Server Error - FRED API is experiencing issues",
    };

    const description = errorMap[code] || errorMap[httpStatus.toString()] || message;
    const fullMessage = `FRED API Error [${code}]: ${description}. Original message: ${message}`;

    // Determine error type based on status code
    let error;
    if (httpStatus === 401 || code === "401") {
      error = new ConfigurationError(fullMessage, this.sourceName);
    } else if (httpStatus === 404 || code === "404") {
      error = new NotFoundError(fullMessage, this.sourceName);
    } else if (httpStatus === 429 || code === "429") {
      error = new RateLimitError(fullMessage, this.sourceName, 60);
    } else {
      error = new ValidationError(fullMessage, this.sourceName);
    }

    this.errorLogger.log(error, { endpoint, errorCode: code, errorMessage: message, httpStatus });
    throw error;
  }

  /**
   * Parse series data from FRED response
   */
  private parseSeriesData(data: any, seriesId: string): EconomicData[] {
    if (!data.observations || !Array.isArray(data.observations)) {
      return [];
    }

    return data.observations
      .filter((obs: any) => obs.value !== ".")
      .map((obs: any) => ({
        seriesId,
        date: obs.date,
        value: parseFloat(obs.value),
        units: data.units,
      }));
  }
}
