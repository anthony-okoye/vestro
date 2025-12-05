import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse, ScreeningFilters } from "../types";
import { createCachedFetcher, CACHE_CONFIG, CacheKeys, hashScreeningFilters } from "../cache-config";

export interface StockScreenResult {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  price: number;
  change: number;
  volume: number;
}

/**
 * Adapter for Finviz stock screener
 * Fetches filtered stock lists based on screening criteria
 */
export class FinvizAdapter extends BaseDataSourceAdapter {
  sourceName = "Finviz";

  constructor() {
    super("https://finviz.com", 30); // Conservative rate limit
  }

  /**
   * Screen stocks based on filters
   */
  async screenStocks(filters: ScreeningFilters): Promise<StockScreenResult[]> {
    // Generate cache key based on filter hash
    const filtersHash = hashScreeningFilters(filters);
    return this.screenStocksCached(filters, filtersHash);
  }

  /**
   * Cached version of screenStocks
   * Cache for 15 minutes (screening results update frequently)
   */
  private screenStocksCached = createCachedFetcher(
    async (filters: ScreeningFilters, _filtersHash: string): Promise<StockScreenResult[]> => {
      try {
        const finvizFilters = this.convertToFinvizFilters(filters);

        const request: DataRequest = {
          endpoint: "/screener.ashx",
          params: {
            v: "111", // View mode: overview
            ...finvizFilters,
          },
        };

        const response = await this.fetch(request);
        const results = this.parseScreenerResults(response.data);

        return results;
      } catch (error) {
        throw new Error(
          `Failed to screen stocks: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.stockScreen("dynamic"),
    { ...CACHE_CONFIG.QUOTES }
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

    // Finviz returns HTML, so we get text instead of JSON
    const data = await response.text();

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }

  /**
   * Convert our filter format to Finviz filter parameters
   */
  private convertToFinvizFilters(filters: ScreeningFilters): Record<string, string> {
    const finvizFilters: Record<string, string> = {};

    // Market cap filter
    if (filters.marketCap) {
      switch (filters.marketCap) {
        case "large":
          finvizFilters.f = "cap_largeover";
          break;
        case "mid":
          finvizFilters.f = "cap_mid";
          break;
        case "small":
          finvizFilters.f = "cap_small";
          break;
      }
    }

    // Dividend yield filter
    if (filters.dividendYieldMin !== undefined) {
      const yieldFilter = this.getDividendYieldFilter(filters.dividendYieldMin);
      if (yieldFilter) {
        finvizFilters.f = finvizFilters.f
          ? `${finvizFilters.f},${yieldFilter}`
          : yieldFilter;
      }
    }

    // PE ratio filter
    if (filters.peRatioMax !== undefined) {
      const peFilter = this.getPERatioFilter(filters.peRatioMax);
      if (peFilter) {
        finvizFilters.f = finvizFilters.f
          ? `${finvizFilters.f},${peFilter}`
          : peFilter;
      }
    }

    // Sector filter
    if (filters.sector) {
      finvizFilters.f = finvizFilters.f
        ? `${finvizFilters.f},sec_${filters.sector.toLowerCase().replace(/\s+/g, "")}`
        : `sec_${filters.sector.toLowerCase().replace(/\s+/g, "")}`;
    }

    return finvizFilters;
  }

  /**
   * Get Finviz dividend yield filter code
   */
  private getDividendYieldFilter(minYield: number): string | null {
    if (minYield >= 5) return "fa_div_o5";
    if (minYield >= 3) return "fa_div_o3";
    if (minYield >= 2) return "fa_div_o2";
    if (minYield >= 1) return "fa_div_pos";
    return null;
  }

  /**
   * Get Finviz PE ratio filter code
   */
  private getPERatioFilter(maxPE: number): string | null {
    if (maxPE <= 15) return "fa_pe_u15";
    if (maxPE <= 20) return "fa_pe_u20";
    if (maxPE <= 25) return "fa_pe_u25";
    if (maxPE <= 30) return "fa_pe_u30";
    return null;
  }

  /**
   * Parse HTML screener results
   * Note: This is a simplified parser. In production, you'd want to use a proper HTML parser
   */
  private parseScreenerResults(_html: string): StockScreenResult[] {
    // This is a mock implementation since parsing HTML is complex
    // In a real implementation, you would:
    // 1. Use a library like cheerio or jsdom to parse HTML
    // 2. Extract table rows from the screener results
    // 3. Parse each row to extract stock data

    // For now, return mock data structure
    // In production, this would parse the actual HTML table
    const mockResults: StockScreenResult[] = [
      {
        ticker: "AAPL",
        companyName: "Apple Inc.",
        sector: "Technology",
        industry: "Consumer Electronics",
        country: "USA",
        marketCap: 3000000000000,
        peRatio: 28.5,
        dividendYield: 0.5,
        price: 175.0,
        change: 1.2,
        volume: 50000000,
      },
    ];

    // Note: This would be replaced with actual HTML parsing logic
    // For example:
    // const $ = cheerio.load(html);
    // $('table.screener-table tr').each((i, row) => {
    //   // Parse row data
    // });

    return mockResults;
  }
}
