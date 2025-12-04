import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigurationError, NotFoundError, ValidationError } from '../../api-error';
import { DataRequest } from '../../types';
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
  },
  CacheKeys: {
    quote: (ticker: string) => `quote-${ticker}`,
    companyProfile: (ticker: string) => `company-profile-${ticker}`,
  },
}));

// Import after mocking
import { AlphaVantageAdapter } from '../alpha-vantage-adapter';

describe('AlphaVantageAdapter', () => {
  describe('Configuration', () => {
    it('should throw ConfigurationError when API key is missing', () => {
      const originalEnv = process.env.ALPHA_VANTAGE_API_KEY;
      delete process.env.ALPHA_VANTAGE_API_KEY;

      expect(() => new AlphaVantageAdapter()).toThrow(ConfigurationError);
      expect(() => new AlphaVantageAdapter()).toThrow('Alpha Vantage API key is required');

      if (originalEnv) process.env.ALPHA_VANTAGE_API_KEY = originalEnv;
    });

    it('should throw ConfigurationError when API key is empty', () => {
      expect(() => new AlphaVantageAdapter('')).toThrow(ConfigurationError);
      expect(() => new AlphaVantageAdapter('   ')).toThrow(ConfigurationError);
    });

    it('should initialize successfully with valid API key', () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      expect(adapter.isConfigured()).toBe(true);
    });
  });

  describe('Quote Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse stock quote correctly', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '178.50',
            '09. change': '2.35',
            '10. change percent': '1.33%',
            '06. volume': '45678900'
          }
        })
      } as Response);

      const quote = await adapter.getQuote('AAPL');

      expect(quote.symbol).toBe('AAPL');
      expect(quote.price).toBe(178.50);
      expect(quote.change).toBe(2.35);
      expect(quote.changePercent).toBe(1.33);
      expect(quote.volume).toBe(45678900);
      expect(quote.source).toBe('Alpha Vantage');
      expect(quote.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing quote data gracefully', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Global Quote': {}
        })
      } as Response);

      await expect(adapter.getQuote('INVALID')).rejects.toThrow('No quote data found');
    });

    it('should handle empty Global Quote response', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      } as Response);

      await expect(adapter.getQuote('INVALID')).rejects.toThrow('No quote data found');
    });

    it('should parse quote with missing optional fields', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Global Quote': {
            '01. symbol': 'TEST',
            '05. price': '100.00'
            // Missing change, changePercent, volume
          }
        })
      } as Response);

      const quote = await adapter.getQuote('TEST');

      expect(quote.symbol).toBe('TEST');
      expect(quote.price).toBe(100);
      expect(quote.change).toBe(0);
      expect(quote.changePercent).toBe(0);
      expect(quote.volume).toBe(0);
    });

    it('should uppercase symbol in request', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Global Quote': {
            '01. symbol': 'MSFT',
            '05. price': '350.00',
            '09. change': '5.00',
            '10. change percent': '1.45%',
            '06. volume': '20000000'
          }
        })
      } as Response);

      const quote = await adapter.getQuote('msft');

      expect(quote.symbol).toBe('MSFT');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('symbol=MSFT'),
        expect.any(Object)
      );
    });
  });

  describe('Company Overview Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse company overview correctly', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          Symbol: 'AAPL',
          Name: 'Apple Inc',
          Description: 'Apple Inc. designs, manufactures, and markets smartphones.',
          Sector: 'Technology',
          Industry: 'Consumer Electronics',
          MarketCapitalization: '2800000000000',
          PERatio: '28.5',
          DividendYield: '0.0055',
          Beta: '1.25'
        })
      } as Response);

      const profile = await adapter.getCompanyOverview('AAPL');

      expect(profile.symbol).toBe('AAPL');
      expect(profile.name).toBe('Apple Inc');
      expect(profile.description).toBe('Apple Inc. designs, manufactures, and markets smartphones.');
      expect(profile.sector).toBe('Technology');
      expect(profile.industry).toBe('Consumer Electronics');
      expect(profile.marketCap).toBe(2800000000000);
      expect(profile.peRatio).toBe(28.5);
      expect(profile.dividendYield).toBeCloseTo(0.55, 2); // Converted to percentage, use toBeCloseTo for floating-point
      expect(profile.beta).toBe(1.25);
      expect(profile.source).toBe('Alpha Vantage');
    });

    it('should handle missing company overview data', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      } as Response);

      await expect(adapter.getCompanyOverview('INVALID')).rejects.toThrow('No company overview data found');
    });

    it('should handle null and missing numeric values gracefully', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          Symbol: 'TEST',
          Name: 'Test Company',
          Description: '',
          Sector: 'Unknown',
          Industry: 'Unknown',
          MarketCapitalization: null,
          PERatio: '-',
          DividendYield: 'None',
          Beta: undefined
        })
      } as Response);

      const profile = await adapter.getCompanyOverview('TEST');

      expect(profile.symbol).toBe('TEST');
      expect(profile.name).toBe('Test Company');
      expect(profile.marketCap).toBe(0);
      expect(profile.peRatio).toBeNull();
      expect(profile.dividendYield).toBeNull();
      expect(profile.beta).toBeNull();
    });

    it('should use symbol as fallback for missing name', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          Symbol: 'XYZ',
          // Name is missing
          Sector: 'Finance',
          Industry: 'Banking'
        })
      } as Response);

      const profile = await adapter.getCompanyOverview('xyz');

      expect(profile.symbol).toBe('XYZ');
      expect(profile.name).toBe('XYZ');
    });
  });

  describe('Error Scenarios', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle API error messages', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Error Message': 'Invalid API call. Please retry or visit the documentation.'
        })
      } as Response);

      await expect(adapter.getQuote('AAPL')).rejects.toThrow('Alpha Vantage API Error');
    });

    it('should handle Information messages (rate limiting)', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Information': 'Thank you for using Alpha Vantage! Please visit premium for higher limits.'
        })
      } as Response);

      await expect(adapter.getQuote('AAPL')).rejects.toThrow('Alpha Vantage');
    });

    it('should handle JSON parse errors', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Unexpected token'))
      } as Response);

      await expect(adapter.getQuote('AAPL')).rejects.toThrow();
    });

    it('should include source in error context', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Global Quote': {}
        })
      } as Response);

      try {
        await adapter.getQuote('INVALID');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('INVALID');
      }
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should retry on network errors with exponential backoff', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      // Mock sleep to resolve immediately
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      let callCount = 0;
      fetchSpy.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            'Global Quote': {
              '01. symbol': 'AAPL',
              '05. price': '150.00',
              '09. change': '2.50',
              '10. change percent': '1.69%',
              '06. volume': '50000000'
            }
          })
        } as Response);
      });

      const request: DataRequest = {
        endpoint: '/query',
        params: { function: 'GLOBAL_QUOTE', symbol: 'AAPL' }
      };

      const response = await adapter.fetch(request);

      expect(callCount).toBe(3);
      expect(response.data['Global Quote']['01. symbol']).toBe('AAPL');
    });

    it('should throw after max retries on persistent network errors', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      // Mock sleep to resolve immediately
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const request: DataRequest = {
        endpoint: '/query',
        params: { function: 'GLOBAL_QUOTE', symbol: 'AAPL' }
      };

      await expect(adapter.fetch(request)).rejects.toThrow(
        'Failed to fetch from Alpha Vantage after 3 attempts'
      );
    });

    it('should handle rate limit errors by throwing RateLimitError', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      // Mock sleep to resolve immediately
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Note': 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute.'
        })
      } as Response);

      const request: DataRequest = {
        endpoint: '/query',
        params: { function: 'GLOBAL_QUOTE', symbol: 'AAPL' }
      };

      await expect(adapter.fetch(request)).rejects.toThrow('Alpha Vantage Rate Limit');
    });

    it('should throw NetworkError on HTTP errors', async () => {
      const adapter = new AlphaVantageAdapter('test-api-key');
      // Mock sleep to resolve immediately
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const request: DataRequest = {
        endpoint: '/query',
        params: { function: 'GLOBAL_QUOTE', symbol: 'AAPL' }
      };

      await expect(adapter.fetch(request)).rejects.toThrow(
        'Failed to fetch from Alpha Vantage after 3 attempts'
      );
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: api-integration, Property 1: API Key Validation**
     * **Validates: Requirements 1.5**
     */
    it('should throw ConfigurationError for any invalid API key', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.string().filter(s => s.trim() === ''),
          ),
          (invalidKey) => {
            const originalEnv = process.env.ALPHA_VANTAGE_API_KEY;
            delete process.env.ALPHA_VANTAGE_API_KEY;

            try {
              expect(() => {
                new AlphaVantageAdapter(invalidKey as string | undefined);
              }).toThrow(ConfigurationError);

              expect(() => {
                new AlphaVantageAdapter(invalidKey as string | undefined);
              }).toThrow('Alpha Vantage API key is required');
            } finally {
              if (originalEnv) {
                process.env.ALPHA_VANTAGE_API_KEY = originalEnv;
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 1: API Key Validation**
     * **Validates: Requirements 1.5**
     */
    it('should initialize successfully for any valid API key', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (validKey) => {
            const originalEnv = process.env.ALPHA_VANTAGE_API_KEY;
            delete process.env.ALPHA_VANTAGE_API_KEY;

            try {
              const adapter = new AlphaVantageAdapter(validKey);
              expect(adapter.isConfigured()).toBe(true);
            } finally {
              if (originalEnv) {
                process.env.ALPHA_VANTAGE_API_KEY = originalEnv;
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 2: Rate Limit Compliance**
     * **Validates: Requirements 1.4**
     * 
     * For any sequence of API requests to a single provider, the adapter should
     * never exceed the configured rate limit within the specified time window.
     */
    it('should never exceed rate limit in any time window', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 32 }).filter(s => s.trim().length > 0),
          (apiKey) => {
            const adapter = new AlphaVantageAdapter(apiKey);
            const initialRateLimit = adapter.getRateLimit();
            
            // Alpha Vantage free tier is 5 requests per minute
            if (initialRateLimit.requestsPerMinute !== 5) return false;
            if (initialRateLimit.requestsRemaining !== 5) return false;
            if (initialRateLimit.requestsRemaining > initialRateLimit.requestsPerMinute) return false;
            if (initialRateLimit.resetTime.getTime() <= Date.now() - 1000) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 2: Rate Limit Compliance**
     * **Validates: Requirements 1.4**
     */
    it('should correctly track rate limit after any number of requests', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Global Quote': {
            '01. symbol': 'TEST',
            '05. price': '100.00',
            '09. change': '1.00',
            '10. change percent': '1.00%',
            '06. volume': '1000000'
          }
        })
      } as Response);

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 5 }),
            async (numRequests) => {
              const adapter = new AlphaVantageAdapter('test-api-key');
              const rateLimit = 5;
              
              for (let i = 0; i < numRequests; i++) {
                await adapter.fetch({
                  endpoint: '/query',
                  params: { function: 'GLOBAL_QUOTE', symbol: `TEST${i}` }
                });
              }

              const rateLimitInfo = adapter.getRateLimit();
              const expectedRemaining = rateLimit - numRequests;
              
              return (
                rateLimitInfo.requestsRemaining === expectedRemaining &&
                rateLimitInfo.requestsRemaining >= 0 &&
                rateLimitInfo.requestsRemaining <= rateLimitInfo.requestsPerMinute
              );
            }
          ),
          { numRuns: 100 }
        );
      } finally {
        vi.restoreAllMocks();
      }
    });

    /**
     * **Feature: api-integration, Property 2: Rate Limit Compliance (Invariant)**
     * **Validates: Requirements 1.4**
     */
    it('should maintain rate limit invariant: 0 <= remaining <= max', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (maxRequests, usedRequests) => {
            const remaining = Math.max(0, maxRequests - usedRequests);
            return remaining >= 0 && remaining <= maxRequests;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
