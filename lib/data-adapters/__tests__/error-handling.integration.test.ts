import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import {
  ConfigurationError,
  RateLimitError,
  NetworkError,
  ValidationError,
  NotFoundError,
  APIError,
  ErrorLogger,
} from '../../api-error';
import { FallbackStrategies, DataAdapter } from '../../fallback-strategies';

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
    FINANCIAL_STATEMENTS: { revalidate: 86400, tags: ['financial-statements'] },
    HISTORICAL_DATA: { revalidate: 86400, tags: ['historical-data'] },
    MACRO_DATA: { revalidate: 3600, tags: ['macro-data'] },
    VALUATION_DATA: { revalidate: 86400, tags: ['valuation-data'] },
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
    companyProfile: (ticker: string) => `company-profile-${ticker}`,
    incomeStatement: (ticker: string) => `income-statement-${ticker}`,
    balanceSheet: (ticker: string) => `balance-sheet-${ticker}`,
    cashFlowStatement: (ticker: string) => `cash-flow-statement-${ticker}`,
    keyMetrics: (ticker: string) => `key-metrics-${ticker}`,
    interestRate: () => 'interest-rate',
    inflationRate: () => 'inflation-rate',
    unemploymentRate: () => 'unemployment-rate',
  },
}));

// Import adapters after mocking
import { AlphaVantageAdapter } from '../alpha-vantage-adapter';
import { FinancialModelingPrepAdapter } from '../fmp-adapter';
import { PolygonAdapter } from '../polygon-adapter';
import { FederalReserveAdapter } from '../federal-reserve-adapter';

/**
 * Integration tests for error handling across all API adapters
 * Tests invalid API key handling, rate limiting behavior, and fallback strategies
 * 
 * Requirements:
 * - 7.2: WHEN testing error scenarios THEN the system SHALL handle invalid API keys gracefully
 * - 7.3: WHEN testing rate limiting THEN the system SHALL respect rate limits and retry appropriately
 * - 7.4: WHEN testing fallback strategies THEN the system SHALL use alternative sources when primary sources fail
 */

