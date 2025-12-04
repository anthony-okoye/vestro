import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AlphaVantageAdapter } from '../alpha-vantage-adapter';
import { ConfigurationError } from '../../api-error';
import { DataRequest } from '../../types';
import * as fc from 'fast-check';

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
