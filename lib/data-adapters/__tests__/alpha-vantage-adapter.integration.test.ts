import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
    COMPANY_PROFILES: { revalidate: 604800, tags: ['company-profiles'] },
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
    companyProfile: (ticker: string) => `company-profile-${ticker}`,
  },
}));

// Import after mocking
import { AlphaVantageAdapter, StockQuote, CompanyProfile } from '../alpha-vantage-adapter';

/**
 * Integration tests for Alpha Vantage adapter
 * Tests actual API calls with real API key
 * 
 * Requirements: 7.1 - WHEN running integration tests THEN the system SHALL successfully fetch data from each API
 * 
 * Note: These tests require a valid ALPHA_VANTAGE_API_KEY environment variable.
 * Tests are skipped if the API key is not configured.
 * 
 * Rate Limits:
 * - Free tier: 5 requests per minute, 500 per day
 * - Tests are designed to stay within rate limits
 */

describe('AlphaVantageAdapter Integration Tests', () => {
  let adapter: AlphaVantageAdapter;
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const hasApiKey = apiKey && apiKey.trim() !== '';

  // Test symbols - using well-known, stable stocks
  const TEST_SYMBOL = 'AAPL';
  const TEST_SYMBOL_ALT = 'MSFT';

  beforeAll(() => {
    if (hasApiKey) {
      adapter = new AlphaVantageAdapter(apiKey);
    }
  });

  describe('Configuration', () => {
    it('should throw ConfigurationError when API key is missing', () => {
      const originalEnv = process.env.ALPHA_VANTAGE_API_KEY;
      delete process.env.ALPHA_VANTAGE_API_KEY;

      try {
        expect(() => new AlphaVantageAdapter('')).toThrow(ConfigurationError);
        expect(() => new AlphaVantageAdapter('')).toThrow('Alpha Vantage API key is required');
      } finally {
        if (originalEnv) {
          process.env.ALPHA_VANTAGE_API_KEY = originalEnv;
        }
      }
    });

    it.skipIf(!hasApiKey)('should initialize successfully with valid API key', () => {
      expect(adapter).toBeDefined();
      expect(adapter.isConfigured()).toBe(true);
    });

    it.skipIf(!hasApiKey)('should have correct rate limit configuration', () => {
      const rateLimit = adapter.getRateLimit();
      expect(rateLimit.requestsPerMinute).toBe(5); // Free tier limit
      expect(rateLimit.requestsRemaining).toBeLessThanOrEqual(5);
      expect(rateLimit.requestsRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quote Fetching End-to-End', () => {
    it.skipIf(!hasApiKey)('should fetch real-time stock quote for AAPL', async () => {
      const quote = await adapter.getQuote(TEST_SYMBOL);

      // Validate response structure
      expect(quote).toBeDefined();
      expect(quote.symbol).toBe(TEST_SYMBOL);
      expect(quote.source).toBe('Alpha Vantage');
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
      expect(Number.isInteger(quote.volume)).toBe(true);
    }, 30000); // 30 second timeout for API call

    it.skipIf(!hasApiKey)('should handle lowercase symbol input', async () => {
      const quote = await adapter.getQuote('aapl');

      expect(quote.symbol).toBe('AAPL');
      expect(quote.price).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!hasApiKey)('should return consistent data structure for different symbols', async () => {
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const quote = await adapter.getQuote(TEST_SYMBOL_ALT);

      // Validate same structure as AAPL
      expect(quote).toHaveProperty('symbol');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('change');
      expect(quote).toHaveProperty('changePercent');
      expect(quote).toHaveProperty('volume');
      expect(quote).toHaveProperty('timestamp');
      expect(quote).toHaveProperty('source');

      expect(quote.symbol).toBe(TEST_SYMBOL_ALT);
      expect(quote.source).toBe('Alpha Vantage');
    }, 45000);
  });

  describe('Company Overview Fetching End-to-End', () => {
    it.skipIf(!hasApiKey)('should fetch company overview for AAPL', async () => {
      // Wait to avoid rate limiting from previous tests
      await new Promise(resolve => setTimeout(resolve, 15000));

      const profile = await adapter.getCompanyOverview(TEST_SYMBOL);

      // Validate response structure
      expect(profile).toBeDefined();
      expect(profile.symbol).toBe(TEST_SYMBOL);
      expect(profile.source).toBe('Alpha Vantage');

      // Validate company info
      expect(typeof profile.name).toBe('string');
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.name.toLowerCase()).toContain('apple');

      expect(typeof profile.description).toBe('string');
      expect(profile.description.length).toBeGreaterThan(0);

      // Validate sector and industry
      expect(typeof profile.sector).toBe('string');
      expect(typeof profile.industry).toBe('string');

      // Validate market cap (Apple should have a large market cap)
      expect(typeof profile.marketCap).toBe('number');
      expect(profile.marketCap).toBeGreaterThan(1000000000000); // > $1 trillion

      // Validate optional numeric fields (can be null or number)
      if (profile.peRatio !== null) {
        expect(typeof profile.peRatio).toBe('number');
        expect(profile.peRatio).toBeGreaterThan(0);
      }

      if (profile.dividendYield !== null) {
        expect(typeof profile.dividendYield).toBe('number');
        expect(profile.dividendYield).toBeGreaterThanOrEqual(0);
      }

      if (profile.beta !== null) {
        expect(typeof profile.beta).toBe('number');
      }
    }, 45000);

    it.skipIf(!hasApiKey)('should handle lowercase symbol for company overview', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const profile = await adapter.getCompanyOverview('msft');

      expect(profile.symbol).toBe('MSFT');
      expect(profile.name.toLowerCase()).toContain('microsoft');
    }, 45000);
  });

  describe('Error Handling End-to-End', () => {
    it.skipIf(!hasApiKey)('should handle invalid symbol gracefully', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Using a clearly invalid symbol
      await expect(adapter.getQuote('INVALIDXYZ123')).rejects.toThrow();
    }, 45000);

    it('should throw ConfigurationError for invalid API key format', () => {
      expect(() => new AlphaVantageAdapter('')).toThrow(ConfigurationError);
      expect(() => new AlphaVantageAdapter('   ')).toThrow(ConfigurationError);
    });
  });

  describe('Rate Limit Tracking', () => {
    it.skipIf(!hasApiKey)('should track rate limit after API calls', async () => {
      // Get initial rate limit
      const initialRateLimit = adapter.getRateLimit();
      const initialRemaining = initialRateLimit.requestsRemaining;

      // The rate limit should have been decremented by previous tests
      // or be at max if tests ran with delays
      expect(initialRemaining).toBeLessThanOrEqual(5);
      expect(initialRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Quality Validation', () => {
    it.skipIf(!hasApiKey)('should return quote with valid timestamp', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 15000));

      const quote = await adapter.getQuote(TEST_SYMBOL);

      // Timestamp should be recent (within last hour)
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(quote.timestamp.getTime()).toBeGreaterThan(oneHourAgo.getTime());
      expect(quote.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
    }, 45000);
  });
});
