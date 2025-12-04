/**
 * API Error handling for data adapters
 * Provides consistent error types and logging across all API integrations
 * Requirements: 5.1
 */

/**
 * Base API error class with consistent structure
 */
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public retryable: boolean,
    public originalError?: Error
  ) {
    super(message);
    this.name = "APIError";
    
    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      provider: this.provider,
      retryable: this.retryable,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * Configuration error - Missing or invalid API keys
 * Not retryable - requires configuration fix
 */
export class ConfigurationError extends APIError {
  constructor(message: string, provider: string, originalError?: Error) {
    super(message, "CONFIGURATION_ERROR", provider, false, originalError);
    this.name = "ConfigurationError";
  }
}

/**
 * Rate limit error - API rate limits exceeded
 * Retryable after waiting the specified time
 */
export class RateLimitError extends APIError {
  constructor(
    message: string,
    provider: string,
    public retryAfter?: number,
    originalError?: Error
  ) {
    super(message, "RATE_LIMIT_ERROR", provider, true, originalError);
    this.name = "RateLimitError";
  }

  /**
   * Get suggested wait time in seconds
   */
  getRetryAfterSeconds(): number {
    return this.retryAfter || 60; // Default to 60 seconds
  }
}

/**
 * Network error - Connection failures, timeouts
 * Retryable with exponential backoff
 */
export class NetworkError extends APIError {
  constructor(message: string, provider: string, originalError?: Error) {
    super(message, "NETWORK_ERROR", provider, true, originalError);
    this.name = "NetworkError";
  }
}

/**
 * Validation error - Invalid API responses or data
 * Not retryable - indicates data quality issue
 */
export class ValidationError extends APIError {
  constructor(message: string, provider: string, originalError?: Error) {
    super(message, "VALIDATION_ERROR", provider, false, originalError);
    this.name = "ValidationError";
  }
}

/**
 * Not found error - Symbol or data not found
 * Not retryable - data doesn't exist
 */
export class NotFoundError extends APIError {
  constructor(message: string, provider: string, originalError?: Error) {
    super(message, "NOT_FOUND_ERROR", provider, false, originalError);
    this.name = "NotFoundError";
  }
}

/**
 * Error logging utility
 * Logs errors with request details for debugging and monitoring
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorLog: Array<{
    error: APIError;
    timestamp: Date;
    context?: Record<string, any>;
  }> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an API error with context
   * @param error - The API error to log
   * @param context - Additional context (endpoint, params, etc.)
   */
  log(error: APIError, context?: Record<string, any>): void {
    const logEntry = {
      error,
      timestamp: new Date(),
      context,
    };

    this.errorLog.push(logEntry);

    // Console logging for development
    console.error(
      `[${error.provider}] ${error.name}: ${error.message}`,
      {
        code: error.code,
        retryable: error.retryable,
        context,
        stack: error.stack,
      }
    );

    // In production, this would send to a logging service
    // e.g., Sentry, DataDog, CloudWatch, etc.
  }

  /**
   * Get all logged errors
   */
  getErrors(): Array<{
    error: APIError;
    timestamp: Date;
    context?: Record<string, any>;
  }> {
    return [...this.errorLog];
  }

  /**
   * Get errors for a specific provider
   */
  getErrorsByProvider(provider: string): Array<{
    error: APIError;
    timestamp: Date;
    context?: Record<string, any>;
  }> {
    return this.errorLog.filter((entry) => entry.error.provider === provider);
  }

  /**
   * Clear error log
   */
  clear(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byProvider: Record<string, number>;
    byType: Record<string, number>;
    retryable: number;
    nonRetryable: number;
  } {
    const stats = {
      total: this.errorLog.length,
      byProvider: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      retryable: 0,
      nonRetryable: 0,
    };

    this.errorLog.forEach((entry) => {
      const { error } = entry;

      // Count by provider
      stats.byProvider[error.provider] =
        (stats.byProvider[error.provider] || 0) + 1;

      // Count by type
      stats.byType[error.name] = (stats.byType[error.name] || 0) + 1;

      // Count retryable vs non-retryable
      if (error.retryable) {
        stats.retryable++;
      } else {
        stats.nonRetryable++;
      }
    });

    return stats;
  }
}

/**
 * Helper function to create appropriate error from generic Error
 * @param error - Generic error
 * @param provider - API provider name
 * @returns Appropriate APIError subclass
 */
export function createAPIError(error: Error, provider: string): APIError {
  const message = error.message.toLowerCase();

  // Check for configuration errors
  if (
    message.includes("api key") ||
    message.includes("configuration") ||
    message.includes("missing") ||
    message.includes("invalid key")
  ) {
    return new ConfigurationError(error.message, provider, error);
  }

  // Check for rate limit errors
  if (
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("too many requests")
  ) {
    return new RateLimitError(error.message, provider, undefined, error);
  }

  // Check for network errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    message.includes("fetch failed") ||
    message.includes("connection")
  ) {
    return new NetworkError(error.message, provider, error);
  }

  // Check for not found errors
  if (
    message.includes("not found") ||
    message.includes("404") ||
    message.includes("no data")
  ) {
    return new NotFoundError(error.message, provider, error);
  }

  // Check for validation errors
  if (
    message.includes("invalid") ||
    message.includes("validation") ||
    message.includes("parse") ||
    message.includes("malformed")
  ) {
    return new ValidationError(error.message, provider, error);
  }

  // Default to generic APIError (retryable)
  return new APIError(error.message, "UNKNOWN_ERROR", provider, true, error);
}
