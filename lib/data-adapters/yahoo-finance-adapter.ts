import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";
import { createCachedFetcher, CACHE_CONFIG, CacheKeys } from "../cache-config";

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  timestamp: Date;
}

export interface SectorData {
  sectorName: string;
  performance1Day: number;
  performance1Week: number;
  performance1Month: number;
  performance3Month: number;
  performance1Year: number;
  marketCap: number;
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  website?: string;
  employees?: number;
  headquarters?: string;
  founded?: string;
}

/**
 * Adapter for Yahoo Finance data
 * Fetches stock quotes, sector data, and company profiles
 */
export class YahooFinanceAdapter extends BaseDataSourceAdapter {
  sourceName = "Yahoo Finance";

  constructor() {
    super("https://query2.finance.yahoo.com", 120); // 120 requests per minute
  }

  /**
   * Fetch real-time quote for a ticker
   */
  async fetchQuote(ticker: string): Promise<Quote> {
    return this.fetchQuoteCached(ticker);
  }

  /**
   * Cached version of fetchQuote
   * Cache for 15 minutes (quotes update frequently)
   */
  private fetchQuoteCached = createCachedFetcher(
    async (ticker: string): Promise<Quote> => {
      try {
        const request: DataRequest = {
          endpoint: "/v7/finance/quote",
          params: {
            symbols: ticker,
          },
        };

        const response = await this.fetch(request);
        const quote = this.parseQuote(response.data, ticker);

        return quote;
      } catch (error) {
        throw new Error(
          `Failed to fetch quote for ${ticker}: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.quote("dynamic"),
    CACHE_CONFIG.QUOTES
  );

  /**
   * Fetch sector performance data
   */
  async fetchSectorData(): Promise<SectorData[]> {
    return this.fetchSectorDataCached();
  }

  /**
   * Cached version of fetchSectorData
   * Cache for 24 hours (sector data updates daily)
   */
  private fetchSectorDataCached = createCachedFetcher(
    async (): Promise<SectorData[]> => {
      try {
        // Yahoo Finance sector tickers
        const sectorTickers = [
          "XLK", // Technology
          "XLF", // Financials
          "XLV", // Healthcare
          "XLE", // Energy
          "XLI", // Industrials
          "XLY", // Consumer Discretionary
          "XLP", // Consumer Staples
          "XLU", // Utilities
          "XLRE", // Real Estate
          "XLB", // Materials
          "XLC", // Communication Services
        ];

        const sectorDataPromises = sectorTickers.map((ticker) =>
          this.fetchSectorPerformance(ticker)
        );

        const sectorData = await Promise.all(sectorDataPromises);

        return sectorData.filter((data) => data !== null) as SectorData[];
      } catch (error) {
        throw new Error(
          `Failed to fetch sector data: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.sectorData(),
    CACHE_CONFIG.SECTOR_DATA
  );

  /**
   * Fetch company profile information
   */
  async fetchCompanyProfile(ticker: string): Promise<CompanyProfile> {
    return this.fetchCompanyProfileCached(ticker);
  }

  /**
   * Cached version of fetchCompanyProfile
   * Cache for 7 days (company profiles rarely change)
   */
  private fetchCompanyProfileCached = createCachedFetcher(
    async (ticker: string): Promise<CompanyProfile> => {
      try {
        const request: DataRequest = {
          endpoint: `/v10/finance/quoteSummary/${ticker}`,
          params: {
            modules: "assetProfile,summaryProfile",
          },
        };

        const response = await this.fetch(request);
        const profile = this.parseCompanyProfile(response.data, ticker);

        return profile;
      } catch (error) {
        throw new Error(
          `Failed to fetch company profile for ${ticker}: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.companyProfile("dynamic"),
    CACHE_CONFIG.COMPANY_PROFILES
  );

  /**
   * Perform the actual HTTP fetch
   */
  protected async performFetch(request: DataRequest): Promise<DataResponse> {
    const url = this.buildUrl(request.endpoint, request.params);

    const response = await fetch(url, {
      headers: {
        ...request.headers,
        "User-Agent": "Mozilla/5.0",
      },
    });

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
   * Fetch sector performance for a specific ETF ticker
   */
  private async fetchSectorPerformance(ticker: string): Promise<SectorData | null> {
    try {
      const request: DataRequest = {
        endpoint: "/v8/finance/chart/" + ticker,
        params: {
          range: "1y",
          interval: "1d",
        },
      };

      const response = await this.fetch(request);
      return this.parseSectorPerformance(response.data, ticker);
    } catch {
      return null;
    }
  }

  /**
   * Parse quote data from Yahoo Finance response
   */
  private parseQuote(data: any, ticker: string): Quote {
    const result = data.quoteResponse?.result?.[0];

    if (!result) {
      throw new Error(`No quote data found for ${ticker}`);
    }

    return {
      ticker: result.symbol,
      price: result.regularMarketPrice || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      volume: result.regularMarketVolume || 0,
      marketCap: result.marketCap,
      peRatio: result.trailingPE,
      dividendYield: result.dividendYield ? result.dividendYield * 100 : undefined,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
      timestamp: new Date(),
    };
  }

  /**
   * Parse sector performance from chart data
   */
  private parseSectorPerformance(data: any, ticker: string): SectorData | null {
    const result = data.chart?.result?.[0];

    if (!result || !result.indicators?.quote?.[0]) {
      return null;
    }

    const closes = result.indicators.quote[0].close;

    if (!closes || closes.length === 0) {
      return null;
    }

    const sectorNames: Record<string, string> = {
      XLK: "Technology",
      XLF: "Financials",
      XLV: "Healthcare",
      XLE: "Energy",
      XLI: "Industrials",
      XLY: "Consumer Discretionary",
      XLP: "Consumer Staples",
      XLU: "Utilities",
      XLRE: "Real Estate",
      XLB: "Materials",
      XLC: "Communication Services",
    };

    // Calculate performance metrics
    const performance1Day = this.calculateReturn(closes, 1);
    const performance1Week = this.calculateReturn(closes, 5);
    const performance1Month = this.calculateReturn(closes, 21);
    const performance3Month = this.calculateReturn(closes, 63);
    const performance1Year = this.calculateReturn(closes, 252);

    return {
      sectorName: sectorNames[ticker] || ticker,
      performance1Day,
      performance1Week,
      performance1Month,
      performance3Month,
      performance1Year,
      marketCap: 0, // Not available from chart data
    };
  }

  /**
   * Parse company profile from Yahoo Finance response
   */
  private parseCompanyProfile(data: any, ticker: string): CompanyProfile {
    const profile = data.quoteSummary?.result?.[0]?.assetProfile;
    const summary = data.quoteSummary?.result?.[0]?.summaryProfile;

    if (!profile && !summary) {
      throw new Error(`No profile data found for ${ticker}`);
    }

    return {
      ticker,
      name: profile?.longName || summary?.longName || ticker,
      sector: profile?.sector || summary?.sector || "Unknown",
      industry: profile?.industry || summary?.industry || "Unknown",
      description: profile?.longBusinessSummary || summary?.longBusinessSummary || "",
      website: profile?.website || summary?.website,
      employees: profile?.fullTimeEmployees,
      headquarters: profile?.city && profile?.state
        ? `${profile.city}, ${profile.state}, ${profile.country}`
        : undefined,
      founded: profile?.founded,
    };
  }

  /**
   * Calculate return over a period
   */
  private calculateReturn(closes: number[], periods: number): number {
    if (closes.length < periods + 1) {
      return 0;
    }

    const currentPrice = closes[closes.length - 1];
    const pastPrice = closes[closes.length - 1 - periods];

    if (!currentPrice || !pastPrice || pastPrice === 0) {
      return 0;
    }

    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }
}
