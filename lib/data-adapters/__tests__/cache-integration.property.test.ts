import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: api-integration, Property 7: Cache Integration**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 * 
 * For any data fetch request, if valid cached data exists and is not expired,
 * the adapter should return cached data without making an API call.
 */

// In-memory cache for testing
const testCache = new Map<string, { data: any; timestamp: number; revalidate: number }>();

// Track fetch calls to verify caching behavior
let fetchCallCount = 0;
let lastFetchedSymbol: string | null = null;

// Mock the cache-config module to use our test cache
vi.mock('../../cache-config', () => ({
  createCachedFetcher: <T extends (...args: any[]) => Promise<any>>(
    fetcher: T,
    cacheKey: string,
    config: { revalidate: number; tags: string[] }
  ): T => {
    // Return a function that implements caching behavior
    return (async (...args: any[]) => {
      const key = `${cacheKey}-${JSON.stringify(args)}`;
      const now = Date.now();
      const cached = testCache.get(key);
      
      // Check if we have valid cached data
      if (cached && (now - cached.timestamp) < cached.revalidate * 1000) {
        // Return cached data without calling the fetcher
        return cached.data;
      }
      
      // No valid cache, call the fetcher
      fetchCallCount++;
      lastFetchedSymbol = args[0] as string;
      const result = await fetcher(...args);
      
      // Store in cache
      testCache.set(key, {
        data: result,
        timestamp: now,
        revalidate: config.revalidate,
      });
      
      return result;
    }) as T;
  },
  CACHE_CONFIG: {
    QUOTES: { revalidate: 900, tags: ['quotes'] },
    COMPANY_PROFILES: { revalidate: 604800, tags: ['company-profiles'] },
    FINANCIAL_STATEMENTS: { revalidate: 86400, tags: ['financial-statements'] },
    VALUATION_DATA: { revalidate: 86400, tags: ['valuation-data'] },
    HISTORICAL_DATA: { revalidate: 86400, tags: ['historical-data'] },
    MACRO_DATA: { revalidate: 3600, tags: ['macro-data'] },
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
    companyProfile: (ticker: string) => `company-profile-${ticker}`,
    interestRate: () => 'interest-rate',
    inflationRate: () => 'inflation-rate',
    unemploymentRate: () => 'unemployment-rate',
  },
}));

// Import adapters after mocking
import { AlphaVantageAdapter } from '../alpha-vantage-adapter';
import { FinancialModelingPrepAdapter } from '../fmp-adapter';
import { PolygonAdapter } from '../polygon-adapter';

