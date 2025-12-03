/**
 * AuditLogger for tracking workflow executions and data source access
 * Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5
 */

export enum AuditEventType {
  WORKFLOW_STARTED = "workflow_started",
  WORKFLOW_COMPLETED = "workflow_completed",
  WORKFLOW_FAILED = "workflow_failed",
  STEP_STARTED = "step_started",
  STEP_COMPLETED = "step_completed",
  STEP_FAILED = "step_failed",
  STEP_SKIPPED = "step_skipped",
  DATA_SOURCE_ACCESS = "data_source_access",
  DATA_SOURCE_ERROR = "data_source_error",
  USER_ACTION = "user_action",
  STATE_CHANGE = "state_change",
}

export interface AuditEvent {
  eventId: string;
  eventType: AuditEventType;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  stepId?: number;
  stepName?: string;
  dataSource?: string;
  operation?: string;
  success: boolean;
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
  errorMessage?: string;
}

/**
 * AuditLogger class for comprehensive workflow tracking
 */
export class AuditLogger {
  private events: AuditEvent[] = [];
  private eventIdCounter = 0;

  /**
   * Log workflow execution start
   * Requirement: Log all workflow executions with timestamps
   */
  logWorkflowStarted(sessionId: string, userId: string, metadata?: Record<string, any>): void {
    this.logEvent({
      eventType: AuditEventType.WORKFLOW_STARTED,
      sessionId,
      userId,
      success: true,
      metadata,
    });
  }

  /**
   * Log workflow execution completion
   */
  logWorkflowCompleted(
    sessionId: string,
    userId: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.WORKFLOW_COMPLETED,
      sessionId,
      userId,
      success: true,
      duration,
      metadata,
    });
  }

  /**
   * Log workflow execution failure
   */
  logWorkflowFailed(
    sessionId: string,
    userId: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.WORKFLOW_FAILED,
      sessionId,
      userId,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Log step execution start
   */
  logStepStarted(
    sessionId: string,
    stepId: number,
    stepName: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.STEP_STARTED,
      sessionId,
      stepId,
      stepName,
      success: true,
      metadata,
    });
  }

  /**
   * Log step execution completion
   */
  logStepCompleted(
    sessionId: string,
    stepId: number,
    stepName: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.STEP_COMPLETED,
      sessionId,
      stepId,
      stepName,
      success: true,
      duration,
      metadata,
    });
  }

  /**
   * Log step execution failure
   */
  logStepFailed(
    sessionId: string,
    stepId: number,
    stepName: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.STEP_FAILED,
      sessionId,
      stepId,
      stepName,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Log step skipped (for optional steps)
   */
  logStepSkipped(
    sessionId: string,
    stepId: number,
    stepName: string,
    reason: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.STEP_SKIPPED,
      sessionId,
      stepId,
      stepName,
      success: true,
      metadata: {
        ...metadata,
        reason,
      },
    });
  }

  /**
   * Log data source access
   * Requirement: Track data source access and errors
   */
  logDataSourceAccess(
    sessionId: string,
    dataSource: string,
    operation: string,
    success: boolean,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.DATA_SOURCE_ACCESS,
      sessionId,
      dataSource,
      operation,
      success,
      duration,
      metadata,
    });
  }

  /**
   * Log data source error
   * Requirement: Track data source access and errors
   */
  logDataSourceError(
    sessionId: string,
    dataSource: string,
    operation: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.DATA_SOURCE_ERROR,
      sessionId,
      dataSource,
      operation,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Log user action
   */
  logUserAction(
    sessionId: string,
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.USER_ACTION,
      sessionId,
      userId,
      operation: action,
      success: true,
      metadata,
    });
  }

  /**
   * Log state change
   */
  logStateChange(
    sessionId: string,
    operation: string,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: AuditEventType.STATE_CHANGE,
      sessionId,
      operation,
      success,
      metadata,
    });
  }

  /**
   * Get all audit events
   */
  getEvents(): AuditEvent[] {
    return [...this.events];
  }

  /**
   * Get events by session ID
   */
  getEventsBySession(sessionId: string): AuditEvent[] {
    return this.events.filter((event) => event.sessionId === sessionId);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: AuditEventType): AuditEvent[] {
    return this.events.filter((event) => event.eventType === eventType);
  }

  /**
   * Get events by date range
   */
  getEventsByDateRange(startDate: Date, endDate: Date): AuditEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  /**
   * Get failed events
   */
  getFailedEvents(): AuditEvent[] {
    return this.events.filter((event) => !event.success);
  }

  /**
   * Get data source access statistics
   */
  getDataSourceStats(): Record<string, { total: number; successful: number; failed: number }> {
    const stats: Record<string, { total: number; successful: number; failed: number }> = {};

    this.events
      .filter(
        (event) =>
          event.eventType === AuditEventType.DATA_SOURCE_ACCESS ||
          event.eventType === AuditEventType.DATA_SOURCE_ERROR
      )
      .forEach((event) => {
        if (!event.dataSource) return;

        if (!stats[event.dataSource]) {
          stats[event.dataSource] = { total: 0, successful: 0, failed: 0 };
        }

        stats[event.dataSource].total++;
        if (event.success) {
          stats[event.dataSource].successful++;
        } else {
          stats[event.dataSource].failed++;
        }
      });

    return stats;
  }

  /**
   * Get workflow execution statistics
   */
  getWorkflowStats(): {
    total: number;
    completed: number;
    failed: number;
    averageDuration: number;
  } {
    const workflowEvents = this.events.filter(
      (event) =>
        event.eventType === AuditEventType.WORKFLOW_COMPLETED ||
        event.eventType === AuditEventType.WORKFLOW_FAILED
    );

    const completed = workflowEvents.filter(
      (event) => event.eventType === AuditEventType.WORKFLOW_COMPLETED
    );

    const failed = workflowEvents.filter(
      (event) => event.eventType === AuditEventType.WORKFLOW_FAILED
    );

    const totalDuration = completed.reduce((sum, event) => sum + (event.duration || 0), 0);
    const averageDuration = completed.length > 0 ? totalDuration / completed.length : 0;

    return {
      total: workflowEvents.length,
      completed: completed.length,
      failed: failed.length,
      averageDuration,
    };
  }

  /**
   * Clear all audit events (use with caution)
   */
  clearEvents(): void {
    this.events = [];
    this.eventIdCounter = 0;
  }

  /**
   * Export events to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Internal method to log an event
   */
  private logEvent(eventData: Omit<AuditEvent, "eventId" | "timestamp">): void {
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date(),
      ...eventData,
    };

    this.events.push(event);

    // In production, this would send to a logging service or database
    this.writeToConsole(event);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    this.eventIdCounter++;
    return `AE-${Date.now()}-${this.eventIdCounter.toString().padStart(6, "0")}`;
  }

  /**
   * Write event to console (in production, this would go to a logging service)
   */
  private writeToConsole(event: AuditEvent): void {
    const logLevel = event.success ? "info" : "error";
    const logMessage = `[AUDIT] ${event.eventType} - Session: ${event.sessionId}${
      event.stepName ? ` - Step: ${event.stepName}` : ""
    }${event.dataSource ? ` - Source: ${event.dataSource}` : ""}`;

    if (logLevel === "error") {
      console.error(logMessage, {
        eventId: event.eventId,
        timestamp: event.timestamp,
        errorMessage: event.errorMessage,
        metadata: event.metadata,
      });
    } else {
      console.log(logMessage, {
        eventId: event.eventId,
        timestamp: event.timestamp,
        duration: event.duration,
        metadata: event.metadata,
      });
    }
  }
}
