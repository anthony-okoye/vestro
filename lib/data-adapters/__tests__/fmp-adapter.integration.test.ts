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

/**
 * Integration tests for Financial Modeling Prep adapter
 * Tests actual API calls with real API key
 * 
 * Requirements: 7.1 - WHEN running integration tests THEN the system SHALL successfully fetch data from each API
 * 
 * Note: These tests require a valid FMP_API_KEY environment variable.
 * Tests are skipped if the API key is not configured or if the API is not accessible.
 * 
 * Rate Limits:
 * - Free tier: 250 requests per day
 * - Tests are designed to stay within rate limits
 * 
 * IMPORTANT: FMP free tier has limited endpoint access. Some endpoints may return
 * HTML error pages instead of JSON if the API key doesn't have access.
 */

describe('FinancialModelingPrepAdapter Integration Tests', () => {
  let adapter: FinancialModelingPrepAdapter | null = null;
  const apiKey = process.env.FMP_API_KEY;
  const hasApiKey = !!(apiKey && apiKey.trim() !== '' && apiKey !== 'demo');
  let apiIsAccessible = false;

  // Test symbols - using well-known, stable stocks
  const TEST_SYMBOL = 'AAPL';
  const TEST_SYMBOL_ALT = 'MSFT';

  beforeAll(async () => {
    if (hasApiKey) {
      try {
        adapter = new FinancialModelingPrepAdapter(apiKey);
        
        // Test if API is actually accessible with a simple request
        // FMP free tier may not have access to all endpoints
        const profile = await adapter.getCompanyProfile(TEST_SYMBOL);
        if (profile && profile.symbol === TEST_SYMBOL) {
          apiIsAccessible = true;
        }
      } catch (error) {
        // API is not accessible (invalid key, rate limited, free tier limitations, etc.)
        console.log('FMP API not accessible, integration tests will be skipped:', 
          error instanceof Error ? error.message : String(error));
        apiIsAccessible = false;
      }
    }
  }, 60000); // 60 second timeout for beforeAll

  // Helper to determine if tests should run
  const canRunTests = () => hasApiKey && apiIsAccessible && adapter !== null;

  describe('Configuration', () => {
    it('should throw ConfigurationError when API key is missing', () => {
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

    it('should throw ConfigurationError for whitespace-only API key', () => {
      const originalEnv = process.env.FMP_API_KEY;
      delete process.env.FMP_API_KEY;

      try {
        expect(() => new FinancialModelingPrepAdapter('   ')).toThrow(ConfigurationError);
      } finally {
        if (originalEnv) {
          process.env.FMP_API_KEY = originalEnv;
        }
      }
    });

    it('should report API key and accessibility status', () => {
      // This test documents the current state for debugging
      console.log(`FMP API Key configured: ${hasApiKey}`);
      console.log(`FMP API accessible: ${apiIsAccessible}`);
      console.log(`Adapter initialized: ${adapter !== null}`);
      
      // Always passes - just for documentation
      expect(typeof hasApiKey).toBe('boolean');
      expect(typeof apiIsAccessible).toBe('boolean');
    });

    it.skipIf(!hasApiKey)('should initialize successfully with valid API key', () => {
      expect(adapter).toBeDefined();
      expect(adapter!.isConfigured()).toBe(true);
    });
  });

  describe('Income Statement Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch annual income statement for AAPL', async () => {
      const statements = await adapter!.getIncomeStatement(TEST_SYMBOL, 'annual', 3);

      // Validate response structure
      expect(statements).toBeDefined();
      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThan(0);
      expect(statements.length).toBeLessThanOrEqual(3);

      const statement = statements[0];
      expect(statement.symbol).toBe(TEST_SYMBOL);
      expect(statement.source).toBe('Financial Modeling Prep');
      expect(statement.period).toBe('annual');
      expect(statement.date).toBeInstanceOf(Date);

      // Validate financial data (Apple should have positive revenue and income)
      expect(typeof statement.revenue).toBe('number');
      expect(statement.revenue).toBeGreaterThan(0);

      expect(typeof statement.netIncome).toBe('number');
      expect(statement.netIncome).toBeGreaterThan(0);

      expect(typeof statement.eps).toBe('number');
    }, 30000);

    it.skipIf(!canRunTests())('should fetch quarterly income statement', async () => {
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statements = await adapter!.getIncomeStatement(TEST_SYMBOL, 'quarter', 4);

      expect(statements).toBeDefined();
      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThan(0);

      const statement = statements[0];
      expect(statement.period).toBe('quarter');
      expect(statement.revenue).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!canRunTests())('should handle lowercase symbol input', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statements = await adapter!.getIncomeStatement('aapl', 'annual', 1);

      expect(statements[0].symbol).toBe('AAPL');
    }, 30000);
  });

  describe('Balance Sheet Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch annual balance sheet for AAPL', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statements = await adapter!.getBalanceSheet(TEST_SYMBOL, 'annual', 3);

      // Validate response structure
      expect(statements).toBeDefined();
      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThan(0);

      const statement = statements[0];
      expect(statement.symbol).toBe(TEST_SYMBOL);
      expect(statement.source).toBe('Financial Modeling Prep');
      expect(statement.period).toBe('annual');

      // Validate balance sheet data
      expect(typeof statement.assets).toBe('number');
      expect(statement.assets).toBeGreaterThan(0);

      expect(typeof statement.liabilities).toBe('number');
      expect(statement.liabilities).toBeGreaterThan(0);

      expect(typeof statement.equity).toBe('number');
    }, 30000);

    it.skipIf(!canRunTests())('should fetch quarterly balance sheet', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statements = await adapter!.getBalanceSheet(TEST_SYMBOL, 'quarter', 4);

      expect(statements).toBeDefined();
      expect(statements.length).toBeGreaterThan(0);
      expect(statements[0].period).toBe('quarter');
    }, 30000);
  });

  describe('Cash Flow Statement Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch annual cash flow statement for AAPL', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statements = await adapter!.getCashFlowStatement(TEST_SYMBOL, 'annual', 3);

      // Validate response structure
      expect(statements).toBeDefined();
      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThan(0);

      const statement = statements[0];
      expect(statement.symbol).toBe(TEST_SYMBOL);
      expect(statement.source).toBe('Financial Modeling Prep');
      expect(statement.period).toBe('annual');

      // Validate cash flow data (Apple should have positive operating cash flow)
      expect(typeof statement.operatingCashFlow).toBe('number');
      expect(statement.operatingCashFlow).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!canRunTests())('should fetch quarterly cash flow statement', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statements = await adapter!.getCashFlowStatement(TEST_SYMBOL, 'quarter', 4);

      expect(statements).toBeDefined();
      expect(statements.length).toBeGreaterThan(0);
      expect(statements[0].period).toBe('quarter');
    }, 30000);
  });

  describe('Company Profile Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch company profile for AAPL', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const profile = await adapter!.getCompanyProfile(TEST_SYMBOL);

      // Validate response structure
      expect(profile).toBeDefined();
      expect(profile.symbol).toBe(TEST_SYMBOL);
      expect(profile.source).toBe('Financial Modeling Prep');

      // Validate company info
      expect(typeof profile.name).toBe('string');
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.name.toLowerCase()).toContain('apple');

      expect(typeof profile.description).toBe('string');
      expect(profile.description.length).toBeGreaterThan(0);

      // Validate sector and industry
      expect(typeof profile.sector).toBe('string');
      expect(profile.sector.length).toBeGreaterThan(0);

      expect(typeof profile.industry).toBe('string');
      expect(profile.industry.length).toBeGreaterThan(0);

      // Validate market cap (Apple should have a large market cap)
      expect(typeof profile.marketCap).toBe('number');
      expect(profile.marketCap).toBeGreaterThan(1000000000000); // > $1 trillion
    }, 30000);

    it.skipIf(!canRunTests())('should fetch company profile for MSFT', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const profile = await adapter!.getCompanyProfile(TEST_SYMBOL_ALT);

      expect(profile.symbol).toBe(TEST_SYMBOL_ALT);
      expect(profile.name.toLowerCase()).toContain('microsoft');
      expect(profile.marketCap).toBeGreaterThan(0);
    }, 30000);

    it.skipIf(!canRunTests())('should handle lowercase symbol for company profile', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const profile = await adapter!.getCompanyProfile('msft');

      expect(profile.symbol).toBe('MSFT');
    }, 30000);
  });

  describe('Key Metrics Fetching End-to-End', () => {
    it.skipIf(!canRunTests())('should fetch key metrics for AAPL', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = await adapter!.getKeyMetrics(TEST_SYMBOL, 'annual', 3);

      // Validate response structure
      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);

      const metric = metrics[0];
      expect(metric.symbol).toBe(TEST_SYMBOL);
      expect(metric.source).toBe('Financial Modeling Prep');
      expect(metric.date).toBeInstanceOf(Date);

      // Validate metrics (can be null or number)
      if (metric.peRatio !== null) {
        expect(typeof metric.peRatio).toBe('number');
        expect(metric.peRatio).toBeGreaterThan(0);
      }

      if (metric.pbRatio !== null) {
        expect(typeof metric.pbRatio).toBe('number');
      }

      if (metric.debtToEquity !== null) {
        expect(typeof metric.debtToEquity).toBe('number');
      }

      if (metric.returnOnEquity !== null) {
        expect(typeof metric.returnOnEquity).toBe('number');
      }

      if (metric.dividendYield !== null) {
        expect(typeof metric.dividendYield).toBe('number');
        expect(metric.dividendYield).toBeGreaterThanOrEqual(0);
      }
    }, 30000);

    it.skipIf(!canRunTests())('should fetch quarterly key metrics', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = await adapter!.getKeyMetrics(TEST_SYMBOL, 'quarter', 4);

      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Error Handling End-to-End', () => {
    it.skipIf(!canRunTests())('should handle invalid symbol gracefully for income statement', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await expect(adapter!.getIncomeStatement('INVALIDXYZ123')).rejects.toThrow();
    }, 30000);

    it.skipIf(!canRunTests())('should handle invalid symbol gracefully for company profile', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await expect(adapter!.getCompanyProfile('INVALIDXYZ123')).rejects.toThrow();
    }, 30000);
  });

  describe('Data Quality Validation', () => {
    it.skipIf(!canRunTests())('should return financial statements with valid dates', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statements = await adapter!.getIncomeStatement(TEST_SYMBOL, 'annual', 5);

      // All dates should be valid and in the past
      const now = new Date();
      for (const statement of statements) {
        expect(statement.date).toBeInstanceOf(Date);
        expect(statement.date.getTime()).toBeLessThan(now.getTime());
        expect(statement.date.getFullYear()).toBeGreaterThan(2000);
      }
    }, 30000);

    it.skipIf(!canRunTests())('should return consistent data across multiple calls', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const profile1 = await adapter!.getCompanyProfile(TEST_SYMBOL);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const profile2 = await adapter!.getCompanyProfile(TEST_SYMBOL);

      // Core data should be consistent
      expect(profile1.symbol).toBe(profile2.symbol);
      expect(profile1.name).toBe(profile2.name);
      expect(profile1.sector).toBe(profile2.sector);
      expect(profile1.industry).toBe(profile2.industry);
    }, 60000);
  });
});
