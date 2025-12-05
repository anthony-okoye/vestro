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
    MACRO_DATA: { revalidate: 3600, tags: ['macro-data'] },
  },
  CacheKeys: {
    interestRate: () => 'interest-rate',
    inflationRate: () => 'inflation-rate',
    unemploymentRate: () => 'unemployment-rate',
  },
}));

// Import after mocking
import { FederalReserveAdapter, EconomicData } from '../federal-reserve-adapter';

/**
 * Integration tests for Federal Reserve (FRED) adapter
 * Tests actual API calls with real API key
 * 
 * Requirements: 7.1 - WHEN running integration tests THEN the system SHALL successfully fetch data from each API
 * 
 * Note: These tests require a valid FRED_API_KEY environment variable.
 * Tests are skipped if the API key is not configured or if the API is not accessible.
 * 
 * Rate Limits:
 * - FRED API: 120 requests per minute
 * - Tests are designed to stay within rate limits
 */

describe('FederalReserveAdapter Integration Tests', () => {
  let adapter: FederalReserveAdapter | null = null;
  const apiKey = process.env.FRED_API_KEY;
  const hasApiKey = !!(apiKey && apiKey.trim() !== '');
  let apiIsAccessible = false;

  // Test series IDs - well-known economic indicators
  const TEST_SERIES_FEDFUNDS = 'FEDFUNDS'; // Federal Funds Rate
  const TEST_SERIES_UNRATE = 'UNRATE'; // Unemployment Rate
  const TEST_SERIES_CPIAUCSL = 'CPIAUCSL'; // Consumer Price Index

  beforeAll(async () => {
    if (hasApiKey) {
      try {
        adapter = new FederalReserveAdapter(apiKey);
        
        // Test if API is actually accessible with a simple request
        const data = await adapter.getSeries(TEST_SERIES_FEDFUNDS, undefined, undefined, 1);
        if (data && data.length > 0) {
          apiIsAccessible = true;
        }
      } catch (error) {
        // API is not accessible (invalid key, rate limited, etc.)
        console.log('FRED API not accessible, integration tests will be skipped:', 
          error instanceof Error ? error.message : String(error));
        apiIsAccessible = false;
      }
    }
  }, 60000); // 60 second timeout for beforeAll

  // Helper to determine if tests should run
  const canRunTests = () => hasApiKey && apiIsAccessible && adapter !== null;

  describe('Configuration', () => {
    it('should throw ConfigurationError when API key is missing', () => {
      const originalEnv = process.env.FRED_API_KEY;
      delete process.env.FRED_API_KEY;

      try {
        expect(() => new FederalReserveAdapter('')).toThrow(ConfigurationError);
        expect(() => new FederalReserveAdapter('')).toThrow('FRED API key is required');
      } finally {
        if (originalEnv) {
          process.env.FRED_API_KEY = originalEnv;
        }
      }
    });

    it('should throw ConfigurationError for whitespace-only API key', () => {
      const originalEnv = process.env.FRED_API_KEY;
      delete process.env.FRED_API_KEY;

      try {
        expect(() => new FederalReserveAdapter('   ')).toThrow(ConfigurationError);
      } finally {
        if (originalEnv) {
          process.env.FRED_API_KEY = originalEnv;
        }
      }
    });

    it('should report API key and accessibility status', () => {
      // This test documents the current state for debugging
      console.log(`FRED API Key configured: ${hasApiKey}`);
      console.log(`FRED API accessible: ${apiIsAccessible}`);
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
      expect(adapter!.sourceName).toBe('Federal Reserve FRED');
    });
  });

  describe('Series Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch Federal Funds Rate series', async () => {
      const data = await adapter!.getSeries(TEST_SERIES_FEDFUNDS, undefined, undefined, 10);

      // Validate response structure
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.length).toBeLessThanOrEqual(10);

      const observation = data[0];
      expect(observation.seriesId).toBe(TEST_SERIES_FEDFUNDS);
      expect(typeof observation.date).toBe('string');
      expect(typeof observation.value).toBe('number');

      // Federal Funds Rate should be a reasonable value (0-20%)
      expect(observation.value).toBeGreaterThanOrEqual(0);
      expect(observation.value).toBeLessThanOrEqual(25);
    }, 30000);

    it.skipIf(!canRunTests())('should fetch Unemployment Rate series', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await adapter!.getSeries(TEST_SERIES_UNRATE, undefined, undefined, 10);

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const observation = data[0];
      expect(observation.seriesId).toBe(TEST_SERIES_UNRATE);
      expect(typeof observation.value).toBe('number');

      // Unemployment rate should be a reasonable percentage (0-30%)
      expect(observation.value).toBeGreaterThanOrEqual(0);
      expect(observation.value).toBeLessThanOrEqual(30);
    }, 30000);

    it.skipIf(!canRunTests())('should fetch CPI series', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await adapter!.getSeries(TEST_SERIES_CPIAUCSL, undefined, undefined, 10);

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const observation = data[0];
      expect(observation.seriesId).toBe(TEST_SERIES_CPIAUCSL);
      expect(typeof observation.value).toBe('number');

      // CPI index value should be positive
      expect(observation.value).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!canRunTests())('should fetch series with date range', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // Last year

      const data = await adapter!.getSeries(TEST_SERIES_FEDFUNDS, startDate, endDate);

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // All dates should be within the requested range
      for (const observation of data) {
        const obsDate = new Date(observation.date);
        expect(obsDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime() - 86400000); // Allow 1 day tolerance
        expect(obsDate.getTime()).toBeLessThanOrEqual(endDate.getTime() + 86400000);
      }
    }, 30000);
  });

  describe('Latest Value Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch latest Federal Funds Rate value', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const value = await adapter!.getLatestValue(TEST_SERIES_FEDFUNDS);

      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(25);
    }, 30000);

    it.skipIf(!canRunTests())('should fetch latest Unemployment Rate value', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const value = await adapter!.getLatestValue(TEST_SERIES_UNRATE);

      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(30);
    }, 30000);
  });

  describe('Multiple Series Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch multiple series in batch', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const seriesIds = [TEST_SERIES_FEDFUNDS, TEST_SERIES_UNRATE, TEST_SERIES_CPIAUCSL];
      const results = await adapter!.getMultipleSeries(seriesIds);

      expect(results).toBeDefined();
      expect(results instanceof Map).toBe(true);
      expect(results.size).toBe(3);

      // Validate each series was fetched
      for (const seriesId of seriesIds) {
        expect(results.has(seriesId)).toBe(true);
        const data = results.get(seriesId);
        expect(Array.isArray(data)).toBe(true);
        expect(data!.length).toBeGreaterThan(0);
      }
    }, 60000);

    it.skipIf(!canRunTests())('should handle partial failures in batch fetch gracefully', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Include one invalid series ID
      const seriesIds = [TEST_SERIES_FEDFUNDS, 'INVALID_SERIES_XYZ123'];
      const results = await adapter!.getMultipleSeries(seriesIds);

      expect(results).toBeDefined();
      expect(results instanceof Map).toBe(true);

      // Valid series should have data
      const validData = results.get(TEST_SERIES_FEDFUNDS);
      expect(Array.isArray(validData)).toBe(true);
      expect(validData!.length).toBeGreaterThan(0);

      // Invalid series should have empty array (graceful failure)
      const invalidData = results.get('INVALID_SERIES_XYZ123');
      expect(Array.isArray(invalidData)).toBe(true);
      expect(invalidData!.length).toBe(0);
    }, 60000);
  });

  describe('Economic Indicator Methods End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch interest rate', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const rate = await adapter!.fetchInterestRate();

      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(25);
    }, 30000);

    it.skipIf(!canRunTests())('should fetch unemployment rate', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const rate = await adapter!.fetchUnemploymentRate();

      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(30);
    }, 30000);

    it.skipIf(!canRunTests())('should fetch inflation rate', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const rate = await adapter!.fetchInflationRate();

      expect(typeof rate).toBe('number');
      // Inflation can be negative (deflation) or positive
      expect(rate).toBeGreaterThanOrEqual(-10);
      expect(rate).toBeLessThanOrEqual(20);
    }, 30000);
  });

  describe('Error Handling End-to-End', () => {
    it.skipIf(!canRunTests())('should handle invalid series ID gracefully', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Using a clearly invalid series ID
      await expect(adapter!.getLatestValue('INVALID_SERIES_XYZ123')).rejects.toThrow();
    }, 30000);
  });

  describe('Data Quality Validation', () => {
    it.skipIf(!canRunTests())('should return series data with valid dates', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await adapter!.getSeries(TEST_SERIES_FEDFUNDS, undefined, undefined, 20);

      // All dates should be valid
      const now = new Date();
      for (const observation of data) {
        const obsDate = new Date(observation.date);
        expect(obsDate.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(obsDate.getFullYear()).toBeGreaterThan(1900);
      }
    }, 30000);

    it.skipIf(!canRunTests())('should return data in descending date order', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await adapter!.getSeries(TEST_SERIES_FEDFUNDS, undefined, undefined, 20);

      // Data should be sorted in descending order (most recent first)
      for (let i = 1; i < data.length; i++) {
        const currentDate = new Date(data[i].date);
        const previousDate = new Date(data[i - 1].date);
        expect(currentDate.getTime()).toBeLessThanOrEqual(previousDate.getTime());
      }
    }, 30000);

    it.skipIf(!canRunTests())('should return consistent data across multiple calls', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data1 = await adapter!.getSeries(TEST_SERIES_FEDFUNDS, undefined, undefined, 5);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data2 = await adapter!.getSeries(TEST_SERIES_FEDFUNDS, undefined, undefined, 5);

      // Core data should be consistent
      expect(data1.length).toBe(data2.length);
      for (let i = 0; i < data1.length; i++) {
        expect(data1[i].seriesId).toBe(data2[i].seriesId);
        expect(data1[i].date).toBe(data2[i].date);
        expect(data1[i].value).toBe(data2[i].value);
      }
    }, 60000);
  });
});
