import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { FallbackStrategies, DataAdapter, FallbackChain } from '../../fallback-strategies';
import { APIError, NetworkError, RateLimitError, ValidationError, ConfigurationError } from '../../api-error';

/**
 * **Feature: api-integration, Property 6: Fallback Activation**
 * **Validates: Requirements 5.5**
 * 
 * For any primary data source failure after all retries, if a fallback source
 * is configured, the system should attempt to fetch from the fallback source.
 */
describe('Property 6: Fallback Activation', () => {
  let fallbackStrategies: FallbackStrategies;

  beforeEach(() => {
    fallbackStrategies = new FallbackStrategies();
    vi.clearAllMocks();
  });

  afterEach(() => {
    fallbackStrategies.clearAllFallbackChains();
  });

  /**
   * Helper to create a mock adapter
   */
  function createMockAdapter(
    name: string,
    configured: boolean,
    fetchBehavior: 'success' | 'fail' | 'error-type',
    errorType?: 'network' | 'rate-limit' | 'validation' | 'config',
    returnValue?: any
  ): DataAdapter {
    return {
      sourceName: name,
      isConfigured: () => configured,
      fetch: vi.fn().mockImplementation(async () => {
        if (fetchBehavior === 'success') {
          return returnValue ?? { data: `data-from-${name}`, source: name };
        }
        if (fetchBehavior === 'error-type' && errorType) {
          switch (errorType) {
            case 'network':
              throw new NetworkError(`Network error from ${name}`, name);
            case 'rate-limit':
              throw new RateLimitError(`Rate limit from ${name}`, name);
            case 'validation':
              throw new ValidationError(`Validation error from ${name}`, name);
            case 'config':
              throw new ConfigurationError(`Config error from ${name}`, name);
          }
        }
        throw new APIError(`Error from ${name}`, 'GENERIC_ERROR', name, true);
      }),
    };
  }

  /**
   * **Feature: api-integration, Property 6: Fallback Activation**
   * **Validates: Requirements 5.5**
   * 
   * For any primary adapter failure, if fallback adapters are configured,
   * the system should attempt each fallback in order until one succeeds.
   */
  it('should activate fallback when primary source fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of fallback adapters (1-5)
        fc.integer({ min: 1, max: 5 }),
        // Generate which fallback should succeed (0-indexed, -1 means all fail)
        fc.integer({ min: -1, max: 4 }),
        // Generate data type name
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z]/gi, 'a') || 'test-data'),
        async (numFallbacks, successIndex, dataType) => {
          // Ensure successIndex is within bounds
          const actualSuccessIndex = successIndex >= numFallbacks ? -1 : successIndex;
          
          // Create primary adapter that always fails
          const primaryAdapter = createMockAdapter('primary', true, 'fail');
          
          // Create fallback adapters
          const fallbackAdapters: DataAdapter[] = [];
          for (let i = 0; i < numFallbacks; i++) {
            const shouldSucceed = i === actualSuccessIndex;
            fallbackAdapters.push(
              createMockAdapter(
                `fallback-${i}`,
                true,
                shouldSucceed ? 'success' : 'fail',
                undefined,
                { data: `data-from-fallback-${i}`, source: `fallback-${i}` }
              )
            );
          }

          // Register fallback chain
          fallbackStrategies.registerFallbackChain(dataType, {
            primary: primaryAdapter,
            fallbacks: fallbackAdapters,
          });

          // Fetch with fallback
          const result = await fallbackStrategies.fetchWithFallback(
            dataType,
            async (adapter) => adapter.fetch({})
          );

          // Verify primary was called
          expect(primaryAdapter.fetch).toHaveBeenCalled();

          if (actualSuccessIndex >= 0) {
            // A fallback succeeded
            expect(result.data).not.toBeNull();
            expect(result.usedFallback).toBe(true);
            expect(result.source).toBe(`fallback-${actualSuccessIndex}`);
            
            // Verify fallbacks before success index were called
            for (let i = 0; i <= actualSuccessIndex; i++) {
              expect(fallbackAdapters[i].fetch).toHaveBeenCalled();
            }
            
            // Verify fallbacks after success index were NOT called
            for (let i = actualSuccessIndex + 1; i < numFallbacks; i++) {
              expect(fallbackAdapters[i].fetch).not.toHaveBeenCalled();
            }
          } else {
            // All fallbacks failed
            expect(result.data).toBeNull();
            expect(result.usedFallback).toBe(false);
            expect(result.warnings).toContain(`All data sources failed for ${dataType}`);
            
            // Verify all fallbacks were called
            fallbackAdapters.forEach((adapter) => {
              expect(adapter.fetch).toHaveBeenCalled();
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: api-integration, Property 6: Fallback Activation**
   * **Validates: Requirements 5.5**
   * 
   * For any retryable error from primary source, the system should
   * attempt fallback sources.
   */
  it('should activate fallback for any retryable error type', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate error type
        fc.constantFrom('network', 'rate-limit') as fc.Arbitrary<'network' | 'rate-limit'>,
        // Generate data type name
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z]/gi, 'a') || 'test-data'),
        async (errorType, dataType) => {
          // Create primary adapter that fails with specific error type
          const primaryAdapter = createMockAdapter('primary', true, 'error-type', errorType);
          
          // Create fallback adapter that succeeds
          const fallbackAdapter = createMockAdapter('fallback', true, 'success', undefined, {
            data: 'fallback-data',
            source: 'fallback',
          });

          // Register fallback chain
          fallbackStrategies.registerFallbackChain(dataType, {
            primary: primaryAdapter,
            fallbacks: [fallbackAdapter],
          });

          // Fetch with fallback
          const result = await fallbackStrategies.fetchWithFallback(
            dataType,
            async (adapter) => adapter.fetch({})
          );

          // Verify fallback was activated
          expect(result.data).not.toBeNull();
          expect(result.usedFallback).toBe(true);
          expect(result.source).toBe('fallback');
          expect(primaryAdapter.fetch).toHaveBeenCalled();
          expect(fallbackAdapter.fetch).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: api-integration, Property 6: Fallback Activation**
   * **Validates: Requirements 5.5**
   * 
   * For any non-retryable error from primary source, the system should
   * still attempt fallback sources.
   */
  it('should activate fallback even for non-retryable errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate non-retryable error type
        fc.constantFrom('validation', 'config') as fc.Arbitrary<'validation' | 'config'>,
        // Generate data type name
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z]/gi, 'a') || 'test-data'),
        async (errorType, dataType) => {
          // Create primary adapter that fails with non-retryable error
          const primaryAdapter = createMockAdapter('primary', true, 'error-type', errorType);
          
          // Create fallback adapter that succeeds
          const fallbackAdapter = createMockAdapter('fallback', true, 'success', undefined, {
            data: 'fallback-data',
            source: 'fallback',
          });

          // Register fallback chain
          fallbackStrategies.registerFallbackChain(dataType, {
            primary: primaryAdapter,
            fallbacks: [fallbackAdapter],
          });

          // Fetch with fallback
          const result = await fallbackStrategies.fetchWithFallback(
            dataType,
            async (adapter) => adapter.fetch({})
          );

          // Verify fallback was activated even for non-retryable errors
          expect(result.data).not.toBeNull();
          expect(result.usedFallback).toBe(true);
          expect(result.source).toBe('fallback');
          expect(primaryAdapter.fetch).toHaveBeenCalled();
          expect(fallbackAdapter.fetch).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: api-integration, Property 6: Fallback Activation**
   * **Validates: Requirements 5.5**
   * 
   * For any unconfigured adapter in the chain, the system should skip it
   * and try the next configured adapter.
   */
  it('should skip unconfigured adapters and try next in chain', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of adapters (2-5)
        fc.integer({ min: 2, max: 5 }),
        // Generate which adapters are configured (at least one must be)
        fc.array(fc.boolean(), { minLength: 2, maxLength: 5 }),
        // Generate data type name
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z]/gi, 'a') || 'test-data'),
        async (numAdapters, configuredFlags, dataType) => {
          // Ensure at least one adapter is configured
          const flags = configuredFlags.slice(0, numAdapters);
          if (!flags.some(f => f)) {
            flags[flags.length - 1] = true;
          }

          // Find first configured adapter index
          const firstConfiguredIndex = flags.findIndex(f => f);
          
          // Create adapters
          const adapters: DataAdapter[] = flags.map((configured, i) => 
            createMockAdapter(
              `adapter-${i}`,
              configured,
              configured ? 'success' : 'fail',
              undefined,
              { data: `data-from-adapter-${i}`, source: `adapter-${i}` }
            )
          );

          // Register fallback chain
          fallbackStrategies.registerFallbackChain(dataType, {
            primary: adapters[0],
            fallbacks: adapters.slice(1),
          });

          // Fetch with fallback
          const result = await fallbackStrategies.fetchWithFallback(
            dataType,
            async (adapter) => adapter.fetch({})
          );

          // Verify result came from first configured adapter
          expect(result.data).not.toBeNull();
          expect(result.source).toBe(`adapter-${firstConfiguredIndex}`);
          
          // If first configured is not primary, usedFallback should be true
          if (firstConfiguredIndex > 0) {
            expect(result.usedFallback).toBe(true);
          }

          // Verify unconfigured adapters were not called (fetch should not be called)
          adapters.forEach((adapter, i) => {
            if (!flags[i]) {
              expect(adapter.fetch).not.toHaveBeenCalled();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: api-integration, Property 6: Fallback Activation**
   * **Validates: Requirements 5.5**
   * 
   * For any data type without a registered fallback chain, the system
   * should return null with appropriate warning.
   */
  it('should return null with warning when no fallback chain is configured', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random data type name
        fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-z]/gi, 'a') || 'unknown-type'),
        async (dataType) => {
          // Don't register any fallback chain
          
          // Fetch with fallback
          const result = await fallbackStrategies.fetchWithFallback(
            dataType,
            async () => ({ data: 'test' })
          );

          // Verify result
          expect(result.data).toBeNull();
          expect(result.usedFallback).toBe(false);
          expect(result.warnings).toContain(`No fallback chain configured for ${dataType}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: api-integration, Property 6: Fallback Activation**
   * **Validates: Requirements 5.5**
   * 
   * For any successful primary source fetch, the system should not
   * attempt any fallback sources.
   */
  it('should not activate fallback when primary source succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of fallback adapters (1-5)
        fc.integer({ min: 1, max: 5 }),
        // Generate data type name
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z]/gi, 'a') || 'test-data'),
        // Generate return data
        fc.string({ minLength: 1, maxLength: 50 }),
        async (numFallbacks, dataType, returnData) => {
          // Create primary adapter that succeeds
          const primaryAdapter = createMockAdapter('primary', true, 'success', undefined, {
            data: returnData,
            source: 'primary',
          });
          
          // Create fallback adapters
          const fallbackAdapters: DataAdapter[] = [];
          for (let i = 0; i < numFallbacks; i++) {
            fallbackAdapters.push(
              createMockAdapter(`fallback-${i}`, true, 'success')
            );
          }

          // Register fallback chain
          fallbackStrategies.registerFallbackChain(dataType, {
            primary: primaryAdapter,
            fallbacks: fallbackAdapters,
          });

          // Fetch with fallback
          const result = await fallbackStrategies.fetchWithFallback(
            dataType,
            async (adapter) => adapter.fetch({})
          );

          // Verify primary succeeded and no fallbacks were called
          expect(result.data).toEqual({ data: returnData, source: 'primary' });
          expect(result.usedFallback).toBe(false);
          expect(result.source).toBe('primary');
          expect(primaryAdapter.fetch).toHaveBeenCalled();
          
          // Verify no fallbacks were called
          fallbackAdapters.forEach((adapter) => {
            expect(adapter.fetch).not.toHaveBeenCalled();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: api-integration, Property 6: Fallback Activation**
   * **Validates: Requirements 5.5**
   * 
   * For any fallback chain, warnings should accumulate for each failed adapter.
   */
  it('should accumulate warnings for each failed adapter in chain', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of failing adapters before success (1-4)
        fc.integer({ min: 1, max: 4 }),
        // Generate data type name
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z]/gi, 'a') || 'test-data'),
        async (numFailingAdapters, dataType) => {
          // Create adapters - all fail except the last one
          const adapters: DataAdapter[] = [];
          
          for (let i = 0; i < numFailingAdapters; i++) {
            adapters.push(createMockAdapter(`adapter-${i}`, true, 'fail'));
          }
          
          // Add one successful adapter at the end
          adapters.push(createMockAdapter('success-adapter', true, 'success', undefined, {
            data: 'success-data',
            source: 'success-adapter',
          }));

          // Register fallback chain
          fallbackStrategies.registerFallbackChain(dataType, {
            primary: adapters[0],
            fallbacks: adapters.slice(1),
          });

          // Fetch with fallback
          const result = await fallbackStrategies.fetchWithFallback(
            dataType,
            async (adapter) => adapter.fetch({})
          );

          // Verify warnings accumulated for each failed adapter
          expect(result.warnings.length).toBeGreaterThanOrEqual(numFailingAdapters);
          
          // Each failed adapter should have a warning
          for (let i = 0; i < numFailingAdapters; i++) {
            const hasWarning = result.warnings.some(w => w.includes(`adapter-${i}`));
            expect(hasWarning).toBe(true);
          }
          
          // Verify success
          expect(result.data).not.toBeNull();
          expect(result.usedFallback).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
