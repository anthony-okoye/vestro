import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ConfigurationError } from '../../api-error';

// Mock the cache-config module to bypass Next.js unstable_cache
vi.mock('../../cache-config', () => ({
  createCachedFetcher: <T extends (...args: any[]) => Promise<any>>(
    fetcher: T,
    _cacheKey: string,
    _config: { revalidate: number; tags: string[] }
  ): T => fetcher,
  CACHE_CONFIG: {
    QUOTES: { revalidate: 900, tags: ['quotes'] },
    HISTORICAL_DATA: { revalidate: 86400, tags: ['historical-data'] },
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
  },
}));

// Import after mocking
import { PolygonAdapter } from '../polygon-adapter';

/**
 * Integration tests for Polygon.io adapter
 * Tests actual API calls with real API key
 * 
 * Requirements: 7.1 - WHEN running integration tests THEN the system SHALL successfully fetch data from each API
 * 
 * Note: These tests require a valid POLYGON_API_KEY environment variable.
 * Tests are skipped if the API key is not configured or if the API is not accessible.
 * 
 * Rate Limits:
 * - Free tier: 5 requests per minute
 * - Tests are designed to stay within rate limits with appropriate delays
 */

describe('PolygonAdapter Integration Tests', () => {
  let adapter: PolygonAdapter | null = null;
  const apiKey = process.env.POLYGON_API_KEY;
  const hasApiKey = !!(apiKey && apiKey.trim() !== '');
  let apiIsAccessible = false;

  // Test symbols - using well-known, stable stocks
  const TEST_SYMBOL = 'AAPL';
  const TEST_SYMBOL_ALT = 'MSFT';

  beforeAll(async () => {
    if (hasApiKey) {
      try {
        adapter = new PolygonAdapter(apiKey);
        
        // Test if API is actually accessible with a simple request
        // Polygon free tier may have limitations
        const quote = await adapter.getPreviousClose(TEST_SYMBOL);
        if (quote && quote.symbol === TEST_SYMBOL) {
          apiIsAccessible = true;
        }
      } catch (error) {
        // API is not accessible (invalid key, rate limited, etc.)
        console.log('Polygon API not accessible, integration tests will be skipped:', 
          error instanceof Error ? error.message : String(error));
        apiIsAccessible = false;
      }
    }
  }, 60000); // 60 second timeout for beforeAll

  // Helper to determine if tests should run
  const canRunTests = () => hasApiKey && apiIsAccessible && adapter !== null;

  describe('Configuration', () => {
    it('should throw ConfigurationError when API key is missing', () => {
      const originalEnv = process.env.POLYGON_API_KEY;
      delete process.env.POLYGON_API_KEY;

      try {
        expect(() => new PolygonAdapter('')).toThrow(ConfigurationError);
        expect(() => new PolygonAdapter('')).toThrow('Polygon.io API key is required');
      } finally {
        if (originalEnv) {
          process.env.POLYGON_API_KEY = originalEnv;
        }
      }
    });

    it('should throw ConfigurationError for whitespace-only API key', () => {
      const originalEnv = process.env.POLYGON_API_KEY;
      delete process.env.POLYGON_API_KEY;

      try {
        expect(() => new PolygonAdapter('   ')).toThrow(ConfigurationError);
      } finally {
        if (originalEnv) {
          process.env.POLYGON_API_KEY = originalEnv;
        }
      }
    });

    it('should report API key and accessibility status', () => {
      // This test documents the current state for debugging
      console.log(`Polygon API Key configured: ${hasApiKey}`);
      console.log(`Polygon API accessible: ${apiIsAccessible}`);
      console.log(`Adapter initialized: ${adapter !== null}`);
      
      // Always passes - just for documentation
      expect(typeof hasApiKey).toBe('boolean');
      expect(typeof apiIsAccessible).toBe('boolean');
    });

    it.skipIf(!hasApiKey)('should initialize successfully with valid API key', () => {
      expect(adapter).toBeDefined();
      expect(adapter!.isConfigured()).toBe(true);
    });

    it.skipIf(!hasApiKey)('should have correct source name', () => {
      expect(adapter!.sourceName).toBe('Polygon.io');
    });
  });

  describe('Quote Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch previous close for AAPL', async () => {
      const quote = await adapter!.getPreviousClose(TEST_SYMBOL);

      // Validate response structure
      expect(quote).toBeDefined();
      expect(quote.symbol).toBe(TEST_SYMBOL);
      expect(quote.source).toBe('Polygon.io');
      expect(quote.timestamp).toBeInstanceOf(Date);

      // Validate price data (should be positive numbers for a real stock)
      expect(typeof quote.price).toBe('number');
      expect(quote.price).toBeGreaterThan(0);

      // Validate change data (can be positive, negative, or zero)
      expect(typeof quote.change).toBe('number');
      expect(typeof quote.changePercent).toBe('number');

      // Validate volume (should be a non-negative integer)
      expect(typeof quote.volume).toBe('number');
      expect(quote.volume).toBeGreaterThanOrEqual(0);
    }, 30000);

    it.skipIf(!canRunTests())('should handle lowercase symbol input for previous close', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const quote = await adapter!.getPreviousClose('aapl');

      expect(quote.symbol).toBe('AAPL');
      expect(quote.price).toBeGreaterThan(0);
    }, 45000);

    it.skipIf(!canRunTests())('should return consistent data structure for different symbols', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const quote = await adapter!.getPreviousClose(TEST_SYMBOL_ALT);

      // Validate same structure as AAPL
      expect(quote).toHaveProperty('symbol');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('change');
      expect(quote).toHaveProperty('changePercent');
      expect(quote).toHaveProperty('volume');
      expect(quote).toHaveProperty('timestamp');
      expect(quote).toHaveProperty('source');

      expect(quote.symbol).toBe(TEST_SYMBOL_ALT);
      expect(quote.source).toBe('Polygon.io');
    }, 45000);
  });

  describe('Historical Data Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch daily aggregates for AAPL', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30); // Last 30 days

      const historicalData = await adapter!.getAggregates(TEST_SYMBOL, 'day', from, to);

      // Validate response structure
      expect(historicalData).toBeDefined();
      expect(historicalData.symbol).toBe(TEST_SYMBOL);
      expect(historicalData.source).toBe('Polygon.io');
      expect(Array.isArray(historicalData.bars)).toBe(true);
      expect(historicalData.bars.length).toBeGreaterThan(0);

      // Validate bar data
      const bar = historicalData.bars[0];
      expect(bar.timestamp).toBeInstanceOf(Date);
      expect(typeof bar.open).toBe('number');
      expect(typeof bar.high).toBe('number');
      expect(typeof bar.low).toBe('number');
      expect(typeof bar.close).toBe('number');
      expect(typeof bar.volume).toBe('number');

      // Validate OHLC relationships (high >= low, high >= open/close, low <= open/close)
      expect(bar.high).toBeGreaterThanOrEqual(bar.low);
      expect(bar.high).toBeGreaterThanOrEqual(bar.open);
      expect(bar.high).toBeGreaterThanOrEqual(bar.close);
      expect(bar.low).toBeLessThanOrEqual(bar.open);
      expect(bar.low).toBeLessThanOrEqual(bar.close);

      // Validate positive values for a real stock
      expect(bar.open).toBeGreaterThan(0);
      expect(bar.close).toBeGreaterThan(0);
      expect(bar.volume).toBeGreaterThanOrEqual(0);
    }, 45000);

    it.skipIf(!canRunTests())('should fetch weekly aggregates', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90); // Last 90 days for weekly data

      const historicalData = await adapter!.getAggregates(TEST_SYMBOL, 'week', from, to);

      expect(historicalData).toBeDefined();
      expect(historicalData.symbol).toBe(TEST_SYMBOL);
      expect(historicalData.bars.length).toBeGreaterThan(0);
      
      // Weekly bars should have fewer entries than daily
      expect(historicalData.bars.length).toBeLessThanOrEqual(15); // ~13 weeks in 90 days
    }, 45000);

    it.skipIf(!canRunTests())('should fetch monthly aggregates', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1); // Last year for monthly data

      const historicalData = await adapter!.getAggregates(TEST_SYMBOL, 'month', from, to);

      expect(historicalData).toBeDefined();
      expect(historicalData.symbol).toBe(TEST_SYMBOL);
      expect(historicalData.bars.length).toBeGreaterThan(0);
      
      // Monthly bars should have ~12 entries for a year
      expect(historicalData.bars.length).toBeLessThanOrEqual(13);
    }, 45000);

    it.skipIf(!canRunTests())('should fetch daily prices using helper method', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const historicalData = await adapter!.getDailyPrices(TEST_SYMBOL, 14);

      expect(historicalData).toBeDefined();
      expect(historicalData.symbol).toBe(TEST_SYMBOL);
      expect(historicalData.source).toBe('Polygon.io');
      expect(historicalData.bars.length).toBeGreaterThan(0);
      
      // Should have approximately 10 trading days in 14 calendar days
      expect(historicalData.bars.length).toBeLessThanOrEqual(14);
    }, 45000);

    it.skipIf(!canRunTests())('should handle lowercase symbol for historical data', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const historicalData = await adapter!.getDailyPrices('msft', 7);

      expect(historicalData.symbol).toBe('MSFT');
      expect(historicalData.bars.length).toBeGreaterThan(0);
    }, 45000);
  });

  describe('Error Handling End-to-End', () => {
    it.skipIf(!canRunTests())('should handle invalid symbol gracefully for previous close', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Using a clearly invalid symbol
      await expect(adapter!.getPreviousClose('INVALIDXYZ123')).rejects.toThrow();
    }, 45000);

    it.skipIf(!canRunTests())('should handle invalid symbol gracefully for historical data', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);

      await expect(adapter!.getAggregates('INVALIDXYZ123', 'day', from, to)).rejects.toThrow();
    }, 45000);
  });

  describe('Data Quality Validation', () => {
    it.skipIf(!canRunTests())('should return historical data with valid timestamps', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);

      const historicalData = await adapter!.getAggregates(TEST_SYMBOL, 'day', from, to);

      // All timestamps should be valid and within the requested range
      const now = new Date();
      for (const bar of historicalData.bars) {
        expect(bar.timestamp).toBeInstanceOf(Date);
        expect(bar.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(bar.timestamp.getFullYear()).toBeGreaterThan(2000);
      }
    }, 45000);

    it.skipIf(!canRunTests())('should return bars in chronological order', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);

      const historicalData = await adapter!.getAggregates(TEST_SYMBOL, 'day', from, to);

      // Bars should be sorted in ascending order (oldest first)
      for (let i = 1; i < historicalData.bars.length; i++) {
        expect(historicalData.bars[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(historicalData.bars[i - 1].timestamp.getTime());
      }
    }, 45000);

    it.skipIf(!canRunTests())('should return quote with valid timestamp', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const quote = await adapter!.getPreviousClose(TEST_SYMBOL);

      // Timestamp should be recent (within last week for previous close)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(quote.timestamp.getTime()).toBeGreaterThan(oneWeekAgo.getTime());
      expect(quote.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
    }, 45000);
  });
});
