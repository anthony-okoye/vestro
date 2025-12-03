/**
 * ErrorHandler for the ResurrectionStockPicker workflow
 * Handles error categorization, retry logic, and user-friendly messaging
 * Requirements: 2.1, 3.1, 4.5, 5.1, 5.2, 6.1, 6.2, 7.1, 9.1, 9.2
 */

export interface ErrorResponse {
  userMessage: string;
  technicalDetails?: string;
  canContinue: boolean;
  suggestedAction: string;
  retryable: boolean;
}

export interface ErrorContext {
  sessionId: string;
  stepId: number;
  operation: string;
  timestamp: Date;
}

export enum ErrorCategory {
  VALIDATION = "validation",
  DATA_SOURCE = "data_source",
  ANALYSIS = "analysis",
  STATE = "state",
  NETWORK = "network",
  UNKNOWN = "unknown",
}

/**
 * ErrorHandler class for managing errors throughout the workflow
 */
export class ErrorHandler {
  private errorLog: Array<{ error: Error; context: ErrorContext }> = [];

  /**
   * Handle an error and return a structured response
   * Requirement: Generate user-friendly error messages
   */
  handleError(error: Error, context: ErrorContext): ErrorResponse {
    // Log the error
    this.logError(error, context);

    // Categorize the error
    const category = this.categorizeError(error);

    // Generate appropriate response based on category
    switch (category) {
      case ErrorCategory.VALIDATION:
        return this.handleValidationError(error, context);

      case ErrorCategory.DATA_SOURCE:
        return this.handleDataSourceError(error, context);

      case ErrorCategory.ANALYSIS:
        return this.handleAnalysisError(error, context);

      case ErrorCategory.STATE:
        return this.handleStateError(error, context);

      case ErrorCategory.NETWORK:
        return this.handleNetworkError(error, context);

      default:
        return this.handleUnknownError(error, context);
    }
  }

  /**
   * Log error for debugging and monitoring
   * Requirement: All errors logged for debugging and monitoring
   */
  logError(error: Error, context: ErrorContext): void {
    this.errorLog.push({ error, context });

    // In production, this would send to a logging service
    console.error(
      `[${context.timestamp.toISOString()}] Error in step ${context.stepId} (${context.operation}):`,
      {
        sessionId: context.sessionId,
        errorMessage: error.message,
        errorStack: error.stack,
      }
    );
  }

  /**
   * Determine if an error should be retried
   * Requirement: Data source failures - Retry up to 3 times with exponential backoff
   */
  shouldRetry(error: Error): boolean {
    const category = this.categorizeError(error);

    // Retry data source and network errors
    if (category === ErrorCategory.DATA_SOURCE || category === ErrorCategory.NETWORK) {
      return true;
    }

    // Check for specific retryable error messages
    const retryablePatterns = [
      /timeout/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /rate limit/i,
      /429/i, // HTTP 429 Too Many Requests
      /503/i, // HTTP 503 Service Unavailable
      /502/i, // HTTP 502 Bad Gateway
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): Array<{ error: Error; context: ErrorContext }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Categorize error based on message and type
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    // Validation errors
    if (
      message.includes("required") ||
      message.includes("invalid") ||
      message.includes("must be") ||
      message.includes("validation")
    ) {
      return ErrorCategory.VALIDATION;
    }

    // Data source errors
    if (
      message.includes("failed to fetch") ||
      message.includes("data source") ||
      message.includes("adapter") ||
      message.includes("api")
    ) {
      return ErrorCategory.DATA_SOURCE;
    }

    // Network errors
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("etimedout") ||
      message.includes("http")
    ) {
      return ErrorCategory.NETWORK;
    }

    // Analysis errors
    if (
      message.includes("calculation") ||
      message.includes("analysis") ||
      message.includes("insufficient data")
    ) {
      return ErrorCategory.ANALYSIS;
    }

    // State errors
    if (
      message.includes("session") ||
      message.includes("not found") ||
      message.includes("state") ||
      message.includes("database")
    ) {
      return ErrorCategory.STATE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Handle validation errors
   * Requirement: Validation errors - Return immediately with clear user message
   */
  private handleValidationError(error: Error, _context: ErrorContext): ErrorResponse {
    return {
      userMessage: `Input validation failed: ${error.message}`,
      technicalDetails: error.stack,
      canContinue: false,
      suggestedAction: "Please correct the input and try again.",
      retryable: false,
    };
  }

  /**
   * Handle data source errors
   * Requirement: Data source failures - Retry up to 3 times with exponential backoff
   */
  private handleDataSourceError(error: Error, _context: ErrorContext): ErrorResponse {
    return {
      userMessage: "Unable to fetch data from external source. This may be a temporary issue.",
      technicalDetails: error.message,
      canContinue: true,
      suggestedAction: "The system will automatically retry. If the problem persists, try again later or skip this step if optional.",
      retryable: true,
    };
  }

  /**
   * Handle analysis errors
   * Requirement: Partial data - Continue with warnings if minimum data threshold met
   */
  private handleAnalysisError(error: Error, _context: ErrorContext): ErrorResponse {
    return {
      userMessage: "Analysis could not be completed with the available data.",
      technicalDetails: error.message,
      canContinue: true,
      suggestedAction: "You may proceed with limited results or try again with different inputs.",
      retryable: false,
    };
  }

  /**
   * Handle state errors
   * Requirement: Critical failures - Halt workflow and preserve state for recovery
   */
  private handleStateError(error: Error, _context: ErrorContext): ErrorResponse {
    return {
      userMessage: "A system error occurred while managing your workflow state.",
      technicalDetails: error.message,
      canContinue: false,
      suggestedAction: "Please contact support if this issue persists. Your progress has been saved.",
      retryable: false,
    };
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: Error, _context: ErrorContext): ErrorResponse {
    return {
      userMessage: "Network connection issue detected.",
      technicalDetails: error.message,
      canContinue: true,
      suggestedAction: "Please check your internet connection and try again.",
      retryable: true,
    };
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(error: Error, _context: ErrorContext): ErrorResponse {
    return {
      userMessage: "An unexpected error occurred.",
      technicalDetails: error.message,
      canContinue: false,
      suggestedAction: "Please try again. If the problem persists, contact support.",
      retryable: false,
    };
  }
}
