import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";
import { createCachedFetcher, CACHE_CONFIG, CacheKeys } from "../cache-config";

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

  constructor(apiKey?: string) {
    super("https://api.stlouisfed.org/fred", 120);
    this.apiKey = apiKey || process.env.FRED_API_KEY || "";
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
    CACHE_CONFIG.MACRO_DATA
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
    CACHE_CONFIG.MACRO_DATA
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
    CACHE_CONFIG.MACRO_DATA
  );

  /**
   * Fetch a specific economic data series
   */
  async fetchSeries(seriesId: string, limit: number = 1): Promise<EconomicData[]> {
    try {
      const request: DataRequest = {
        endpoint: "/series/observations",
        params: {
          series_id: seriesId,
          api_key: this.apiKey,
          file_type: "json",
          sort_order: "desc",
          limit: limit,
        },
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
   * Perform the actual HTTP fetch
   */
  protected async performFetch(request: DataRequest): Promise<DataResponse> {
    const url = this.buildUrl(request.endpoint, request.params);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
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
