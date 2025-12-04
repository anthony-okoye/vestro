import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinancialModelingPrepAdapter, ConfigurationError, NetworkError } from '../fmp-adapter';
import { DataRequest } from '../../types';

describe('FinancialModelingPrepAdapter - Retry Logic', () => {
  describe('Retry Logic with Exponential Backoff', () => {
    let adapter: FinancialModelingPrepAdapter;
    let fetchSpy: any;

    beforeEach(() => {
      adapter = new FinancialModelingPrepAdapter('test-api-key');
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should retry on network errors with exponential backoff', async () => {
      // Mock fetch to fail twice, then succeed
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

      const startTime = Date.now();
      const response = await adapter.fetch(request);
      const endTime = Date.now();

      // Should have retried 3 times total
      expect(callCount).toBe(3);
      
      // Should have waited at least 1s (first retry) + 2s (second retry) = 3s total
      // Being lenient with timing due to test environment variability
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(3000); // At least 3 seconds for retries
      
      expect(response.data[0].symbol).toBe('AAPL');
    });

    it('should throw after max retries (3 attempts) on persistent network errors', async () => {
      // Mock fetch to always fail
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

    it('should use exponential backoff delays (1s, 2s, 4s)', async () => {
      // Mock fetch to always fail
      let callCount = 0;
      const callTimes: number[] = [];
      
      fetchSpy.mockImplementation(() => {
        callCount++;
        callTimes.push(Date.now());
        return Promise.reject(new Error('Network error'));
      });

      const request: DataRequest = {
        endpoint: '/income-statement/AAPL',
        params: {
          period: 'annual',
          limit: 5
        }
      };

      try {
        await adapter.fetch(request);
      } catch (error) {
        // Expected to fail
      }

      // Should have made 3 attempts
      expect(callCount).toBe(3);
      expect(callTimes.length).toBe(3);

      // Check delays between attempts
      // First retry should be after ~1s
      const delay1 = callTimes[1] - callTimes[0];
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(1500); // Allow some margin

      // Second retry should be after ~2s
      const delay2 = callTimes[2] - callTimes[1];
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(2500); // Allow some margin
    });

    it('should handle HTTP errors by retrying', async () => {
      // Mock fetch to return HTTP error twice, then succeed
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

      // Should have retried and eventually succeeded
      expect(callCount).toBe(3);
      expect(response.data[0].symbol).toBe('AAPL');
    });

    it('should log errors during retry attempts', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock fetch to fail twice, then succeed
      let callCount = 0;
      fetchSpy.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ symbol: 'AAPL' }])
        });
      });

      const request: DataRequest = {
        endpoint: '/income-statement/AAPL',
        params: {}
      };

      await adapter.fetch(request);

      // Should have logged errors for failed attempts
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
