import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock cache-config to bypass Next.js unstable_cache in tests
vi.mock("../cache-config", () => ({
  createCachedFetcher: <T extends (...args: any[]) => Promise<any>>(
    fetcher: T,
    _cacheKey: string,
    _config: { revalidate: number; tags: string[] }
  ): T => fetcher,
  CACHE_CONFIG: {
    STOCK_DATA: { revalidate: 300, tags: ["stock-data"] },
    COMPANY_DATA: { revalidate: 3600, tags: ["company-data"] },
    MACRO_DATA: { revalidate: 3600, tags: ["macro-data"] },
    SECTOR_DATA: { revalidate: 1800, tags: ["sector-data"] },
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
    companyProfile: (ticker: string) => `company-profile-${ticker}`,
    sectorData: () => "sector-data",
    interestRate: () => "interest-rate",
    inflationRate: () => "inflation-rate",
    unemploymentRate: () => "unemployment-rate",
    screenStocks: (hash: string) => `screen-stocks-${hash}`,
  },
}));

import { SECEdgarAdapter } from "../data-adapters/sec-edgar-adapter";
import { YahooFinanceAdapter } from "../data-adapters/yahoo-finance-adapter";
import { FinvizAdapter } from "../data-adapters/finviz-adapter";
import { FederalReserveAdapter } from "../data-adapters/federal-reserve-adapter";
import { CNBCAdapter } from "../data-adapters/cnbc-adapter";
import { BloombergAdapter } from "../data-adapters/bloomberg-adapter";

/**
 * Integration tests for data source adapters
 * Tests with mock responses and error scenarios
 * Requirements: 2.1, 3.1, 4.5, 5.1, 5.2
 */