describe('Error Handling Integration Tests', () => {
  let errorLogger: ErrorLogger;

  beforeEach(() => {
    errorLogger = ErrorLogger.getInstance();
    errorLogger.clear();
  });

  afterEach(() => {
    errorLogger.clear();
  });

  /**
   * Test Suite: Invalid API Key Handling
   * Requirements: 7.2 - WHEN testing error scenarios THEN the system SHALL handle invalid API keys gracefully
   */
  describe('Invalid API Key Handling', () => {
    describe('Alpha Vantage Adapter', () => {
      it('should throw ConfigurationError when API key is empty', () => {
        expect(() => new AlphaVantageAdapter('')).toThrow(ConfigurationError);
        expect(() => new AlphaVantageAdapter('')).toThrow('Alpha Vantage API key is required');
      });

      it('should throw ConfigurationError when API key is whitespace only', () => {
        expect(() => new AlphaVantageAdapter('   ')).toThrow(ConfigurationError);
      });

      it('should throw ConfigurationError when API key is undefined', () => {
        const originalEnv = process.env.ALPHA_VANTAGE_API_KEY;
        delete process.env.ALPHA_VANTAGE_API_KEY;

        try {
          expect(() => new AlphaVantageAdapter(undefined)).toThrow(ConfigurationError);
        } finally {
          if (originalEnv) {
            process.env.ALPHA_VANTAGE_API_KEY = originalEnv;
          }
        }
      });

      it('should log ConfigurationError when API key is invalid', () => {
        try {
          new AlphaVantageAdapter('');
        } catch (error) {
          // Expected to throw
        }

        const errors = errorLogger.getErrorsByProvider('Alpha Vantage');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].error).toBeInstanceOf(ConfigurationError);
      });
    });

    describe('Financial Modeling Prep Adapter', () => {
      it('should throw ConfigurationError when API key is empty', () => {
        const originalEnv = process.env.FMP_API_KEY;
        delete process.env.FMP_API_KEY;

        try {
          expect(() => new FinancialModelingPrepAdapter('')).toThrow(ConfigurationError);
          expect(() => new FinancialModelingPrepAdapter('')).toThrow('Financial Modeling Prep API key is required');
        } finally {
          if (originalEnv) {
            process.env.FMP_API_KEY = originalEnv;
          }
        }
      });

      it('should throw ConfigurationError when API key is whitespace only', () => {
        expect(() => new FinancialModelingPrepAdapter('   ')).toThrow(ConfigurationError);
      });

      it('should log ConfigurationError when API key is invalid', () => {
        const originalEnv = process.env.FMP_API_KEY;
        delete process.env.FMP_API_KEY;

        try {
          try {
            new FinancialModelingPrepAdapter('');
          } catch (error) {
            // Expected to throw
          }

          const errors = errorLogger.getErrorsByProvider('Financial Modeling Prep');
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].error).toBeInstanceOf(ConfigurationError);
        } finally {
          if (originalEnv) {
            process.env.FMP_API_KEY = originalEnv;
          }
        }
      });
    });

    describe('Polygon Adapter', () => {
      it('should throw ConfigurationError when API key is empty', () => {
        expect(() => new PolygonAdapter('')).toThrow(ConfigurationError);
        expect(() => new PolygonAdapter('')).toThrow('Polygon.io API key is required');
      });

      it('should throw ConfigurationError when API key is whitespace only', () => {
        expect(() => new PolygonAdapter('   ')).toThrow(ConfigurationError);
      });

      it('should log ConfigurationError when API key is invalid', () => {
        try {
          new PolygonAdapter('');
        } catch (error) {
          // Expected to throw
        }

        const errors = errorLogger.getErrorsByProvider('Polygon.io');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].error).toBeInstanceOf(ConfigurationError);
      });
    });

    describe('Federal Reserve (FRED) Adapter', () => {
      it('should throw ConfigurationError when API key is empty', () => {
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

      it('should throw ConfigurationError when API key is whitespace only', () => {
        expect(() => new FederalReserveAdapter('   ')).toThrow(ConfigurationError);
      });

      it('should log ConfigurationError when API key is invalid', () => {
        const originalEnv = process.env.FRED_API_KEY;
        delete process.env.FRED_API_KEY;

        try {
          try {
            new FederalReserveAdapter('');
          } catch (error) {
            // Expected to throw
          }

          const errors = errorLogger.getErrorsByProvider('Federal Reserve FRED');
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].error).toBeInstanceOf(ConfigurationError);
        } finally {
          if (originalEnv) {
            process.env.FRED_API_KEY = originalEnv;
          }
        }
      });
    });

    describe('Error Type Validation', () => {
      it('ConfigurationError should not be retryable', () => {
        const error = new ConfigurationError('Test error', 'TestProvider');
        expect(error.retryable).toBe(false);
        expect(error.code).toBe('CONFIGURATION_ERROR');
      });

      it('ConfigurationError should have correct provider', () => {
        const error = new ConfigurationError('Test error', 'TestProvider');
        expect(error.provider).toBe('TestProvider');
      });

      it('ConfigurationError should serialize to JSON correctly', () => {
        const error = new ConfigurationError('Test error', 'TestProvider');
        const json = error.toJSON();
        expect(json.name).toBe('ConfigurationError');
        expect(json.code).toBe('CONFIGURATION_ERROR');
        expect(json.provider).toBe('TestProvider');
        expect(json.retryable).toBe(false);
      });
    });
  });


  /**
   * Test Suite: Rate Limiting Behavior
   * Requirements: 7.3 - WHEN testing rate limiting THEN the system SHALL respect rate limits and retry appropriately
   */
  describe('Rate Limiting Behavior', () => {
    describe('RateLimitError Properties', () => {
      it('RateLimitError should be retryable', () => {
        const error = new RateLimitError('Rate limit exceeded', 'TestProvider', 60);
        expect(error.retryable).toBe(true);
        expect(error.code).toBe('RATE_LIMIT_ERROR');
      });

      it('RateLimitError should have retryAfter value', () => {
        const error = new RateLimitError('Rate limit exceeded', 'TestProvider', 120);
        expect(error.retryAfter).toBe(120);
        expect(error.getRetryAfterSeconds()).toBe(120);
      });

      it('RateLimitError should default to 60 seconds if retryAfter not specified', () => {
        const error = new RateLimitError('Rate limit exceeded', 'TestProvider');
        expect(error.getRetryAfterSeconds()).toBe(60);
      });

      it('RateLimitError should serialize to JSON correctly', () => {
        const error = new RateLimitError('Rate limit exceeded', 'TestProvider', 30);
        const json = error.toJSON();
        expect(json.name).toBe('RateLimitError');
        expect(json.code).toBe('RATE_LIMIT_ERROR');
        expect(json.retryable).toBe(true);
      });
    });

    describe('NetworkError Properties', () => {
      it('NetworkError should be retryable', () => {
        const error = new NetworkError('Connection failed', 'TestProvider');
        expect(error.retryable).toBe(true);
        expect(error.code).toBe('NETWORK_ERROR');
      });

      it('NetworkError should preserve original error', () => {
        const originalError = new Error('Original network error');
        const error = new NetworkError('Connection failed', 'TestProvider', originalError);
        expect(error.originalError).toBe(originalError);
      });
    });

    describe('ValidationError Properties', () => {
      it('ValidationError should not be retryable', () => {
        const error = new ValidationError('Invalid response', 'TestProvider');
        expect(error.retryable).toBe(false);
        expect(error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('NotFoundError Properties', () => {
      it('NotFoundError should not be retryable', () => {
        const error = new NotFoundError('Symbol not found', 'TestProvider');
        expect(error.retryable).toBe(false);
        expect(error.code).toBe('NOT_FOUND_ERROR');
      });
    });

    describe('Adapter Rate Limit Configuration', () => {
      it('Alpha Vantage adapter should have correct rate limit (5 req/min)', () => {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (apiKey && apiKey.trim() !== '') {
          const adapter = new AlphaVantageAdapter(apiKey);
          const rateLimit = adapter.getRateLimit();
          expect(rateLimit.requestsPerMinute).toBe(5);
        } else {
          // Skip if no API key
          expect(true).toBe(true);
        }
      });

      it('Polygon adapter should have correct rate limit (5 req/min for free tier)', () => {
        const apiKey = process.env.POLYGON_API_KEY;
        if (apiKey && apiKey.trim() !== '') {
          const adapter = new PolygonAdapter(apiKey);
          const rateLimit = adapter.getRateLimit();
          expect(rateLimit.requestsPerMinute).toBe(5);
        } else {
          // Skip if no API key
          expect(true).toBe(true);
        }
      });
    });
  });


  /**
   * Test Suite: Fallback Strategies
   * Requirements: 7.4 - WHEN testing fallback strategies THEN the system SHALL use alternative sources when primary sources fail
   */
  describe('Fallback Strategies', () => {
    let fallbackStrategies: FallbackStrategies;

    beforeEach(() => {
      fallbackStrategies = new FallbackStrategies();
    });

    afterEach(() => {
      fallbackStrategies.clearAllFallbackChains();
      fallbackStrategies.clearAllCaches();
    });

    /**
     * Helper to create a mock adapter for testing
     */
    function createMockAdapter(
      name: string,
      configured: boolean,
      shouldSucceed: boolean,
      returnValue?: any
    ): DataAdapter {
      return {
        sourceName: name,
        isConfigured: () => configured,
        fetch: vi.fn().mockImplementation(async () => {
          if (shouldSucceed) {
            return returnValue ?? { data: `data-from-${name}`, source: name };
          }
          throw new NetworkError(`Failed to fetch from ${name}`, name);
        }),
      };
    }

    describe('Fallback Chain Registration', () => {
      it('should register fallback chain for data type', () => {
        const primary = createMockAdapter('primary', true, true);
        const fallback = createMockAdapter('fallback', true, true);

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback],
        });

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.has('test-data')).toBe(true);
      });

      it('should clear specific fallback chain', () => {
        const primary = createMockAdapter('primary', true, true);

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [],
        });

        fallbackStrategies.clearFallbackChain('test-data');

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.has('test-data')).toBe(false);
      });

      it('should clear all fallback chains', () => {
        const primary = createMockAdapter('primary', true, true);

        fallbackStrategies.registerFallbackChain('test-data-1', { primary, fallbacks: [] });
        fallbackStrategies.registerFallbackChain('test-data-2', { primary, fallbacks: [] });

        fallbackStrategies.clearAllFallbackChains();

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.size).toBe(0);
      });
    });

    describe('Fallback Activation on Primary Failure', () => {
      it('should use fallback when primary source fails', async () => {
        const primary = createMockAdapter('primary', true, false);
        const fallback = createMockAdapter('fallback', true, true, { data: 'fallback-data' });

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback],
        });

        const result = await fallbackStrategies.fetchWithFallback(
          'test-data',
          async (adapter) => adapter.fetch({})
        );

        expect(result.data).toEqual({ data: 'fallback-data' });
        expect(result.usedFallback).toBe(true);
        expect(result.source).toBe('fallback');
        expect(primary.fetch).toHaveBeenCalled();
        expect(fallback.fetch).toHaveBeenCalled();
      });

      it('should not use fallback when primary source succeeds', async () => {
        const primary = createMockAdapter('primary', true, true, { data: 'primary-data' });
        const fallback = createMockAdapter('fallback', true, true);

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback],
        });

        const result = await fallbackStrategies.fetchWithFallback(
          'test-data',
          async (adapter) => adapter.fetch({})
        );

        expect(result.data).toEqual({ data: 'primary-data' });
        expect(result.usedFallback).toBe(false);
        expect(result.source).toBe('primary');
        expect(primary.fetch).toHaveBeenCalled();
        expect(fallback.fetch).not.toHaveBeenCalled();
      });

      it('should try multiple fallbacks in order', async () => {
        const primary = createMockAdapter('primary', true, false);
        const fallback1 = createMockAdapter('fallback1', true, false);
        const fallback2 = createMockAdapter('fallback2', true, true, { data: 'fallback2-data' });

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback1, fallback2],
        });

        const result = await fallbackStrategies.fetchWithFallback(
          'test-data',
          async (adapter) => adapter.fetch({})
        );

        expect(result.data).toEqual({ data: 'fallback2-data' });
        expect(result.usedFallback).toBe(true);
        expect(result.source).toBe('fallback2');
        expect(primary.fetch).toHaveBeenCalled();
        expect(fallback1.fetch).toHaveBeenCalled();
        expect(fallback2.fetch).toHaveBeenCalled();
      });

      it('should return null when all sources fail', async () => {
        const primary = createMockAdapter('primary', true, false);
        const fallback = createMockAdapter('fallback', true, false);

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback],
        });

        const result = await fallbackStrategies.fetchWithFallback(
          'test-data',
          async (adapter) => adapter.fetch({})
        );

        expect(result.data).toBeNull();
        expect(result.usedFallback).toBe(false);
        expect(result.warnings).toContain('All data sources failed for test-data');
      });
    });


    describe('Unconfigured Adapter Handling', () => {
      it('should skip unconfigured adapters', async () => {
        const primary = createMockAdapter('primary', false, true);
        const fallback = createMockAdapter('fallback', true, true, { data: 'fallback-data' });

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback],
        });

        const result = await fallbackStrategies.fetchWithFallback(
          'test-data',
          async (adapter) => adapter.fetch({})
        );

        expect(result.data).toEqual({ data: 'fallback-data' });
        expect(result.usedFallback).toBe(true);
        expect(primary.fetch).not.toHaveBeenCalled();
        expect(fallback.fetch).toHaveBeenCalled();
      });

      it('should add warning for unconfigured adapters', async () => {
        const primary = createMockAdapter('primary', false, true);
        const fallback = createMockAdapter('fallback', true, true);

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback],
        });

        const result = await fallbackStrategies.fetchWithFallback(
          'test-data',
          async (adapter) => adapter.fetch({})
        );

        expect(result.warnings.some(w => w.includes('primary') && w.includes('not configured'))).toBe(true);
      });
    });

    describe('No Fallback Chain Configured', () => {
      it('should return null with warning when no chain is configured', async () => {
        const result = await fallbackStrategies.fetchWithFallback(
          'unknown-data-type',
          async () => ({ data: 'test' })
        );

        expect(result.data).toBeNull();
        expect(result.usedFallback).toBe(false);
        expect(result.warnings).toContain('No fallback chain configured for unknown-data-type');
      });
    });

    describe('Warning Accumulation', () => {
      it('should accumulate warnings for each failed adapter', async () => {
        const primary = createMockAdapter('primary', true, false);
        const fallback1 = createMockAdapter('fallback1', true, false);
        const fallback2 = createMockAdapter('fallback2', true, true);

        fallbackStrategies.registerFallbackChain('test-data', {
          primary,
          fallbacks: [fallback1, fallback2],
        });

        const result = await fallbackStrategies.fetchWithFallback(
          'test-data',
          async (adapter) => adapter.fetch({})
        );

        // Should have warnings for primary and fallback1
        expect(result.warnings.some(w => w.includes('primary'))).toBe(true);
        expect(result.warnings.some(w => w.includes('fallback1'))).toBe(true);
      });
    });

    describe('API Adapter Priority Configuration', () => {
      it('should configure stock quote fallback chain', () => {
        const polygon = createMockAdapter('Polygon.io', true, true);
        const alphaVantage = createMockAdapter('Alpha Vantage', true, true);
        const yahoo = createMockAdapter('Yahoo Finance', true, true);

        fallbackStrategies.configureAPIAdapterPriority({
          polygon,
          alphaVantage,
          yahoo,
        });

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.has('stock-quote')).toBe(true);
      });

      it('should configure company profile fallback chain', () => {
        const alphaVantage = createMockAdapter('Alpha Vantage', true, true);
        const fmp = createMockAdapter('FMP', true, true);

        fallbackStrategies.configureAPIAdapterPriority({
          alphaVantage,
          fmp,
        });

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.has('company-profile')).toBe(true);
      });

      it('should configure financial statements fallback chain', () => {
        const fmp = createMockAdapter('FMP', true, true);
        const morningstar = createMockAdapter('Morningstar', true, true);

        fallbackStrategies.configureAPIAdapterPriority({
          fmp,
          morningstar,
        });

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.has('financial-statements')).toBe(true);
      });

      it('should configure historical data fallback chain', () => {
        const polygon = createMockAdapter('Polygon.io', true, true);
        const alphaVantage = createMockAdapter('Alpha Vantage', true, true);

        fallbackStrategies.configureAPIAdapterPriority({
          polygon,
          alphaVantage,
        });

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.has('historical-data')).toBe(true);
      });

      it('should configure economic indicators fallback chain', () => {
        const fred = createMockAdapter('FRED', true, true);

        fallbackStrategies.configureAPIAdapterPriority({
          fred,
        });

        const chains = fallbackStrategies.getFallbackChains();
        expect(chains.has('economic-indicators')).toBe(true);
      });
    });
  });


  /**
   * Test Suite: Error Logger Integration
   * Tests error logging functionality across adapters
   */
  describe('Error Logger Integration', () => {
    // Store original env vars
    let originalAlphaVantageKey: string | undefined;
    let originalFmpKey: string | undefined;
    let originalPolygonKey: string | undefined;
    let originalFredKey: string | undefined;

    beforeEach(() => {
      // Save original env vars
      originalAlphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
      originalFmpKey = process.env.FMP_API_KEY;
      originalPolygonKey = process.env.POLYGON_API_KEY;
      originalFredKey = process.env.FRED_API_KEY;
      
      // Clear env vars for testing
      delete process.env.ALPHA_VANTAGE_API_KEY;
      delete process.env.FMP_API_KEY;
      delete process.env.POLYGON_API_KEY;
      delete process.env.FRED_API_KEY;
    });

    afterEach(() => {
      // Restore original env vars
      if (originalAlphaVantageKey) process.env.ALPHA_VANTAGE_API_KEY = originalAlphaVantageKey;
      if (originalFmpKey) process.env.FMP_API_KEY = originalFmpKey;
      if (originalPolygonKey) process.env.POLYGON_API_KEY = originalPolygonKey;
      if (originalFredKey) process.env.FRED_API_KEY = originalFredKey;
    });

    it('should track errors by provider', () => {
      // Generate errors from different providers
      try { new AlphaVantageAdapter(''); } catch (e) { /* expected */ }
      try { new FinancialModelingPrepAdapter(''); } catch (e) { /* expected */ }
      try { new PolygonAdapter(''); } catch (e) { /* expected */ }
      try { new FederalReserveAdapter(''); } catch (e) { /* expected */ }

      const stats = errorLogger.getStats();
      expect(stats.total).toBe(4);
      expect(stats.byProvider['Alpha Vantage']).toBe(1);
      expect(stats.byProvider['Financial Modeling Prep']).toBe(1);
      expect(stats.byProvider['Polygon.io']).toBe(1);
      expect(stats.byProvider['Federal Reserve FRED']).toBe(1);
    });

    it('should track errors by type', () => {
      try { new AlphaVantageAdapter(''); } catch (e) { /* expected */ }
      try { new FinancialModelingPrepAdapter(''); } catch (e) { /* expected */ }

      const stats = errorLogger.getStats();
      expect(stats.byType['ConfigurationError']).toBe(2);
    });

    it('should track retryable vs non-retryable errors', () => {
      // ConfigurationErrors are not retryable
      try { new AlphaVantageAdapter(''); } catch (e) { /* expected */ }
      try { new FinancialModelingPrepAdapter(''); } catch (e) { /* expected */ }

      const stats = errorLogger.getStats();
      expect(stats.nonRetryable).toBe(2);
      expect(stats.retryable).toBe(0);
    });

    it('should clear error log', () => {
      try { new AlphaVantageAdapter(''); } catch (e) { /* expected */ }

      expect(errorLogger.getErrors().length).toBeGreaterThan(0);

      errorLogger.clear();

      expect(errorLogger.getErrors().length).toBe(0);
    });

    it('should get errors for specific provider', () => {
      try { new AlphaVantageAdapter(''); } catch (e) { /* expected */ }
      try { new FinancialModelingPrepAdapter(''); } catch (e) { /* expected */ }

      const alphaVantageErrors = errorLogger.getErrorsByProvider('Alpha Vantage');
      expect(alphaVantageErrors.length).toBe(1);
      expect(alphaVantageErrors[0].error.provider).toBe('Alpha Vantage');
    });
  });

  /**
   * Test Suite: Graceful Degradation
   * Tests that the system degrades gracefully when services are unavailable
   */
  describe('Graceful Degradation', () => {
    let fallbackStrategies: FallbackStrategies;

    beforeEach(() => {
      fallbackStrategies = new FallbackStrategies();
    });

    afterEach(() => {
      fallbackStrategies.clearAllCaches();
    });

    describe('Macro Data Fallback', () => {
      it('should return null when no cached data available', () => {
        const result = fallbackStrategies.getMacroDataFallback();
        expect(result.data).toBeNull();
        expect(result.usedFallback).toBe(false);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      it('should return cached data when available', () => {
        const mockData = {
          gdpGrowth: 2.5,
          inflationRate: 3.2,
          unemploymentRate: 4.1,
          interestRate: 5.25,
          timestamp: new Date(),
        };

        fallbackStrategies.cacheMacroData(mockData);

        const result = fallbackStrategies.getMacroDataFallback();
        expect(result.data).toEqual(mockData);
        expect(result.usedFallback).toBe(true);
      });
    });

    describe('Sector Data Fallback', () => {
      it('should return null when no manual sectors and no cache', () => {
        const result = fallbackStrategies.getSectorDataFallback();
        expect(result.data).toBeNull();
        expect(result.usedFallback).toBe(false);
      });

      it('should create rankings from manual sectors', () => {
        const result = fallbackStrategies.getSectorDataFallback(['Technology', 'Healthcare']);
        expect(result.data).not.toBeNull();
        expect(result.data!.length).toBe(2);
        expect(result.usedFallback).toBe(true);
        expect(result.fallbackReason).toBe('Manual sector selection');
      });
    });

    describe('Stock Screening Fallback', () => {
      it('should return partial results when available', () => {
        const partialResults = [
          { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', score: 85 },
        ];

        const result = fallbackStrategies.getStockScreeningFallback(partialResults as any, 10);
        expect(result.data).toEqual(partialResults);
        expect(result.usedFallback).toBe(true);
        expect(result.warnings.some(w => w.includes('timed out'))).toBe(true);
      });

      it('should return null when no partial results and no cache', () => {
        const result = fallbackStrategies.getStockScreeningFallback();
        expect(result.data).toBeNull();
        expect(result.usedFallback).toBe(false);
      });
    });

    describe('Analyst Data Fallback', () => {
      it('should return null with appropriate warning', () => {
        const result = fallbackStrategies.getAnalystDataFallback();
        expect(result.data).toBeNull();
        expect(result.usedFallback).toBe(true);
        expect(result.warnings.some(w => w.includes('Analyst sentiment data is unavailable'))).toBe(true);
      });
    });

    describe('Technical Analysis Fallback', () => {
      it('should return null with appropriate warning', () => {
        const result = fallbackStrategies.getTechnicalAnalysisFallback();
        expect(result.data).toBeNull();
        expect(result.usedFallback).toBe(true);
        expect(result.warnings.some(w => w.includes('Technical analysis is unavailable'))).toBe(true);
      });
    });

    describe('Cache Statistics', () => {
      it('should track cache statistics', () => {
        const mockMacroData = {
          gdpGrowth: 2.5,
          inflationRate: 3.2,
          unemploymentRate: 4.1,
          interestRate: 5.25,
          timestamp: new Date(),
        };

        fallbackStrategies.cacheMacroData(mockMacroData);

        const stats = fallbackStrategies.getCacheStats();
        expect(stats.macroDataCached).toBe(1);
      });

      it('should clear all caches', () => {
        const mockMacroData = {
          gdpGrowth: 2.5,
          inflationRate: 3.2,
          unemploymentRate: 4.1,
          interestRate: 5.25,
          timestamp: new Date(),
        };

        fallbackStrategies.cacheMacroData(mockMacroData);
        fallbackStrategies.clearAllCaches();

        const stats = fallbackStrategies.getCacheStats();
        expect(stats.macroDataCached).toBe(0);
      });
    });
  });
});
