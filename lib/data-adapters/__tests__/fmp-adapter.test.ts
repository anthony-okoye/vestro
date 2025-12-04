import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigurationError } from '../../api-error';
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
    FINANCIAL_STATEMENTS: { revalidate: 86400, tags: ['financial-statements'] },
    COMPANY_PROFILES: { revalidate: 604800, tags: ['company-profiles'] },
    VALUATION_DATA: { revalidate: 86400, tags: ['valuation-data'] },
  },
  CacheKeys: {
    incomeStatement: (ticker: string) => `income-statement-${ticker}`,
    balanceSheet: (ticker: string) => `balance-sheet-${ticker}`,
    cashFlowStatement: (ticker: string) => `cash-flow-statement-${ticker}`,
    companyProfile: (ticker: string) => `company-profile-${ticker}`,
    keyMetrics: (ticker: string) => `key-metrics-${ticker}`,
  },
}));

// Import after mocking
import { FinancialModelingPrepAdapter } from '../fmp-adapter';

describe('FinancialModelingPrepAdapter', () => {
  describe('Configuration', () => {
    it('should throw ConfigurationError when API key is missing', () => {
      const originalEnv = process.env.FMP_API_KEY;
      delete process.env.FMP_API_KEY;

      try {
        expect(() => new FinancialModelingPrepAdapter()).toThrow(ConfigurationError);
        expect(() => new FinancialModelingPrepAdapter()).toThrow('Financial Modeling Prep API key is required');
      } finally {
        if (originalEnv) process.env.FMP_API_KEY = originalEnv;
      }
    });

    it('should throw ConfigurationError when API key is empty', () => {
      const originalEnv = process.env.FMP_API_KEY;
      delete process.env.FMP_API_KEY;

      try {
        expect(() => new FinancialModelingPrepAdapter('')).toThrow(ConfigurationError);
        expect(() => new FinancialModelingPrepAdapter('   ')).toThrow(ConfigurationError);
      } finally {
        if (originalEnv) process.env.FMP_API_KEY = originalEnv;
      }
    });

    it('should initialize successfully with valid API key', () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      expect(adapter.isConfigured()).toBe(true);
    });
  });


  describe('Income Statement Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse income statement correctly', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            date: '2023-12-31',
            revenue: 383285000000,
            netIncome: 96995000000,
            eps: 6.13,
            epsdiluted: 6.11
          }
        ])
      } as Response);

      const statements = await adapter.getIncomeStatement('AAPL');

      expect(statements).toHaveLength(1);
      expect(statements[0].symbol).toBe('AAPL');
      expect(statements[0].revenue).toBe(383285000000);
      expect(statements[0].netIncome).toBe(96995000000);
      expect(statements[0].eps).toBe(6.13);
      expect(statements[0].period).toBe('annual');
      expect(statements[0].source).toBe('Financial Modeling Prep');
    });

    it('should handle quarterly income statements', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            date: '2023-09-30',
            revenue: 89498000000,
            netIncome: 22956000000,
            eps: 1.46
          }
        ])
      } as Response);

      const statements = await adapter.getIncomeStatement('AAPL', 'quarter');

      expect(statements).toHaveLength(1);
      expect(statements[0].period).toBe('quarter');
    });

    it('should throw NotFoundError when no income statement data found', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      } as Response);

      await expect(adapter.getIncomeStatement('INVALID')).rejects.toThrow('No income statement data found');
    });

    it('should uppercase symbol in request', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'MSFT',
            date: '2023-12-31',
            revenue: 211915000000,
            netIncome: 72361000000,
            eps: 9.68
          }
        ])
      } as Response);

      await adapter.getIncomeStatement('msft');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/income-statement/MSFT'),
        expect.any(Object)
      );
    });
  });

  describe('Balance Sheet Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse balance sheet correctly', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            date: '2023-12-31',
            totalAssets: 352583000000,
            totalLiabilities: 290437000000,
            totalStockholdersEquity: 62146000000
          }
        ])
      } as Response);

      const statements = await adapter.getBalanceSheet('AAPL');

      expect(statements).toHaveLength(1);
      expect(statements[0].symbol).toBe('AAPL');
      expect(statements[0].assets).toBe(352583000000);
      expect(statements[0].liabilities).toBe(290437000000);
      expect(statements[0].equity).toBe(62146000000);
      expect(statements[0].period).toBe('annual');
      expect(statements[0].source).toBe('Financial Modeling Prep');
    });

    it('should handle quarterly balance sheets', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            date: '2023-09-30',
            totalAssets: 352583000000,
            totalLiabilities: 290437000000,
            totalEquity: 62146000000
          }
        ])
      } as Response);

      const statements = await adapter.getBalanceSheet('AAPL', 'quarter');

      expect(statements).toHaveLength(1);
      expect(statements[0].period).toBe('quarter');
      expect(statements[0].equity).toBe(62146000000);
    });

    it('should throw NotFoundError when no balance sheet data found', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      } as Response);

      await expect(adapter.getBalanceSheet('INVALID')).rejects.toThrow('No balance sheet data found');
    });
  });

  describe('Cash Flow Statement Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse cash flow statement correctly', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            date: '2023-12-31',
            operatingCashFlow: 110543000000
          }
        ])
      } as Response);

      const statements = await adapter.getCashFlowStatement('AAPL');

      expect(statements).toHaveLength(1);
      expect(statements[0].symbol).toBe('AAPL');
      expect(statements[0].operatingCashFlow).toBe(110543000000);
      expect(statements[0].period).toBe('annual');
      expect(statements[0].source).toBe('Financial Modeling Prep');
    });

    it('should handle quarterly cash flow statements', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            date: '2023-09-30',
            operatingCashFlow: 26000000000
          }
        ])
      } as Response);

      const statements = await adapter.getCashFlowStatement('AAPL', 'quarter');

      expect(statements).toHaveLength(1);
      expect(statements[0].period).toBe('quarter');
    });

    it('should throw NotFoundError when no cash flow data found', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      } as Response);

      await expect(adapter.getCashFlowStatement('INVALID')).rejects.toThrow('No cash flow statement data found');
    });
  });


  describe('Company Profile Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse company profile correctly', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            description: 'Apple Inc. designs, manufactures, and markets smartphones.',
            sector: 'Technology',
            industry: 'Consumer Electronics',
            mktCap: 2800000000000
          }
        ])
      } as Response);

      const profile = await adapter.getCompanyProfile('AAPL');

      expect(profile.symbol).toBe('AAPL');
      expect(profile.name).toBe('Apple Inc.');
      expect(profile.description).toBe('Apple Inc. designs, manufactures, and markets smartphones.');
      expect(profile.sector).toBe('Technology');
      expect(profile.industry).toBe('Consumer Electronics');
      expect(profile.marketCap).toBe(2800000000000);
      expect(profile.source).toBe('Financial Modeling Prep');
    });

    it('should handle missing company profile data', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      } as Response);

      await expect(adapter.getCompanyProfile('INVALID')).rejects.toThrow('No company profile data found');
    });

    it('should handle empty profile object', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{}])
      } as Response);

      await expect(adapter.getCompanyProfile('INVALID')).rejects.toThrow('No company profile data found');
    });

    it('should use fallback values for missing fields', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'TEST'
          }
        ])
      } as Response);

      const profile = await adapter.getCompanyProfile('TEST');

      expect(profile.symbol).toBe('TEST');
      expect(profile.name).toBe('TEST');
      expect(profile.description).toBe('');
      expect(profile.sector).toBe('Unknown');
      expect(profile.industry).toBe('Unknown');
      expect(profile.marketCap).toBe(0);
    });

    it('should handle marketCap field name variations', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'TEST',
            companyName: 'Test Company',
            marketCap: 1000000000
          }
        ])
      } as Response);

      const profile = await adapter.getCompanyProfile('TEST');

      expect(profile.marketCap).toBe(1000000000);
    });
  });

  describe('Key Metrics Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse key metrics correctly', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'AAPL',
            date: '2023-12-31',
            peRatio: 28.5,
            pbRatio: 45.2,
            debtToEquity: 1.8,
            roe: 0.156,
            dividendYield: 0.0055
          }
        ])
      } as Response);

      const metrics = await adapter.getKeyMetrics('AAPL');

      expect(metrics).toHaveLength(1);
      expect(metrics[0].symbol).toBe('AAPL');
      expect(metrics[0].peRatio).toBe(28.5);
      expect(metrics[0].pbRatio).toBe(45.2);
      expect(metrics[0].debtToEquity).toBe(1.8);
      expect(metrics[0].returnOnEquity).toBe(0.156);
      expect(metrics[0].dividendYield).toBe(0.0055);
      expect(metrics[0].source).toBe('Financial Modeling Prep');
    });

    it('should handle null and missing numeric values gracefully', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          {
            symbol: 'TEST',
            date: '2023-12-31',
            peRatio: null,
            pbRatio: '-',
            debtToEquity: 'None',
            roe: undefined,
            dividendYield: null
          }
        ])
      } as Response);

      const metrics = await adapter.getKeyMetrics('TEST');

      expect(metrics[0].peRatio).toBeNull();
      expect(metrics[0].pbRatio).toBeNull();
      expect(metrics[0].debtToEquity).toBeNull();
      expect(metrics[0].returnOnEquity).toBeNull();
      expect(metrics[0].dividendYield).toBeNull();
    });

    it('should throw NotFoundError when no key metrics data found', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      } as Response);

      await expect(adapter.getKeyMetrics('INVALID')).rejects.toThrow('No key metrics data found');
    });
  });


  describe('Error Handling', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle API error messages', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Error': 'Invalid API KEY. Please retry or visit our documentation.'
        })
      } as Response);

      await expect(adapter.getIncomeStatement('AAPL')).rejects.toThrow('FMP API Error');
    });

    it('should handle Error Message field', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          'Error Message': 'Invalid API call.'
        })
      } as Response);

      await expect(adapter.getIncomeStatement('AAPL')).rejects.toThrow('FMP API Error');
    });

    it('should handle JSON parse errors', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Unexpected token'))
      } as Response);

      await expect(adapter.getIncomeStatement('AAPL')).rejects.toThrow();
    });

    it('should handle HTTP 429 rate limit errors', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      } as Response);

      await expect(adapter.getIncomeStatement('AAPL')).rejects.toThrow('rate limit');
    });

    it('should handle HTTP 500 server errors with retry', async () => {
      const adapter = new FinancialModelingPrepAdapter('test-api-key');
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      let callCount = 0;
      fetchSpy.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            {
              symbol: 'AAPL',
              date: '2023-12-31',
              revenue: 383285000000,
              netIncome: 96995000000,
              eps: 6.13
            }
          ])
        } as Response);
      });

      const statements = await adapter.getIncomeStatement('AAPL');

      expect(callCount).toBe(3);
      expect(statements[0].symbol).toBe('AAPL');
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    let adapter: FinancialModelingPrepAdapter;
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      adapter = new FinancialModelingPrepAdapter('test-api-key');
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should retry on network errors with exponential backoff', async () => {
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
          json: () => Promise.resolve([
            {
              symbol: 'AAPL',
              date: '2023-12-31',
              revenue: 383285000000,
              netIncome: 96995000000,
              eps: 6.13
            }
          ])
        });
      });

      const request: DataRequest = {
        endpoint: '/income-statement/AAPL',
        params: {
          period: 'annual',
          limit: 5
        }
      };

      const response = await adapter.fetch(request);

      expect(callCount).toBe(3);
      expect(response.data[0].symbol).toBe('AAPL');
    });

    it('should throw after max retries on persistent network errors', async () => {
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const request: DataRequest = {
        endpoint: '/income-statement/AAPL',
        params: {
          period: 'annual',
          limit: 5
        }
      };

      await expect(adapter.fetch(request)).rejects.toThrow('Failed to fetch from Financial Modeling Prep after 3 attempts');
    });

    it('should handle HTTP errors by retrying', async () => {
      vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
      
      let callCount = 0;
      fetchSpy.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            {
              symbol: 'AAPL',
              date: '2023-12-31',
              revenue: 383285000000,
              netIncome: 96995000000,
              eps: 6.13
            }
          ])
        });
      });

      const request: DataRequest = {
        endpoint: '/income-statement/AAPL',
        params: {
          period: 'annual',
          limit: 5
        }
      };

      const response = await adapter.fetch(request);

      expect(callCount).toBe(3);
      expect(response.data[0].symbol).toBe('AAPL');
    });
  });


  /**
   * Property-Based Tests for Retry with Exponential Backoff
   * **Feature: api-integration, Property 3: Retry with Exponential Backoff**
   * **Validates: Requirements 2.6**
   */
  describe('Property-Based Tests - Retry with Exponential Backoff', () => {
    /**
     * **Feature: api-integration, Property 3: Retry with Exponential Backoff**
     * **Validates: Requirements 2.6**
     */
    it('should calculate correct exponential backoff delays for any attempt number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          (attempt) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');
            const backoffMs = (adapter as any).calculateBackoff(attempt);
            const expectedBackoff = Math.pow(2, attempt - 1) * 1000;
            return backoffMs === expectedBackoff;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 3: Retry with Exponential Backoff**
     * **Validates: Requirements 2.6**
     */
    it('should make correct number of attempts for any failure sequence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 2 }),
          async (numFailures) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');
            vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
            
            const fetchSpy = vi.spyOn(global, 'fetch');
            let callCount = 0;
            
            fetchSpy.mockImplementation(() => {
              callCount++;
              if (callCount <= numFailures) {
                return Promise.reject(new Error('Network error'));
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([
                  {
                    symbol: 'TEST',
                    date: '2023-12-31',
                    revenue: 100000000,
                    netIncome: 10000000,
                    eps: 1.00
                  }
                ])
              } as Response);
            });

            const request: DataRequest = {
              endpoint: '/income-statement/TEST',
              params: { period: 'annual', limit: 1 }
            };

            try {
              await adapter.fetch(request);
              const result = callCount === numFailures + 1;
              vi.restoreAllMocks();
              return result;
            } catch {
              vi.restoreAllMocks();
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 3: Retry with Exponential Backoff**
     * **Validates: Requirements 2.6**
     */
    it('should always make exactly 3 attempts on persistent failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (errorMessage) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');
            vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
            
            const fetchSpy = vi.spyOn(global, 'fetch');
            let callCount = 0;
            
            fetchSpy.mockImplementation(() => {
              callCount++;
              return Promise.reject(new Error(errorMessage || 'Network error'));
            });

            const request: DataRequest = {
              endpoint: '/income-statement/TEST',
              params: { period: 'annual', limit: 1 }
            };

            try {
              await adapter.fetch(request);
              vi.restoreAllMocks();
              return false;
            } catch (error) {
              const result = callCount === 3 && 
                (error as Error).message.includes('after 3 attempts');
              vi.restoreAllMocks();
              return result;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 3: Retry with Exponential Backoff**
     * **Validates: Requirements 2.6**
     */
    it('should have strictly increasing backoff delays', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2 }),
          (attempt) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');
            const currentBackoff = (adapter as any).calculateBackoff(attempt);
            const nextBackoff = (adapter as any).calculateBackoff(attempt + 1);
            return nextBackoff === currentBackoff * 2 && nextBackoff > currentBackoff;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 3: Retry with Exponential Backoff**
     * **Validates: Requirements 2.6**
     */
    it('should retry on any HTTP 5xx error with exponential backoff', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 599 }),
          async (statusCode) => {
            const adapter = new FinancialModelingPrepAdapter('test-api-key');
            vi.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);
            
            const fetchSpy = vi.spyOn(global, 'fetch');
            let callCount = 0;
            
            fetchSpy.mockImplementation(() => {
              callCount++;
              if (callCount < 3) {
                return Promise.resolve({
                  ok: false,
                  status: statusCode,
                  statusText: 'Server Error'
                } as Response);
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([
                  {
                    symbol: 'TEST',
                    date: '2023-12-31',
                    revenue: 100000000,
                    netIncome: 10000000,
                    eps: 1.00
                  }
                ])
              } as Response);
            });

            const request: DataRequest = {
              endpoint: '/income-statement/TEST',
              params: { period: 'annual', limit: 1 }
            };

            try {
              await adapter.fetch(request);
              const result = callCount === 3;
              vi.restoreAllMocks();
              return result;
            } catch {
              vi.restoreAllMocks();
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
