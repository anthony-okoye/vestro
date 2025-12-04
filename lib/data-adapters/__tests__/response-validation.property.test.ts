import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

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
    VALUATION_DATA: { revalidate: 86400, tags: ['valuation-data'] },
    HISTORICAL_DATA: { revalidate: 86400, tags: ['historical-data'] },
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
    companyProfile: (ticker: string) => `company-profile-${ticker}`,
  },
}));

// Import after mocking
import { AlphaVantageAdapter } from '../alpha-vantage-adapter';
import { FinancialModelingPrepAdapter } from '../fmp-adapter';
import { PolygonAdapter } from '../polygon-adapter';

/**
 * **Feature: api-integration, Property 5: Response Validation**
 * **Validates: Requirements 5.4**
 * 
 * For any successful API response, the adapter should validate that required
 * fields are present and of the correct type before returning data.
 */
describe('Property 5: Response Validation', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Alpha Vantage Response Validation', () => {
    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any valid stock quote response, the adapter should return data with
     * all required fields present and of correct types.
     */
    it('should validate and return correct types for any valid quote response', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid quote data - use Math.fround for 32-bit float compatibility
          fc.record({
            symbol: fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
            price: fc.integer({ min: 1, max: 100000 }).map(n => n / 100),
            change: fc.integer({ min: -10000, max: 10000 }).map(n => n / 100),
            changePercent: fc.integer({ min: -10000, max: 10000 }).map(n => n / 100),
            volume: fc.integer({ min: 0, max: 1000000000 }),
          }),
          async (quoteData) => {
            const adapter = new AlphaVantageAdapter('test-api-key');

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                'Global Quote': {
                  '01. symbol': quoteData.symbol,
                  '05. price': quoteData.price.toString(),
                  '09. change': quoteData.change.toString(),
                  '10. change percent': `${quoteData.changePercent}%`,
                  '06. volume': quoteData.volume.toString(),
                },
              }),
            } as Response);

            const result = await adapter.getQuote(quoteData.symbol);

            // Validate required fields are present
            expect(result).toHaveProperty('symbol');
            expect(result).toHaveProperty('price');
            expect(result).toHaveProperty('change');
            expect(result).toHaveProperty('changePercent');
            expect(result).toHaveProperty('volume');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('source');

            // Validate types
            expect(typeof result.symbol).toBe('string');
            expect(typeof result.price).toBe('number');
            expect(typeof result.change).toBe('number');
            expect(typeof result.changePercent).toBe('number');
            expect(typeof result.volume).toBe('number');
            expect(result.timestamp).toBeInstanceOf(Date);
            expect(typeof result.source).toBe('string');

            // Validate values are not NaN
            expect(Number.isNaN(result.price)).toBe(false);
            expect(Number.isNaN(result.change)).toBe(false);
            expect(Number.isNaN(result.changePercent)).toBe(false);
            expect(Number.isNaN(result.volume)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any invalid/empty quote response, the adapter should throw an error.
     */
    it('should throw error for any invalid quote response', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid responses
          fc.oneof(
            fc.constant({}),
            fc.constant({ 'Global Quote': {} }),
            fc.constant({ someOtherField: 'value' }),
          ),
          async (invalidResponse) => {
            const adapter = new AlphaVantageAdapter('test-api-key');
            // Mock sleep to avoid timeout
            vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(invalidResponse),
            } as Response);

            await expect(adapter.getQuote('TEST')).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any valid company profile response, the adapter should return data
     * with all required fields present and of correct types.
     */
    it('should validate and return correct types for any valid company profile response', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid company profile data
          fc.record({
            symbol: fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
            name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s || 'Test Company'),
            description: fc.string({ maxLength: 500 }),
            sector: fc.string({ minLength: 1, maxLength: 50 }).map(s => s || 'Technology'),
            industry: fc.string({ minLength: 1, maxLength: 50 }).map(s => s || 'Software'),
            marketCap: fc.integer({ min: 0, max: 10000000000000 }),
            peRatio: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
            dividendYield: fc.option(fc.integer({ min: 0, max: 100 }).map(n => n / 10000), { nil: undefined }),
            beta: fc.option(fc.integer({ min: -500, max: 500 }).map(n => n / 100), { nil: undefined }),
          }),
          async (profileData) => {
            const adapter = new AlphaVantageAdapter('test-api-key');

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                Symbol: profileData.symbol,
                Name: profileData.name,
                Description: profileData.description,
                Sector: profileData.sector,
                Industry: profileData.industry,
                MarketCapitalization: profileData.marketCap.toString(),
                PERatio: profileData.peRatio?.toString() ?? '-',
                DividendYield: profileData.dividendYield?.toString() ?? '-',
                Beta: profileData.beta?.toString() ?? '-',
              }),
            } as Response);

            const result = await adapter.getCompanyOverview(profileData.symbol);

            // Validate required fields are present
            expect(result).toHaveProperty('symbol');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('sector');
            expect(result).toHaveProperty('industry');
            expect(result).toHaveProperty('marketCap');
            expect(result).toHaveProperty('peRatio');
            expect(result).toHaveProperty('dividendYield');
            expect(result).toHaveProperty('beta');
            expect(result).toHaveProperty('source');

            // Validate types
            expect(typeof result.symbol).toBe('string');
            expect(typeof result.name).toBe('string');
            expect(typeof result.description).toBe('string');
            expect(typeof result.sector).toBe('string');
            expect(typeof result.industry).toBe('string');
            expect(typeof result.marketCap).toBe('number');
            expect(result.peRatio === null || typeof result.peRatio === 'number').toBe(true);
            expect(result.dividendYield === null || typeof result.dividendYield === 'number').toBe(true);
            expect(result.beta === null || typeof result.beta === 'number').toBe(true);
            expect(typeof result.source).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('FMP Response Validation', () => {
    // Helper to generate valid date strings in YYYY-MM-DD format
    const dateStringArb = fc.tuple(
      fc.integer({ min: 2000, max: 2024 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    ).map(([year, month, day]) => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    );

    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any valid income statement response, the adapter should return data
     * with all required fields present and of correct types.
     */
    it('should validate and return correct types for any valid income statement response', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid income statement data
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
              date: dateStringArb,
              revenue: fc.integer({ min: 0, max: 1000000000000 }),
              netIncome: fc.integer({ min: -100000000000, max: 100000000000 }),
              eps: fc.integer({ min: -10000, max: 10000 }).map(n => n / 100),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (statementData) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(
                statementData.map(s => ({
                  symbol: s.symbol,
                  date: s.date,
                  revenue: s.revenue,
                  netIncome: s.netIncome,
                  eps: s.eps,
                  epsdiluted: s.eps,
                }))
              ),
            } as Response);

            const result = await adapter.getIncomeStatement(statementData[0].symbol, 'annual', 5);

            // Validate array returned
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);

            // Validate each statement has required fields
            result.forEach((statement) => {
              expect(statement).toHaveProperty('symbol');
              expect(statement).toHaveProperty('date');
              expect(statement).toHaveProperty('period');
              expect(statement).toHaveProperty('revenue');
              expect(statement).toHaveProperty('netIncome');
              expect(statement).toHaveProperty('eps');
              expect(statement).toHaveProperty('source');

              // Validate types
              expect(typeof statement.symbol).toBe('string');
              expect(statement.date).toBeInstanceOf(Date);
              expect(typeof statement.period).toBe('string');
              expect(typeof statement.revenue).toBe('number');
              expect(typeof statement.netIncome).toBe('number');
              expect(typeof statement.eps).toBe('number');
              expect(typeof statement.source).toBe('string');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any empty/invalid financial statement response, the adapter should throw.
     */
    it('should throw error for any invalid financial statement response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant([]),
            fc.constant({}),
          ),
          async (invalidResponse) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');
            // Mock sleep to avoid timeout
            vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(invalidResponse),
            } as Response);

            await expect(adapter.getIncomeStatement('TEST', 'annual', 5)).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any valid key metrics response, the adapter should return data
     * with all required fields present and of correct types.
     */
    it('should validate and return correct types for any valid key metrics response', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid key metrics data - use integers mapped to floats
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
              date: dateStringArb,
              peRatio: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
              pbRatio: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
              debtToEquity: fc.option(fc.integer({ min: 0, max: 1000 }).map(n => n / 100), { nil: undefined }),
              roe: fc.option(fc.integer({ min: -100, max: 100 }).map(n => n / 100), { nil: undefined }),
              dividendYield: fc.option(fc.integer({ min: 0, max: 20 }).map(n => n / 100), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (metricsData) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(
                metricsData.map(m => ({
                  symbol: m.symbol,
                  date: m.date,
                  peRatio: m.peRatio,
                  pbRatio: m.pbRatio,
                  debtToEquity: m.debtToEquity,
                  roe: m.roe,
                  dividendYield: m.dividendYield,
                }))
              ),
            } as Response);

            const result = await adapter.getKeyMetrics(metricsData[0].symbol, 'annual', 5);

            // Validate array returned
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);

            // Validate each metrics entry has required fields
            result.forEach((metrics) => {
              expect(metrics).toHaveProperty('symbol');
              expect(metrics).toHaveProperty('date');
              expect(metrics).toHaveProperty('peRatio');
              expect(metrics).toHaveProperty('pbRatio');
              expect(metrics).toHaveProperty('debtToEquity');
              expect(metrics).toHaveProperty('returnOnEquity');
              expect(metrics).toHaveProperty('dividendYield');
              expect(metrics).toHaveProperty('source');

              // Validate types
              expect(typeof metrics.symbol).toBe('string');
              expect(metrics.date).toBeInstanceOf(Date);
              expect(metrics.peRatio === null || typeof metrics.peRatio === 'number').toBe(true);
              expect(metrics.pbRatio === null || typeof metrics.pbRatio === 'number').toBe(true);
              expect(metrics.debtToEquity === null || typeof metrics.debtToEquity === 'number').toBe(true);
              expect(metrics.returnOnEquity === null || typeof metrics.returnOnEquity === 'number').toBe(true);
              expect(metrics.dividendYield === null || typeof metrics.dividendYield === 'number').toBe(true);
              expect(typeof metrics.source).toBe('string');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Polygon Response Validation', () => {
    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any valid aggregates response, the adapter should return data
     * with all required fields present and of correct types.
     */
    it('should validate and return correct types for any valid aggregates response', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid OHLCV bar data - use integers mapped to floats
          fc.record({
            symbol: fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
            bars: fc.array(
              fc.record({
                t: fc.integer({ min: 1577836800000, max: 1733356800000 }), // timestamp in ms
                o: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
                h: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
                l: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
                c: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
                v: fc.integer({ min: 0, max: 1000000000 }),
              }),
              { minLength: 1, maxLength: 30 }
            ),
          }),
          async (aggregateData) => {
            const adapter = new PolygonAdapter('test-api-key');

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                ticker: aggregateData.symbol,
                status: 'OK',
                results: aggregateData.bars,
              }),
            } as Response);

            const from = new Date('2023-01-01');
            const to = new Date('2023-12-31');
            const result = await adapter.getAggregates(aggregateData.symbol, 'day', from, to);

            // Validate required fields are present
            expect(result).toHaveProperty('symbol');
            expect(result).toHaveProperty('bars');
            expect(result).toHaveProperty('source');

            // Validate types
            expect(typeof result.symbol).toBe('string');
            expect(Array.isArray(result.bars)).toBe(true);
            expect(typeof result.source).toBe('string');

            // Validate each bar has required fields
            result.bars.forEach((bar) => {
              expect(bar).toHaveProperty('timestamp');
              expect(bar).toHaveProperty('open');
              expect(bar).toHaveProperty('high');
              expect(bar).toHaveProperty('low');
              expect(bar).toHaveProperty('close');
              expect(bar).toHaveProperty('volume');

              // Validate types
              expect(bar.timestamp).toBeInstanceOf(Date);
              expect(typeof bar.open).toBe('number');
              expect(typeof bar.high).toBe('number');
              expect(typeof bar.low).toBe('number');
              expect(typeof bar.close).toBe('number');
              expect(typeof bar.volume).toBe('number');

              // Validate values are not NaN
              expect(Number.isNaN(bar.open)).toBe(false);
              expect(Number.isNaN(bar.high)).toBe(false);
              expect(Number.isNaN(bar.low)).toBe(false);
              expect(Number.isNaN(bar.close)).toBe(false);
              expect(Number.isNaN(bar.volume)).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any empty/invalid aggregates response, the adapter should throw.
     */
    it('should throw error for any invalid aggregates response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant({ results: [] }),
            fc.constant({ results: null }),
            fc.constant({}),
            fc.constant({ status: 'NOT_FOUND' }),
            fc.constant({ status: 'ERROR', error: 'Invalid symbol' }),
          ),
          async (invalidResponse) => {
            const adapter = new PolygonAdapter('test-api-key');

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve(invalidResponse),
            } as Response);

            const from = new Date('2023-01-01');
            const to = new Date('2023-12-31');
            await expect(adapter.getAggregates('TEST', 'day', from, to)).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any valid previous close response, the adapter should return data
     * with all required fields present and of correct types.
     */
    it('should validate and return correct types for any valid previous close response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            symbol: fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'TEST'),
            open: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
            close: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
            volume: fc.integer({ min: 0, max: 1000000000 }),
            timestamp: fc.integer({ min: 1577836800000, max: 1733356800000 }),
          }),
          async (quoteData) => {
            const adapter = new PolygonAdapter('test-api-key');

            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                ticker: quoteData.symbol,
                status: 'OK',
                results: [{
                  o: quoteData.open,
                  c: quoteData.close,
                  v: quoteData.volume,
                  t: quoteData.timestamp,
                }],
              }),
            } as Response);

            const result = await adapter.getPreviousClose(quoteData.symbol);

            // Validate required fields are present
            expect(result).toHaveProperty('symbol');
            expect(result).toHaveProperty('price');
            expect(result).toHaveProperty('change');
            expect(result).toHaveProperty('changePercent');
            expect(result).toHaveProperty('volume');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('source');

            // Validate types
            expect(typeof result.symbol).toBe('string');
            expect(typeof result.price).toBe('number');
            expect(typeof result.change).toBe('number');
            expect(typeof result.changePercent).toBe('number');
            expect(typeof result.volume).toBe('number');
            expect(result.timestamp).toBeInstanceOf(Date);
            expect(typeof result.source).toBe('string');

            // Validate values are not NaN
            expect(Number.isNaN(result.price)).toBe(false);
            expect(Number.isNaN(result.change)).toBe(false);
            expect(Number.isNaN(result.changePercent)).toBe(false);
            expect(Number.isNaN(result.volume)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('JSON Parse Error Validation', () => {
    /**
     * **Feature: api-integration, Property 5: Response Validation**
     * **Validates: Requirements 5.4**
     * 
     * For any malformed JSON response, the adapter should throw an error.
     */
    it('should throw error for any malformed JSON response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Alpha Vantage', 'FMP', 'Polygon'),
          async (adapterType) => {
            fetchSpy.mockResolvedValue({
              ok: true,
              status: 200,
              json: () => Promise.reject(new Error('Unexpected token')),
            } as Response);

            if (adapterType === 'Alpha Vantage') {
              const adapter = new AlphaVantageAdapter('test-api-key');
              vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
              await expect(adapter.getQuote('TEST')).rejects.toThrow();
            } else if (adapterType === 'FMP') {
              const adapter = new FinancialModelingPrepAdapter('test-api-key');
              vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
              await expect(adapter.getIncomeStatement('TEST', 'annual', 5)).rejects.toThrow();
            } else {
              const adapter = new PolygonAdapter('test-api-key');
              await expect(adapter.getPreviousClose('TEST')).rejects.toThrow();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
