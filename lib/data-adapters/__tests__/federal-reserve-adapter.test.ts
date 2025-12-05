import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigurationError, NotFoundError, ValidationError, NetworkError } from '../../api-error';

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
 * Unit tests for Federal Reserve (FRED) adapter
 * Tests adapter methods with mocked API responses
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
describe('FederalReserveAdapter', () => {
  describe('Configuration', () => {
    it('should throw ConfigurationError when API key is missing', () => {
      const originalEnv = process.env.FRED_API_KEY;
      delete process.env.FRED_API_KEY;

      expect(() => new FederalReserveAdapter()).toThrow(ConfigurationError);
      expect(() => new FederalReserveAdapter()).toThrow('FRED API key is required');

      if (originalEnv) process.env.FRED_API_KEY = originalEnv;
    });

    it('should throw ConfigurationError when API key is empty', () => {
      const originalEnv = process.env.FRED_API_KEY;
      delete process.env.FRED_API_KEY;

      expect(() => new FederalReserveAdapter('')).toThrow(ConfigurationError);
      expect(() => new FederalReserveAdapter('   ')).toThrow(ConfigurationError);

      if (originalEnv) process.env.FRED_API_KEY = originalEnv;
    });

    it('should initialize successfully with valid API key', () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      expect(adapter.isConfigured()).toBe(true);
      expect(adapter.sourceName).toBe('Federal Reserve FRED');
    });

    it('should use API key from constructor parameter', () => {
      const adapter = new FederalReserveAdapter('custom-key');
      expect(adapter.isConfigured()).toBe(true);
    });

    it('should use API key from environment variable', () => {
      const originalEnv = process.env.FRED_API_KEY;
      process.env.FRED_API_KEY = 'env-key';

      const adapter = new FederalReserveAdapter();
      expect(adapter.isConfigured()).toBe(true);

      if (originalEnv) {
        process.env.FRED_API_KEY = originalEnv;
      } else {
        delete process.env.FRED_API_KEY;
      }
    });
  });

  describe('Series Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch series data with API key', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [
            { date: '2024-01-01', value: '5.25' },
            { date: '2024-02-01', value: '5.30' },
            { date: '2024-03-01', value: '5.35' }
          ]
        })
      } as Response);

      const data = await adapter.getSeries('FEDFUNDS');

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);
      expect(data[0].seriesId).toBe('FEDFUNDS');
      expect(data[0].date).toBe('2024-01-01');
      expect(data[0].value).toBe(5.25);
    });

    it('should fetch series with date range', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [
            { date: '2023-06-01', value: '5.00' },
            { date: '2023-07-01', value: '5.10' }
          ]
        })
      } as Response);

      const startDate = new Date('2023-06-01');
      const endDate = new Date('2023-07-31');
      const data = await adapter.getSeries('FEDFUNDS', startDate, endDate);

      expect(data.length).toBe(2);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('observation_start=2023-06-01')
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('observation_end=2023-07-31')
      );
    });

    it('should fetch series with limit', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [
            { date: '2024-01-01', value: '5.25' }
          ]
        })
      } as Response);

      const data = await adapter.getSeries('FEDFUNDS', undefined, undefined, 1);

      expect(data.length).toBe(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('limit=1')
      );
    });

    it('should filter out missing values (dots)', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [
            { date: '2024-01-01', value: '5.25' },
            { date: '2024-02-01', value: '.' },
            { date: '2024-03-01', value: '5.35' }
          ]
        })
      } as Response);

      const data = await adapter.getSeries('FEDFUNDS');

      expect(data.length).toBe(2);
      expect(data[0].value).toBe(5.25);
      expect(data[1].value).toBe(5.35);
    });

    it('should return empty array for series with no observations', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: []
        })
      } as Response);

      const data = await adapter.getSeries('INVALID');

      expect(data).toEqual([]);
    });
  });

  describe('Batch Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch multiple series in batch', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      // Mock responses for each series
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            observations: [{ date: '2024-01-01', value: '5.25' }]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            observations: [{ date: '2024-01-01', value: '3.8' }]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            observations: [{ date: '2024-01-01', value: '300.5' }]
          })
        } as Response);

      const seriesIds = ['FEDFUNDS', 'UNRATE', 'CPIAUCSL'];
      const results = await adapter.getMultipleSeries(seriesIds);

      expect(results instanceof Map).toBe(true);
      expect(results.size).toBe(3);
      expect(results.has('FEDFUNDS')).toBe(true);
      expect(results.has('UNRATE')).toBe(true);
      expect(results.has('CPIAUCSL')).toBe(true);
      
      const fedFundsData = results.get('FEDFUNDS');
      expect(fedFundsData).toBeDefined();
      expect(fedFundsData!.length).toBe(1);
      expect(fedFundsData![0].value).toBe(5.25);
    });

    it('should handle partial failures in batch fetch gracefully', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            observations: [{ date: '2024-01-01', value: '5.25' }]
          })
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const seriesIds = ['FEDFUNDS', 'INVALID'];
      const results = await adapter.getMultipleSeries(seriesIds);

      expect(results.size).toBe(2);
      expect(results.get('FEDFUNDS')!.length).toBe(1);
      expect(results.get('INVALID')).toEqual([]);
    }, 10000);
  });

  describe('Latest Value Fetching', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch latest value for a series', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [{ date: '2024-01-01', value: '5.25' }]
        })
      } as Response);

      const value = await adapter.getLatestValue('FEDFUNDS');

      expect(typeof value).toBe('number');
      expect(value).toBe(5.25);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('limit=1')
      );
    });

    it('should throw NotFoundError when no data available', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: []
        })
      } as Response);

      await expect(adapter.getLatestValue('INVALID')).rejects.toThrow(NotFoundError);
      await expect(adapter.getLatestValue('INVALID')).rejects.toThrow('No data available');
    });
  });

  describe('Economic Indicator Methods', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch interest rate', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [{ date: '2024-01-01', value: '5.25' }]
        })
      } as Response);

      const rate = await adapter.fetchInterestRate();

      expect(typeof rate).toBe('number');
      expect(rate).toBe(5.25);
    });

    it('should fetch unemployment rate', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [{ date: '2024-01-01', value: '3.8' }]
        })
      } as Response);

      const rate = await adapter.fetchUnemploymentRate();

      expect(typeof rate).toBe('number');
      expect(rate).toBe(3.8);
    });

    it('should fetch and calculate inflation rate', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      // Mock 13 months of CPI data for YoY calculation
      const observations = [];
      for (let i = 0; i < 13; i++) {
        observations.push({
          date: `2024-${String(i + 1).padStart(2, '0')}-01`,
          value: (300 + i).toString()
        });
      }
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ observations })
      } as Response);

      const rate = await adapter.fetchInflationRate();

      expect(typeof rate).toBe('number');
      // YoY inflation: ((312 - 300) / 300) * 100 = 4%
      expect(rate).toBeCloseTo(4.0, 1);
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

    it('should handle network errors', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockRejectedValue(new Error('Network failure'));

      await expect(adapter.getSeries('FEDFUNDS')).rejects.toThrow('Network failure');
    });

    it('should handle HTTP errors', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({})
      } as Response);

      await expect(adapter.getSeries('FEDFUNDS')).rejects.toThrow('Internal Server Error');
    });

    it('should handle invalid JSON responses', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response);

      await expect(adapter.getSeries('FEDFUNDS')).rejects.toThrow('Invalid JSON');
    });

    it('should parse and throw FRED API errors with error codes', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 400,
        json: () => Promise.resolve({
          error_code: '400',
          error_message: 'Bad Request - Invalid series ID'
        })
      } as Response);

      await expect(adapter.getSeries('INVALID')).rejects.toThrow('Bad Request');
    });

    it('should handle 401 unauthorized errors', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error_code: '401',
          error_message: 'Unauthorized - Invalid API key'
        })
      } as Response);

      await expect(adapter.getSeries('FEDFUNDS')).rejects.toThrow('Invalid or missing API key');
    });

    it('should handle 404 not found errors', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 404,
        json: () => Promise.resolve({
          error_code: '404',
          error_message: 'Not Found - Series does not exist'
        })
      } as Response);

      await expect(adapter.getSeries('INVALID')).rejects.toThrow('Not Found');
    });

    it('should handle missing API key scenario', async () => {
      const originalEnv = process.env.FRED_API_KEY;
      delete process.env.FRED_API_KEY;

      expect(() => new FederalReserveAdapter()).toThrow(ConfigurationError);
      expect(() => new FederalReserveAdapter('')).toThrow(ConfigurationError);

      if (originalEnv) process.env.FRED_API_KEY = originalEnv;
    });
  });

  describe('Legacy fetchSeries Method', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should support legacy fetchSeries method', async () => {
      const adapter = new FederalReserveAdapter('test-api-key');
      
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          observations: [
            { date: '2024-01-01', value: '5.25' },
            { date: '2024-02-01', value: '5.30' }
          ]
        })
      } as Response);

      const data = await adapter.fetchSeries('FEDFUNDS', 2);

      expect(data.length).toBe(2);
      expect(data[0].seriesId).toBe('FEDFUNDS');
    });
  });
});
