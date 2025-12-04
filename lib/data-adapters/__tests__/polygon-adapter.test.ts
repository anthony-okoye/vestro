import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ConfigurationError,
  NotFoundError,
  NetworkError,
  RateLimitError,
  ValidationError,
} from "../../api-error";
import { DataRequest } from "../../types";

// Mock the cache-config module to bypass Next.js unstable_cache
vi.mock("../../cache-config", () => ({
  createCachedFetcher: <T extends (...args: any[]) => Promise<any>>(
    fetcher: T,
    _cacheKey: string,
    _config: { revalidate: number; tags: string[] }
  ): T => fetcher,
  CACHE_CONFIG: {
    QUOTES: { revalidate: 900, tags: ["quotes"] },
    HISTORICAL_DATA: { revalidate: 86400, tags: ["historical-data"] },
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
  },
}));

// Import after mocking
import { PolygonAdapter } from "../polygon-adapter";

describe("PolygonAdapter", () => {
  describe("Configuration", () => {
    it("should throw ConfigurationError when API key is missing", () => {
      const originalEnv = process.env.POLYGON_API_KEY;
      delete process.env.POLYGON_API_KEY;

      expect(() => new PolygonAdapter()).toThrow(ConfigurationError);
      expect(() => new PolygonAdapter()).toThrow(
        "Polygon.io API key is required"
      );

      process.env.POLYGON_API_KEY = originalEnv;
    });

    it("should throw ConfigurationError when API key is empty", () => {
      expect(() => new PolygonAdapter("")).toThrow(ConfigurationError);
      expect(() => new PolygonAdapter("   ")).toThrow(ConfigurationError);
    });

    it("should initialize successfully with valid API key", () => {
      const adapter = new PolygonAdapter("test-api-key");
      expect(adapter).toBeDefined();
      expect(adapter.sourceName).toBe("Polygon.io");
      expect(adapter.isConfigured()).toBe(true);
    });

    it("should load API key from environment variable", () => {
      const originalEnv = process.env.POLYGON_API_KEY;
      process.env.POLYGON_API_KEY = "env-api-key";

      const adapter = new PolygonAdapter();
      expect(adapter.isConfigured()).toBe(true);

      process.env.POLYGON_API_KEY = originalEnv;
    });
  });

  describe("getCurrentQuote", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, "fetch");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should fetch and parse current quote correctly", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: "success",
            results: {
              T: "AAPL",
              p: 150.25,
              s: 1000000,
              t: Date.now(),
            },
          }),
      } as Response);

      const quote = await adapter.getCurrentQuote("AAPL");

      expect(quote).toBeDefined();
      expect(quote.symbol).toBe("AAPL");
      expect(quote.price).toBe(150.25);
      expect(quote.volume).toBe(1000000);
      expect(quote.source).toBe("Polygon.io");
      expect(quote.timestamp).toBeInstanceOf(Date);
    });

    it("should handle missing quote data", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(adapter.getCurrentQuote("INVALID")).rejects.toThrow(
        "No quote data found"
      );
    });

    it("should uppercase symbol in request", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: "success",
            results: {
              T: "MSFT",
              p: 350.0,
              s: 2000000,
              t: Date.now(),
            },
          }),
      } as Response);

      const quote = await adapter.getCurrentQuote("msft");

      expect(quote.symbol).toBe("MSFT");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/MSFT"),
        expect.any(Object)
      );
    });
  });

  describe("getPreviousClose", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, "fetch");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should fetch and parse previous close correctly", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "AAPL",
            status: "success",
            results: [
              {
                o: 148.5,
                h: 151.0,
                l: 147.8,
                c: 150.0,
                v: 5000000,
                t: Date.now(),
              },
            ],
          }),
      } as Response);

      const quote = await adapter.getPreviousClose("AAPL");

      expect(quote).toBeDefined();
      expect(quote.symbol).toBe("AAPL");
      expect(quote.price).toBe(150.0);
      expect(quote.change).toBeCloseTo(1.5, 1);
      expect(quote.changePercent).toBeCloseTo(1.01, 1);
      expect(quote.source).toBe("Polygon.io");
    });

    it("should handle missing previous close data", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "INVALID",
            status: "success",
            results: [],
          }),
      } as Response);

      await expect(adapter.getPreviousClose("INVALID")).rejects.toThrow(
        "No previous close data found"
      );
    });
  });

  describe("getAggregates (Historical Data)", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, "fetch");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should fetch and parse aggregated bars correctly", async () => {
      const adapter = new PolygonAdapter("test-api-key");
      const from = new Date("2024-01-01");
      const to = new Date("2024-01-31");

      const mockBars = [
        {
          o: 148.0,
          h: 150.0,
          l: 147.0,
          c: 149.0,
          v: 1000000,
          t: new Date("2024-01-15").getTime(),
        },
        {
          o: 149.0,
          h: 151.0,
          l: 148.5,
          c: 150.5,
          v: 1100000,
          t: new Date("2024-01-16").getTime(),
        },
      ];

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "AAPL",
            status: "success",
            results: mockBars,
          }),
      } as Response);

      const historicalData = await adapter.getAggregates(
        "AAPL",
        "day",
        from,
        to
      );

      expect(historicalData).toBeDefined();
      expect(historicalData.symbol).toBe("AAPL");
      expect(historicalData.bars).toHaveLength(2);
      expect(historicalData.bars[0].open).toBe(148.0);
      expect(historicalData.bars[0].close).toBe(149.0);
      expect(historicalData.bars[0].high).toBe(150.0);
      expect(historicalData.bars[0].low).toBe(147.0);
      expect(historicalData.bars[0].volume).toBe(1000000);
      expect(historicalData.source).toBe("Polygon.io");
    });

    it("should support different timespans", async () => {
      const adapter = new PolygonAdapter("test-api-key");
      const from = new Date("2024-01-01");
      const to = new Date("2024-03-31");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "AAPL",
            status: "success",
            results: [
              { o: 148.0, h: 155.0, l: 145.0, c: 152.0, v: 5000000, t: Date.now() },
            ],
          }),
      } as Response);

      // Test weekly timespan
      await adapter.getAggregates("AAPL", "week", from, to);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/week/"),
        expect.any(Object)
      );

      // Test monthly timespan
      await adapter.getAggregates("AAPL", "month", from, to);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/month/"),
        expect.any(Object)
      );
    });

    it("should handle empty results gracefully", async () => {
      const adapter = new PolygonAdapter("test-api-key");
      const from = new Date("2024-01-01");
      const to = new Date("2024-01-31");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "AAPL",
            status: "success",
            results: [],
          }),
      } as Response);

      await expect(
        adapter.getAggregates("AAPL", "day", from, to)
      ).rejects.toThrow("No aggregate data found");
    });

    it("should format dates correctly in API request", async () => {
      const adapter = new PolygonAdapter("test-api-key");
      const from = new Date("2024-01-15");
      const to = new Date("2024-02-20");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "AAPL",
            status: "success",
            results: [
              { o: 148.0, h: 150.0, l: 147.0, c: 149.0, v: 1000000, t: Date.now() },
            ],
          }),
      } as Response);

      await adapter.getAggregates("AAPL", "day", from, to);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("2024-01-15"),
        expect.any(Object)
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("2024-02-20"),
        expect.any(Object)
      );
    });
  });

  describe("getDailyPrices", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, "fetch");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should fetch daily prices for default 30 days", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "AAPL",
            status: "success",
            results: [
              { o: 148.0, h: 150.0, l: 147.0, c: 149.0, v: 1000000, t: Date.now() },
            ],
          }),
      } as Response);

      const historicalData = await adapter.getDailyPrices("AAPL");

      expect(historicalData).toBeDefined();
      expect(historicalData.symbol).toBe("AAPL");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/day/"),
        expect.any(Object)
      );
    });

    it("should fetch daily prices for custom number of days", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            ticker: "AAPL",
            status: "success",
            results: [
              { o: 148.0, h: 150.0, l: 147.0, c: 149.0, v: 1000000, t: Date.now() },
            ],
          }),
      } as Response);

      await adapter.getDailyPrices("AAPL", 60);

      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe("Request Queueing", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, "fetch");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should have a queue mechanism", () => {
      const adapter = new PolygonAdapter("test-api-key");

      // Verify the adapter has the queue properties
      expect((adapter as any).pendingRequests).toBeDefined();
      expect(Array.isArray((adapter as any).pendingRequests)).toBe(true);
      expect((adapter as any).isProcessingQueue).toBeDefined();
    });

    it("should queue requests and process them sequentially", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      // Mock the performFetch method to track call order
      const callOrder: number[] = [];

      (adapter as any).performFetch = vi.fn(async (request: any) => {
        const requestNum = parseInt(request.endpoint.split("-")[1] || "0");
        callOrder.push(requestNum);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 10));

        return {
          data: { status: "success", results: [] },
          status: 200,
          timestamp: new Date(),
          source: "Polygon.io",
        };
      });

      // Queue multiple requests
      const requests = [
        adapter.fetch({ endpoint: "/test-1", params: {} }),
        adapter.fetch({ endpoint: "/test-2", params: {} }),
        adapter.fetch({ endpoint: "/test-3", params: {} }),
      ];

      await Promise.all(requests);

      // Verify all requests were processed
      expect(callOrder).toHaveLength(3);
      expect(callOrder).toEqual([1, 2, 3]);
    });

    it("should handle errors in queued requests without blocking others", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      // Mock performFetch to fail on second request
      let callCount = 0;
      (adapter as any).performFetch = vi.fn(async (request: any) => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Simulated API error");
        }

        return {
          data: { status: "success", results: [] },
          status: 200,
          timestamp: new Date(),
          source: "Polygon.io",
        };
      });

      // Queue multiple requests
      const request1 = adapter.fetch({ endpoint: "/test-1", params: {} });
      const request2 = adapter.fetch({ endpoint: "/test-2", params: {} });
      const request3 = adapter.fetch({ endpoint: "/test-3", params: {} });

      // First request should succeed
      await expect(request1).resolves.toBeDefined();

      // Second request should fail
      await expect(request2).rejects.toThrow("Simulated API error");

      // Third request should still succeed
      await expect(request3).resolves.toBeDefined();
    });

    it("should process queue only when not already processing", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      // Mock performFetch with a delay
      (adapter as any).performFetch = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          data: { status: "success", results: [] },
          status: 200,
          timestamp: new Date(),
          source: "Polygon.io",
        };
      });

      // Start multiple requests simultaneously
      const requests = [
        adapter.fetch({ endpoint: "/test-1", params: {} }),
        adapter.fetch({ endpoint: "/test-2", params: {} }),
      ];

      // Verify isProcessingQueue is set
      expect((adapter as any).isProcessingQueue).toBe(true);

      await Promise.all(requests);

      // After processing, queue should be empty and flag should be false
      expect((adapter as any).pendingRequests).toHaveLength(0);
      expect((adapter as any).isProcessingQueue).toBe(false);
    });
  });

  describe("Error Handling", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, "fetch");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should throw NetworkError on network failures", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockRejectedValue(new Error("Network connection failed"));

      await expect(adapter.getCurrentQuote("AAPL")).rejects.toThrow(
        "Network request failed"
      );
    });

    it("should throw RateLimitError on HTTP 429", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      } as Response);

      await expect(adapter.getCurrentQuote("AAPL")).rejects.toThrow(
        "rate limit exceeded"
      );
    });

    it("should throw NetworkError on HTTP errors", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(adapter.getCurrentQuote("AAPL")).rejects.toThrow("HTTP 500");
    });

    it("should throw ValidationError on JSON parse errors", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Unexpected token")),
      } as Response);

      await expect(adapter.getCurrentQuote("AAPL")).rejects.toThrow(
        "Failed to parse JSON"
      );
    });

    it("should throw ValidationError on API error responses", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            error: "Invalid API key",
          }),
      } as Response);

      await expect(adapter.getCurrentQuote("AAPL")).rejects.toThrow(
        "Polygon API Error"
      );
    });

    it("should throw ValidationError on ERROR status", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: "ERROR",
            message: "Something went wrong",
          }),
      } as Response);

      await expect(adapter.getCurrentQuote("AAPL")).rejects.toThrow(
        "Polygon API Error"
      );
    });

    it("should throw NotFoundError on NOT_FOUND status", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: "NOT_FOUND",
          }),
      } as Response);

      await expect(adapter.getCurrentQuote("INVALID")).rejects.toThrow(
        "Data not found"
      );
    });

    it("should include provider name in error context", async () => {
      const adapter = new PolygonAdapter("test-api-key");

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);

      try {
        await adapter.getCurrentQuote("INVALID");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain("INVALID");
      }
    });
  });

  describe("Data Parsing Edge Cases", () => {
    it("should handle missing optional fields in quote", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const mockData = {
        status: "success",
        results: {
          T: "TEST",
          p: 100.0,
          // Missing s (size/volume) and t (timestamp)
        },
      };

      const quote = (adapter as any).parseCurrentQuote(mockData, "TEST");

      expect(quote.symbol).toBe("TEST");
      expect(quote.price).toBe(100.0);
      expect(quote.volume).toBe(0);
      expect(quote.timestamp).toBeInstanceOf(Date);
    });

    it("should handle zero values in previous close", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const mockData = {
        ticker: "TEST",
        status: "success",
        results: [
          {
            o: 0,
            h: 0,
            l: 0,
            c: 0,
            v: 0,
            t: Date.now(),
          },
        ],
      };

      const quote = (adapter as any).parsePreviousClose(mockData, "TEST");

      expect(quote.price).toBe(0);
      expect(quote.change).toBe(0);
      expect(quote.changePercent).toBe(0);
    });

    it("should handle missing bar fields in aggregates", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const mockData = {
        ticker: "TEST",
        status: "success",
        results: [
          {
            t: Date.now(),
            // Missing o, h, l, c, v
          },
        ],
      };

      const historicalData = (adapter as any).parseAggregates(mockData, "TEST");

      expect(historicalData.bars[0].open).toBe(0);
      expect(historicalData.bars[0].high).toBe(0);
      expect(historicalData.bars[0].low).toBe(0);
      expect(historicalData.bars[0].close).toBe(0);
      expect(historicalData.bars[0].volume).toBe(0);
    });

    it("should use symbol parameter when ticker is missing from response", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const mockData = {
        status: "success",
        results: [
          {
            o: 100,
            h: 105,
            l: 98,
            c: 102,
            v: 1000000,
            t: Date.now(),
          },
        ],
        // Missing ticker field
      };

      const historicalData = (adapter as any).parseAggregates(mockData, "AAPL");

      expect(historicalData.symbol).toBe("AAPL");
    });
  });

  describe("Date Formatting", () => {
    it("should format dates correctly", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const date = new Date("2024-01-15");
      const formatted = (adapter as any).formatDate(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatted).toContain("2024");
    });

    it("should pad single digit months and days", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const date = new Date("2024-03-05");
      const formatted = (adapter as any).formatDate(date);

      expect(formatted).toBe("2024-03-05");
    });
  });
});
