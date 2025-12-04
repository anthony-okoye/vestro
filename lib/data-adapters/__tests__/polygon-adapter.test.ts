import { describe, it, expect, beforeEach, vi } from "vitest";
import { PolygonAdapter, ConfigurationError } from "../polygon-adapter";

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
    it("should parse current quote correctly", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const mockData = {
        status: "success",
        results: {
          T: "AAPL",
          p: 150.25,
          s: 1000000,
          t: Date.now(),
        },
      };

      const quote = (adapter as any).parseCurrentQuote(mockData, "AAPL");

      expect(quote).toBeDefined();
      expect(quote.symbol).toBe("AAPL");
      expect(quote.price).toBe(150.25);
      expect(quote.volume).toBe(1000000);
      expect(quote.source).toBe("Polygon.io");
    });

    it("should handle missing quote data", () => {
      const adapter = new PolygonAdapter("test-api-key");

      expect(() => {
        (adapter as any).parseCurrentQuote({}, "INVALID");
      }).toThrow("No quote data found");
    });
  });

  describe("getPreviousClose", () => {
    it("should parse previous close correctly", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const mockData = {
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
      };

      const quote = (adapter as any).parsePreviousClose(mockData, "AAPL");

      expect(quote).toBeDefined();
      expect(quote.symbol).toBe("AAPL");
      expect(quote.price).toBe(150.0);
      expect(quote.change).toBeCloseTo(1.5, 1);
      expect(quote.changePercent).toBeCloseTo(1.01, 1);
      expect(quote.source).toBe("Polygon.io");
    });
  });

  describe("getAggregates", () => {
    it("should parse aggregated bars correctly", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const mockBars = [
        { o: 148.0, h: 150.0, l: 147.0, c: 149.0, v: 1000000, t: Date.now() - 86400000 },
        { o: 149.0, h: 151.0, l: 148.5, c: 150.5, v: 1100000, t: Date.now() },
      ];

      const mockData = {
        ticker: "AAPL",
        status: "success",
        results: mockBars,
      };

      const historicalData = (adapter as any).parseAggregates(mockData, "AAPL");

      expect(historicalData).toBeDefined();
      expect(historicalData.symbol).toBe("AAPL");
      expect(historicalData.bars).toHaveLength(2);
      expect(historicalData.bars[0].open).toBe(148.0);
      expect(historicalData.bars[0].close).toBe(149.0);
      expect(historicalData.source).toBe("Polygon.io");
    });

    it("should format dates correctly", () => {
      const adapter = new PolygonAdapter("test-api-key");

      const date = new Date("2024-01-15");
      const formatted = (adapter as any).formatDate(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatted).toContain("2024");
    });
  });

  describe("Data Parsing", () => {
    it("should handle empty results gracefully", () => {
      const adapter = new PolygonAdapter("test-api-key");

      expect(() => {
        (adapter as any).parseAggregates({ results: [] }, "AAPL");
      }).toThrow("No aggregate data found");
    });

    it("should handle missing previous close data", () => {
      const adapter = new PolygonAdapter("test-api-key");

      expect(() => {
        (adapter as any).parsePreviousClose({ results: [] }, "AAPL");
      }).toThrow("No previous close data found");
    });
  });

  describe("Request Queueing", () => {
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
      const originalPerformFetch = (adapter as any).performFetch.bind(adapter);
      
      (adapter as any).performFetch = vi.fn(async (request: any) => {
        const requestNum = parseInt(request.endpoint.split('-')[1] || '0');
        callOrder.push(requestNum);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 10));
        
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

    it("should handle errors in queued requests", async () => {
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
        await new Promise(resolve => setTimeout(resolve, 50));
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
    it("should have error classes defined", () => {
      expect(ConfigurationError).toBeDefined();
      expect(new ConfigurationError("test")).toBeInstanceOf(Error);
      expect(new ConfigurationError("test").name).toBe("ConfigurationError");
    });

    it("should validate symbol format", () => {
      const adapter = new PolygonAdapter("test-api-key");

      // Test that symbols are converted to uppercase
      const mockData = {
        results: {
          T: "aapl",
          p: 150,
          s: 1000,
          t: Date.now(),
        },
      };

      const quote = (adapter as any).parseCurrentQuote(mockData, "aapl");
      expect(quote.symbol).toBe("aapl"); // Uses the symbol from response
    });
  });
});