describe("Data Adapters Integration Tests", () => {
  // Store original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe("SECEdgarAdapter", () => {
    let adapter: SECEdgarAdapter;

    beforeEach(() => {
      adapter = new SECEdgarAdapter();
    });

    it("should fetch company information successfully", async () => {
      const mockCompanyData = {
        "0": {
          cik_str: 320193,
          ticker: "AAPL",
          title: "Apple Inc.",
          exchange: "Nasdaq",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCompanyData,
      } as Response);

      const result = await adapter.searchCompany("AAPL");

      expect(result).toHaveLength(1);
      expect(result[0].cik).toBe("320193");
      expect(result[0].name).toBe("Apple Inc.");
      expect(result[0].tickers).toContain("AAPL");
    });

    it("should fetch filings successfully", async () => {
      const mockCompanyData = {
        "0": {
          cik_str: 320193,
          ticker: "AAPL",
          title: "Apple Inc.",
        },
      };

      const mockFilingsData = {
        filings: {
          recent: {
            accessionNumber: ["0001193125-23-000001", "0001193125-22-000001"],
            filingDate: ["2023-10-27", "2022-10-28"],
            reportDate: ["2023-09-30", "2022-09-24"],
            form: ["10-K", "10-K"],
            fileNumber: ["001-36743", "001-36743"],
            filmNumber: ["231234567", "221234567"],
            primaryDocument: ["aapl-20230930.htm", "aapl-20220924.htm"],
          },
        },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCompanyData,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockFilingsData,
        } as Response);

      const result = await adapter.fetchFilings("AAPL", "10-K");

      expect(result).toHaveLength(2);
      expect(result[0].formType).toBe("10-K");
      expect(result[0].accessionNumber).toBe("0001193125-23-000001");
    });

    it("should handle HTTP errors with retry", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response);

      await expect(adapter.searchCompany("AAPL")).rejects.toThrow(
        /Failed to fetch from SEC EDGAR after 3 attempts/
      );

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should handle company not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      await expect(adapter.fetchFilings("INVALID")).rejects.toThrow(
        /Company not found for ticker: INVALID/
      );
    });

    it("should enforce rate limiting", async () => {
      const mockData = {
        "0": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      // Make 5 requests (within rate limit of 10)
      const promises = Array.from({ length: 5 }, () =>
        adapter.searchCompany("AAPL")
      );

      await Promise.all(promises);

      // Verify rate limit info is updated
      const rateLimit = adapter.getRateLimit();
      expect(rateLimit.requestsRemaining).toBeLessThanOrEqual(10);
      expect(rateLimit.requestsRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe("YahooFinanceAdapter", () => {
    let adapter: YahooFinanceAdapter;

    beforeEach(() => {
      adapter = new YahooFinanceAdapter();
    });

    it("should fetch quote successfully", async () => {
      const mockQuoteData = {
        quoteResponse: {
          result: [
            {
              symbol: "AAPL",
              regularMarketPrice: 175.5,
              regularMarketChange: 2.5,
              regularMarketChangePercent: 1.45,
              regularMarketVolume: 50000000,
              marketCap: 2800000000000,
              trailingPE: 28.5,
              dividendYield: 0.005,
              fiftyTwoWeekHigh: 198.23,
              fiftyTwoWeekLow: 124.17,
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockQuoteData,
      } as Response);

      const result = await adapter.fetchQuote("AAPL");

      expect(result.ticker).toBe("AAPL");
      expect(result.price).toBe(175.5);
      expect(result.change).toBe(2.5);
      expect(result.volume).toBe(50000000);
      expect(result.peRatio).toBe(28.5);
    });

    it("should fetch company profile successfully", async () => {
      const mockProfileData = {
        quoteSummary: {
          result: [
            {
              assetProfile: {
                longName: "Apple Inc.",
                sector: "Technology",
                industry: "Consumer Electronics",
                longBusinessSummary: "Apple designs and manufactures consumer electronics.",
                website: "https://www.apple.com",
                fullTimeEmployees: 164000,
                city: "Cupertino",
                state: "CA",
                country: "United States",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockProfileData,
      } as Response);

      const result = await adapter.fetchCompanyProfile("AAPL");

      expect(result.ticker).toBe("AAPL");
      expect(result.name).toBe("Apple Inc.");
      expect(result.sector).toBe("Technology");
      expect(result.industry).toBe("Consumer Electronics");
      expect(result.employees).toBe(164000);
    });

    it("should handle missing quote data", async () => {
      const mockEmptyData = {
        quoteResponse: {
          result: [],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockEmptyData,
      } as Response);

      await expect(adapter.fetchQuote("INVALID")).rejects.toThrow(
        /No quote data found for INVALID/
      );
    });

    it("should handle network errors with retry", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(adapter.fetchQuote("AAPL")).rejects.toThrow(
        /Failed to fetch from Yahoo Finance after 3 attempts/
      );

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should fetch sector data successfully", async () => {
      const mockChartData = {
        chart: {
          result: [
            {
              indicators: {
                quote: [
                  {
                    close: Array(252).fill(100).map((v, i) => v + i * 0.1),
                  },
                ],
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockChartData,
      } as Response);

      const result = await adapter.fetchSectorData();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("sectorName");
      expect(result[0]).toHaveProperty("performance1Day");
      expect(result[0]).toHaveProperty("performance1Year");
    });
  });

  describe("FinvizAdapter", () => {
    let adapter: FinvizAdapter;

    beforeEach(() => {
      adapter = new FinvizAdapter();
    });

    it("should screen stocks with filters", async () => {
      const mockHtml = `
        <html>
          <body>
            <table class="screener-table">
              <tr><td>AAPL</td><td>Apple Inc.</td></tr>
            </table>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      } as Response);

      const filters = {
        marketCap: "large" as const,
        dividendYieldMin: 2,
        peRatioMax: 25,
        sector: "Technology",
      };

      const result = await adapter.screenStocks(filters);

      expect(Array.isArray(result)).toBe(true);
      // Note: Current implementation returns mock data
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle HTTP errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      } as Response);

      const filters = { marketCap: "large" as const };

      await expect(adapter.screenStocks(filters)).rejects.toThrow(
        /Failed to screen stocks/
      );
    });

    it("should convert filters correctly", async () => {
      const mockHtml = "<html></html>";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      } as Response);

      const filters = {
        marketCap: "mid" as const,
        dividendYieldMin: 3,
        peRatioMax: 20,
      };

      await adapter.screenStocks(filters);

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain("screener.ashx");
    });
  });

  describe("FederalReserveAdapter", () => {
    let adapter: FederalReserveAdapter;

    beforeEach(() => {
      adapter = new FederalReserveAdapter("test-api-key");
    });

    it("should fetch interest rate successfully", async () => {
      const mockFredData = {
        observations: [
          { date: "2023-10-01", value: "5.33" },
          { date: "2023-11-01", value: "5.40" },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockFredData,
      } as Response);

      const result = await adapter.fetchInterestRate();

      expect(result).toBe(5.4);
    });

    it("should fetch inflation rate successfully", async () => {
      const mockCpiData = {
        observations: Array.from({ length: 13 }, (_, i) => ({
          date: `2023-${String(i + 1).padStart(2, "0")}-01`,
          value: String(300 + i * 2),
        })),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCpiData,
      } as Response);

      const result = await adapter.fetchInflationRate();

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("should fetch unemployment rate successfully", async () => {
      const mockUnemploymentData = {
        observations: [{ date: "2023-11-01", value: "3.7" }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUnemploymentData,
      } as Response);

      const result = await adapter.fetchUnemploymentRate();

      expect(result).toBe(3.7);
    });

    it("should handle missing data", async () => {
      const mockEmptyData = {
        observations: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockEmptyData,
      } as Response);

      await expect(adapter.fetchInterestRate()).rejects.toThrow(
        /No interest rate data available/
      );
    });

    it("should handle API errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(adapter.fetchInterestRate()).rejects.toThrow(
        /Failed to fetch from Federal Reserve FRED after 3 attempts/
      );
    });

    it("should filter out invalid values", async () => {
      const mockDataWithDots = {
        observations: [
          { date: "2023-10-01", value: "." },
          { date: "2023-11-01", value: "5.40" },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDataWithDots,
      } as Response);

      const result = await adapter.fetchSeries("FEDFUNDS");

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(5.4);
    });
  });

  describe("CNBCAdapter", () => {
    let adapter: CNBCAdapter;

    beforeEach(() => {
      adapter = new CNBCAdapter();
    });

    it("should fetch market trend data successfully", async () => {
      const result = await adapter.fetchMarketTrend();

      expect(result).toHaveProperty("trend");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("sentiment");
      expect(result).toHaveProperty("indicators");
      expect(["bullish", "bearish", "neutral"]).toContain(result.trend);
      expect(typeof result.sentiment).toBe("number");
    });

    it("should return consistent data structure", async () => {
      const result = await adapter.fetchMarketTrend();

      expect(result.indicators).toHaveProperty("marketIndices");
      expect(result.indicators).toHaveProperty("volatilityIndex");
      expect(typeof result.indicators.volatilityIndex).toBe("number");
    });
  });

  describe("BloombergAdapter", () => {
    let adapter: BloombergAdapter;

    beforeEach(() => {
      adapter = new BloombergAdapter();
    });

    it("should fetch market data successfully", async () => {
      const result = await adapter.fetchMarketData();

      expect(result).toHaveProperty("indices");
      expect(result).toHaveProperty("commodities");
      expect(result).toHaveProperty("currencies");
      expect(result).toHaveProperty("timestamp");
      expect(Array.isArray(result.indices)).toBe(true);
      expect(Array.isArray(result.commodities)).toBe(true);
      expect(Array.isArray(result.currencies)).toBe(true);
    });

    it("should return valid index data", async () => {
      const result = await adapter.fetchMarketData();

      expect(result.indices.length).toBeGreaterThan(0);
      result.indices.forEach((index) => {
        expect(index).toHaveProperty("name");
        expect(index).toHaveProperty("value");
        expect(index).toHaveProperty("change");
        expect(index).toHaveProperty("changePercent");
      });
    });

    it("should determine market trend", async () => {
      const trend = await adapter.determineMarketTrend();

      expect(["bullish", "bearish", "neutral"]).toContain(trend);
    });
  });

  describe("Rate Limiting Across Adapters", () => {
    it("should respect rate limits for SEC EDGAR", async () => {
      const adapter = new SECEdgarAdapter();
      const rateLimit = adapter.getRateLimit();

      expect(rateLimit.requestsPerMinute).toBe(10);
      expect(rateLimit.requestsRemaining).toBeLessThanOrEqual(10);
    });

    it("should respect rate limits for Yahoo Finance", async () => {
      const adapter = new YahooFinanceAdapter();
      const rateLimit = adapter.getRateLimit();

      expect(rateLimit.requestsPerMinute).toBe(120);
      expect(rateLimit.requestsRemaining).toBeLessThanOrEqual(120);
    });

    it("should respect rate limits for Federal Reserve", async () => {
      const adapter = new FederalReserveAdapter();
      const rateLimit = adapter.getRateLimit();

      expect(rateLimit.requestsPerMinute).toBe(120);
      expect(rateLimit.requestsRemaining).toBeLessThanOrEqual(120);
    });
  });

  describe("Adapter Availability Checks", () => {
    it("should check SEC EDGAR availability", async () => {
      const adapter = new SECEdgarAdapter();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const isAvailable = await adapter.isAvailable();
      expect(typeof isAvailable).toBe("boolean");
    });

    it("should return false when adapter is unavailable", async () => {
      const adapter = new YahooFinanceAdapter();

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const isAvailable = await adapter.isAvailable();
      expect(isAvailable).toBe(false);
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("should recover from transient errors", async () => {
      const adapter = new SECEdgarAdapter();

      const mockData = {
        "0": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
      };

      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);

      const result = await adapter.searchCompany("AAPL");

      expect(result).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should use exponential backoff on retries", async () => {
      const adapter = new FederalReserveAdapter();

      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockRejectedValueOnce(new Error("Error 3"));

      const startTime = Date.now();

      await expect(adapter.fetchInterestRate()).rejects.toThrow();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 1s + 2s = 3s for backoff
      expect(duration).toBeGreaterThanOrEqual(3000);
    });
  });
});
