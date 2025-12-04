import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  APIError,
  ConfigurationError,
  RateLimitError,
  NetworkError,
  ValidationError,
  NotFoundError,
  ErrorLogger,
  createAPIError,
} from '../api-error';

describe('ErrorLogger', () => {
  let errorLogger: ErrorLogger;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorLogger = ErrorLogger.getInstance();
    errorLogger.clear();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: api-integration, Property 4: Error Logging**
     * **Validates: Requirements 5.1**
     * 
     * For any API request failure, the adapter should log the error with request
     * details including endpoint, parameters, and error message.
     */
    it('should log any API error with request details', () => {
      fc.assert(
        fc.property(
          // Generate random error message
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate random error code
          fc.constantFrom('CONFIGURATION_ERROR', 'RATE_LIMIT_ERROR', 'NETWORK_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND_ERROR', 'UNKNOWN_ERROR'),
          // Generate random provider name
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // Generate random retryable flag
          fc.boolean(),
          // Generate random context with endpoint and params
          fc.record({
            endpoint: fc.string({ minLength: 1, maxLength: 100 }),
            params: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
              fc.oneof(fc.string(), fc.integer(), fc.boolean())
            ),
          }),
          (message, code, provider, retryable, context) => {
            // Clear previous logs
            errorLogger.clear();
            
            // Create an API error
            const error = new APIError(message, code, provider, retryable);
            
            // Log the error with context
            errorLogger.log(error, context);
            
            // Verify the error was logged
            const errors = errorLogger.getErrors();
            expect(errors.length).toBe(1);
            
            const logEntry = errors[0];
            
            // Verify error details are preserved
            expect(logEntry.error.message).toBe(message);
            expect(logEntry.error.code).toBe(code);
            expect(logEntry.error.provider).toBe(provider);
            expect(logEntry.error.retryable).toBe(retryable);
            
            // Verify context is preserved (endpoint and params)
            expect(logEntry.context).toBeDefined();
            expect(logEntry.context?.endpoint).toBe(context.endpoint);
            expect(logEntry.context?.params).toEqual(context.params);
            
            // Verify timestamp is set
            expect(logEntry.timestamp).toBeInstanceOf(Date);
            expect(logEntry.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
            
            // Verify console.error was called with provider and error info
            expect(consoleSpy).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 4: Error Logging**
     * **Validates: Requirements 5.1**
     * 
     * For any sequence of errors logged, getErrorsByProvider should return
     * exactly the errors for that provider.
     */
    it('should correctly filter errors by provider', () => {
      fc.assert(
        fc.property(
          // Generate a list of errors with random providers
          fc.array(
            fc.record({
              message: fc.string({ minLength: 1, maxLength: 100 }),
              provider: fc.constantFrom('Alpha Vantage', 'FMP', 'Polygon', 'FRED'),
              code: fc.constantFrom('NETWORK_ERROR', 'VALIDATION_ERROR', 'RATE_LIMIT_ERROR'),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          // Provider to filter by
          fc.constantFrom('Alpha Vantage', 'FMP', 'Polygon', 'FRED'),
          (errorData, filterProvider) => {
            // Clear previous logs
            errorLogger.clear();
            
            // Log all errors
            errorData.forEach(({ message, provider, code }) => {
              const error = new APIError(message, code, provider, true);
              errorLogger.log(error);
            });
            
            // Get errors by provider
            const filteredErrors = errorLogger.getErrorsByProvider(filterProvider);
            
            // Count expected errors for this provider
            const expectedCount = errorData.filter(e => e.provider === filterProvider).length;
            
            // Verify count matches
            expect(filteredErrors.length).toBe(expectedCount);
            
            // Verify all returned errors are from the correct provider
            filteredErrors.forEach(entry => {
              expect(entry.error.provider).toBe(filterProvider);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 4: Error Logging**
     * **Validates: Requirements 5.1**
     * 
     * For any set of logged errors, getStats should return accurate counts.
     */
    it('should maintain accurate error statistics', () => {
      fc.assert(
        fc.property(
          // Generate a list of errors
          fc.array(
            fc.record({
              message: fc.string({ minLength: 1, maxLength: 100 }),
              provider: fc.constantFrom('Alpha Vantage', 'FMP', 'Polygon', 'FRED'),
              errorType: fc.constantFrom('ConfigurationError', 'RateLimitError', 'NetworkError', 'ValidationError', 'NotFoundError'),
            }),
            { minLength: 0, maxLength: 30 }
          ),
          (errorData) => {
            // Clear previous logs
            errorLogger.clear();
            
            // Create and log errors based on type
            errorData.forEach(({ message, provider, errorType }) => {
              let error: APIError;
              switch (errorType) {
                case 'ConfigurationError':
                  error = new ConfigurationError(message, provider);
                  break;
                case 'RateLimitError':
                  error = new RateLimitError(message, provider);
                  break;
                case 'NetworkError':
                  error = new NetworkError(message, provider);
                  break;
                case 'ValidationError':
                  error = new ValidationError(message, provider);
                  break;
                case 'NotFoundError':
                  error = new NotFoundError(message, provider);
                  break;
                default:
                  error = new APIError(message, 'UNKNOWN', provider, true);
              }
              errorLogger.log(error);
            });
            
            // Get stats
            const stats = errorLogger.getStats();
            
            // Verify total count
            expect(stats.total).toBe(errorData.length);
            
            // Verify provider counts sum to total
            const providerSum = Object.values(stats.byProvider).reduce((a, b) => a + b, 0);
            expect(providerSum).toBe(errorData.length);
            
            // Verify type counts sum to total
            const typeSum = Object.values(stats.byType).reduce((a, b) => a + b, 0);
            expect(typeSum).toBe(errorData.length);
            
            // Verify retryable + nonRetryable = total
            expect(stats.retryable + stats.nonRetryable).toBe(errorData.length);
            
            // Verify each provider count matches expected
            const expectedByProvider: Record<string, number> = {};
            errorData.forEach(e => {
              expectedByProvider[e.provider] = (expectedByProvider[e.provider] || 0) + 1;
            });
            Object.entries(expectedByProvider).forEach(([provider, count]) => {
              expect(stats.byProvider[provider]).toBe(count);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: api-integration, Property 4: Error Logging**
     * **Validates: Requirements 5.1**
     * 
     * For any error, toJSON should produce a valid JSON representation
     * containing all required fields.
     */
    it('should serialize any API error to JSON with all required fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.constantFrom('CONFIGURATION_ERROR', 'RATE_LIMIT_ERROR', 'NETWORK_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND_ERROR'),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.boolean(),
          (message, code, provider, retryable) => {
            const error = new APIError(message, code, provider, retryable);
            const json = error.toJSON();
            
            // Verify all required fields are present
            expect(json).toHaveProperty('name');
            expect(json).toHaveProperty('message');
            expect(json).toHaveProperty('code');
            expect(json).toHaveProperty('provider');
            expect(json).toHaveProperty('retryable');
            
            // Verify values match
            expect(json.name).toBe('APIError');
            expect(json.message).toBe(message);
            expect(json.code).toBe(code);
            expect(json.provider).toBe(provider);
            expect(json.retryable).toBe(retryable);
            
            // Verify it's valid JSON (can be stringified and parsed)
            const stringified = JSON.stringify(json);
            const parsed = JSON.parse(stringified);
            expect(parsed.message).toBe(message);
            expect(parsed.code).toBe(code);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('createAPIError Helper', () => {
    /**
     * **Feature: api-integration, Property 4: Error Logging**
     * **Validates: Requirements 5.1**
     * 
     * For any error message containing specific keywords, createAPIError
     * should return the appropriate error type.
     */
    it('should create appropriate error type based on message keywords', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Alpha Vantage', 'FMP', 'Polygon', 'FRED'),
          (provider) => {
            // Test configuration error keywords
            const configError = createAPIError(new Error('API key is missing'), provider);
            expect(configError).toBeInstanceOf(ConfigurationError);
            expect(configError.retryable).toBe(false);
            
            // Test rate limit error keywords
            const rateLimitError = createAPIError(new Error('Rate limit exceeded - 429'), provider);
            expect(rateLimitError).toBeInstanceOf(RateLimitError);
            expect(rateLimitError.retryable).toBe(true);
            
            // Test network error keywords
            const networkError = createAPIError(new Error('Network timeout occurred'), provider);
            expect(networkError).toBeInstanceOf(NetworkError);
            expect(networkError.retryable).toBe(true);
            
            // Test not found error keywords
            const notFoundError = createAPIError(new Error('Symbol not found - 404'), provider);
            expect(notFoundError).toBeInstanceOf(NotFoundError);
            expect(notFoundError.retryable).toBe(false);
            
            // Test validation error keywords
            const validationError = createAPIError(new Error('Invalid response format'), provider);
            expect(validationError).toBeInstanceOf(ValidationError);
            expect(validationError.retryable).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