describe('Property 7: Cache Integration', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear the test cache before each test
    testCache.clear();
    fetchCallCount = 0;
    lastFetchedSymbol = null;
    
    // Mock global fetch
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to create a valid Alpha Vantage quote response
   */
  function createAlphaVantageQuoteResponse(symbol: string, price: number) {
    return {
      'Global Quote': {
        '01. symbol': symbol,
        '05. price': price.toString(),
        '09. change': '1.50',
        '10. change percent': '1.5%',
        '06. volume': '1000000',
      },
    };
  }

  /**
   * Helper to create a valid Alpha Vantage company overview response
   */
  function createAlphaVantageOverviewResponse(symbol: string) {
    return {
      Symbol: symbol,
      Name: `${symbol} Inc.`,
      Description: 'A test company',
      Sector: 'Technology',
      Industry: 'Software',
      MarketCapitalization: '1000000000',
      PERatio: '25.5',
      DividendYield: '0.015',
      Beta: '1.2',
    };
  }

  /**
   * Helper to create a valid FMP income statement response
   */
  function createFMPIncomeStatementResponse(symbol: string) {
    return [{
      symbol,
      date: '2023-12-31',
      revenue: 100000000,
      netIncome: 10000000,
      eps: 2.5,
      epsdiluted: 2.4,
    }];
  }

  /**
   * Helper to create a valid Polygon aggregates response
   */
  function createPolygonAggregatesResponse(symbol: string) {
    return {
      ticker: symbol,
      status: 'OK',
      results: [
        { t: Date.now() - 86400000, o: 100, h: 105, l: 99, c: 103, v: 1000000 },
        { t: Date.now(), o: 103, h: 108, l: 102, c: 106, v: 1200000 },
      ],
    };
  }

  describe('Alpha Vantage Cache Integration', () => {
    /**
     * **Feature: api-integration, Property 7: Cache Integration**
     * **Validates: Requirements 6.4**
     * 
     * For any stock quote request, if valid cached data exists,
     * the adapter should return cached data without making an API call.
     */
    it('should return cached quote data without making API call on subsequent requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid stock symbols
          fc.string({ minLength: 1, maxLength: 5 })
            .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
          // Generate price values
          fc.integer({ min: 1, max: 100000 }).map(n => n / 100),
          async (symbol, price) => {
            // Reset state for this test iteration
            testCache.clear();
            fetchCallCount = 0;
            
            const adapter = new AlphaVantageAdapter('test-api-key');

            // Mock fetch to return valid response
            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(createAlphaVantageQuoteResponse(symbol, price)),
            } as Response);

            // First call - should make API request
            const result1 = await adapter.getQuote(symbol);
            const firstCallCount = fetchCallCount;

            // Second call - should use cache
            const result2 = await adapter.getQuote(symbol);
            const secondCallCount = fetchCallCount;

            // Verify first call made an API request
            expect(firstCallCount).toBe(1);
            
            // Verify second call did NOT make an API request (used cache)
            expect(secondCallCount).toBe(1);
            
            // Verify both results are identical
            expect(result1.symbol).toBe(result2.symbol);
            expect(result1.price).toBe(result2.price);
            expect(result1.source).toBe(result2.source);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 7: Cache Integration**
     * **Validates: Requirements 6.4**
     * 
     * For any company profile request, if valid cached data exists,
     * the adapter should return cached data without making an API call.
     */
    it('should return cached company profile without making API call on subsequent requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid stock symbols
          fc.string({ minLength: 1, maxLength: 5 })
            .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
          async (symbol) => {
            // Reset state for this test iteration
            testCache.clear();
            fetchCallCount = 0;
            
            const adapter = new AlphaVantageAdapter('test-api-key');

            // Mock fetch to return valid response
            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(createAlphaVantageOverviewResponse(symbol)),
            } as Response);

            // First call - should make API request
            const result1 = await adapter.getCompanyOverview(symbol);
            const firstCallCount = fetchCallCount;

            // Second call - should use cache
            const result2 = await adapter.getCompanyOverview(symbol);
            const secondCallCount = fetchCallCount;

            // Verify first call made an API request
            expect(firstCallCount).toBe(1);
            
            // Verify second call did NOT make an API request (used cache)
            expect(secondCallCount).toBe(1);
            
            // Verify both results are identical
            expect(result1.symbol).toBe(result2.symbol);
            expect(result1.name).toBe(result2.name);
            expect(result1.sector).toBe(result2.sector);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('FMP Cache Integration', () => {
    /**
     * **Feature: api-integration, Property 7: Cache Integration**
     * **Validates: Requirements 6.2**
     * 
     * For any financial statement request, if valid cached data exists,
     * the adapter should return cached data without making an API call.
     */
    it('should return cached financial statements without making API call on subsequent requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid stock symbols
          fc.string({ minLength: 1, maxLength: 5 })
            .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
          async (symbol) => {
            // Reset state for this test iteration
            testCache.clear();
            fetchCallCount = 0;
            
            const adapter = new FinancialModelingPrepAdapter('test-api-key');

            // Mock fetch to return valid response
            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(createFMPIncomeStatementResponse(symbol)),
            } as Response);

            // First call - should make API request
            const result1 = await adapter.getIncomeStatement(symbol, 'annual', 5);
            const firstCallCount = fetchCallCount;

            // Second call - should use cache
            const result2 = await adapter.getIncomeStatement(symbol, 'annual', 5);
            const secondCallCount = fetchCallCount;

            // Verify first call made an API request
            expect(firstCallCount).toBe(1);
            
            // Verify second call did NOT make an API request (used cache)
            expect(secondCallCount).toBe(1);
            
            // Verify both results are identical
            expect(result1.length).toBe(result2.length);
            expect(result1[0].symbol).toBe(result2[0].symbol);
            expect(result1[0].revenue).toBe(result2[0].revenue);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Polygon Cache Integration', () => {
    /**
     * **Feature: api-integration, Property 7: Cache Integration**
     * **Validates: Requirements 6.3**
     * 
     * For any historical data request, if valid cached data exists,
     * the adapter should return cached data without making an API call.
     */
    it('should return cached historical data without making API call on subsequent requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid stock symbols
          fc.string({ minLength: 1, maxLength: 5 })
            .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
          async (symbol) => {
            // Reset state for this test iteration
            testCache.clear();
            fetchCallCount = 0;
            
            const adapter = new PolygonAdapter('test-api-key');

            // Mock fetch to return valid response
            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(createPolygonAggregatesResponse(symbol)),
            } as Response);

            const from = new Date('2023-01-01');
            const to = new Date('2023-12-31');

            // First call - should make API request
            const result1 = await adapter.getAggregates(symbol, 'day', from, to);
            const firstCallCount = fetchCallCount;

            // Second call - should use cache
            const result2 = await adapter.getAggregates(symbol, 'day', from, to);
            const secondCallCount = fetchCallCount;

            // Verify first call made an API request
            expect(firstCallCount).toBe(1);
            
            // Verify second call did NOT make an API request (used cache)
            expect(secondCallCount).toBe(1);
            
            // Verify both results are identical
            expect(result1.symbol).toBe(result2.symbol);
            expect(result1.bars.length).toBe(result2.bars.length);
            expect(result1.source).toBe(result2.source);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 7: Cache Integration**
     * **Validates: Requirements 6.3**
     * 
     * For any previous close request, if valid cached data exists,
     * the adapter should return cached data without making an API call.
     */
    it('should return cached previous close without making API call on subsequent requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid stock symbols
          fc.string({ minLength: 1, maxLength: 5 })
            .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
          async (symbol) => {
            // Reset state for this test iteration
            testCache.clear();
            fetchCallCount = 0;
            
            const adapter = new PolygonAdapter('test-api-key');

            // Mock fetch to return valid response
            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                ticker: symbol,
                status: 'OK',
                results: [{
                  o: 100,
                  c: 105,
                  v: 1000000,
                  t: Date.now(),
                }],
              }),
            } as Response);

            // First call - should make API request
            const result1 = await adapter.getPreviousClose(symbol);
            const firstCallCount = fetchCallCount;

            // Second call - should use cache
            const result2 = await adapter.getPreviousClose(symbol);
            const secondCallCount = fetchCallCount;

            // Verify first call made an API request
            expect(firstCallCount).toBe(1);
            
            // Verify second call did NOT make an API request (used cache)
            expect(secondCallCount).toBe(1);
            
            // Verify both results are identical
            expect(result1.symbol).toBe(result2.symbol);
            expect(result1.price).toBe(result2.price);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cache Key Isolation', () => {
    /**
     * **Feature: api-integration, Property 7: Cache Integration**
     * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
     * 
     * For any two different symbols, cache entries should be isolated
     * and not interfere with each other.
     */
    it('should maintain separate cache entries for different symbols', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different valid stock symbols with minimum 3 chars to avoid URL matching issues
          fc.tuple(
            fc.string({ minLength: 3, maxLength: 5 })
              .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'X') || 'AAPL'),
            fc.string({ minLength: 3, maxLength: 5 })
              .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'Y') || 'MSFT')
          ).filter(([a, b]) => a !== b),
          // Generate two different prices
          fc.tuple(
            fc.integer({ min: 100, max: 500 }).map(n => n / 100),
            fc.integer({ min: 501, max: 1000 }).map(n => n / 100)
          ),
          async ([symbol1, symbol2], [price1, price2]) => {
            // Reset state for this test iteration
            testCache.clear();
            fetchCallCount = 0;
            
            const adapter = new AlphaVantageAdapter('test-api-key');

            // Track which symbol was requested in each fetch call
            let fetchCallIndex = 0;
            const expectedSymbols = [symbol1, symbol2];
            const expectedPrices = [price1, price2];

            // Mock fetch to return different responses based on call order
            fetchSpy.mockImplementation(async () => {
              const currentIndex = fetchCallIndex;
              fetchCallIndex++;
              const symbol = expectedSymbols[currentIndex] || symbol2;
              const price = expectedPrices[currentIndex] || price2;
              
              return {
                ok: true,
                status: 200,
                json: () => Promise.resolve(createAlphaVantageQuoteResponse(symbol, price)),
              } as Response;
            });

            // Fetch first symbol
            const result1 = await adapter.getQuote(symbol1);
            
            // Fetch second symbol
            const result2 = await adapter.getQuote(symbol2);
            
            // Fetch first symbol again (should use cache)
            const result1Cached = await adapter.getQuote(symbol1);
            
            // Fetch second symbol again (should use cache)
            const result2Cached = await adapter.getQuote(symbol2);

            // Verify we made exactly 2 API calls (one for each symbol)
            expect(fetchCallCount).toBe(2);
            
            // Verify cached results match original results
            expect(result1.symbol).toBe(result1Cached.symbol);
            expect(result1.price).toBe(result1Cached.price);
            expect(result2.symbol).toBe(result2Cached.symbol);
            expect(result2.price).toBe(result2Cached.price);
            
            // Verify the cache correctly isolated the two symbols
            // (each symbol's cached data should match its original fetch)
            expect(result1Cached.symbol).toBe(symbol1);
            expect(result2Cached.symbol).toBe(symbol2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cache Data Integrity', () => {
    /**
     * **Feature: api-integration, Property 7: Cache Integration**
     * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
     * 
     * For any cached data, the returned data should be identical
     * to the originally fetched data.
     */
    it('should preserve data integrity when returning cached data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid stock symbol
          fc.string({ minLength: 1, maxLength: 5 })
            .map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
          // Generate price and volume
          fc.record({
            price: fc.integer({ min: 1, max: 100000 }).map(n => n / 100),
            change: fc.integer({ min: -1000, max: 1000 }).map(n => n / 100),
            changePercent: fc.integer({ min: -100, max: 100 }).map(n => n / 10),
            volume: fc.integer({ min: 0, max: 1000000000 }),
          }),
          async (symbol, quoteData) => {
            // Reset state for this test iteration
            testCache.clear();
            fetchCallCount = 0;
            
            const adapter = new AlphaVantageAdapter('test-api-key');

            // Mock fetch to return specific data
            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                'Global Quote': {
                  '01. symbol': symbol,
                  '05. price': quoteData.price.toString(),
                  '09. change': quoteData.change.toString(),
                  '10. change percent': `${quoteData.changePercent}%`,
                  '06. volume': quoteData.volume.toString(),
                },
              }),
            } as Response);

            // First call - fetch from API
            const original = await adapter.getQuote(symbol);
            
            // Multiple subsequent calls - should all return identical cached data
            const cached1 = await adapter.getQuote(symbol);
            const cached2 = await adapter.getQuote(symbol);
            const cached3 = await adapter.getQuote(symbol);

            // Verify only one API call was made
            expect(fetchCallCount).toBe(1);
            
            // Verify all cached results are identical to original
            [cached1, cached2, cached3].forEach(cached => {
              expect(cached.symbol).toBe(original.symbol);
              expect(cached.price).toBe(original.price);
              expect(cached.change).toBe(original.change);
              expect(cached.changePercent).toBe(original.changePercent);
              expect(cached.volume).toBe(original.volume);
              expect(cached.source).toBe(original.source);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
