import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  MonitoringPlan,
} from "../types";

/**
 * MonitoringSetupProcessor (Step 12)
 * Configures monitoring alerts and review schedules
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export class MonitoringSetupProcessor implements StepProcessor {
  stepId = 12;
  stepName = "Monitoring Setup";
  isOptional = false;

  /**
   * Validate inputs - requires alert app, review frequency, and ticker
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    // Requirement 12.1: Accept alert application name
    if (!inputs.alertApp || typeof inputs.alertApp !== "string") {
      errors.push("Alert application name is required");
    }

    if (inputs.alertApp && inputs.alertApp.trim().length === 0) {
      errors.push("Alert application name cannot be empty");
    }

    // Requirement 12.2: Accept review frequency
    if (!inputs.reviewFrequency || typeof inputs.reviewFrequency !== "string") {
      errors.push("Review frequency is required");
    }

    const validFrequencies = ["quarterly", "yearly"];
    if (inputs.reviewFrequency && !validFrequencies.includes(inputs.reviewFrequency)) {
      errors.push(
        `Invalid review frequency. Must be one of: ${validFrequencies.join(", ")}`
      );
    }

    // Require ticker for monitoring
    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    // Optional: validate alert thresholds if provided
    if (inputs.priceDropPercent !== undefined) {
      if (typeof inputs.priceDropPercent !== "number") {
        errors.push("Price drop percent must be a number");
      } else if (inputs.priceDropPercent <= 0 || inputs.priceDropPercent > 100) {
        errors.push("Price drop percent must be between 0 and 100");
      }
    }

    if (inputs.priceGainPercent !== undefined) {
      if (typeof inputs.priceGainPercent !== "number") {
        errors.push("Price gain percent must be a number");
      } else if (inputs.priceGainPercent <= 0 || inputs.priceGainPercent > 1000) {
        errors.push("Price gain percent must be between 0 and 1000");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute monitoring setup
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   */
  async execute(
    inputs: StepInputs,
    _context: WorkflowContext
  ): Promise<StepOutputs> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate inputs first
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      const alertApp = inputs.alertApp as string;
      const reviewFrequency = inputs.reviewFrequency as "quarterly" | "yearly";
      const ticker = inputs.ticker as string;
      const priceDropPercent = inputs.priceDropPercent as number | undefined;
      const priceGainPercent = inputs.priceGainPercent as number | undefined;

      // Requirement 12.3: Configure price alerts based on user preferences
      const priceAlertsSet = true; // Simulated configuration

      // Requirement 12.4: Schedule earnings review dates based on review frequency
      const earningsReviewPlanned = true; // Simulated scheduling
      const nextReviewDate = this.calculateNextReviewDate(reviewFrequency);

      // Build alert thresholds if provided
      const alertThresholds = (priceDropPercent !== undefined || priceGainPercent !== undefined)
        ? {
            priceDropPercent,
            priceGainPercent,
          }
        : undefined;

      // Requirement 12.5: Generate Monitoring Plan
      const monitoringPlan: MonitoringPlan = {
        ticker,
        priceAlertsSet,
        earningsReviewPlanned,
        reviewFrequency,
        nextReviewDate,
        alertThresholds,
      };

      // Add informational message
      warnings.push(
        `Monitoring configured for ${ticker} using ${alertApp}. Next review scheduled for ${nextReviewDate.toLocaleDateString()}.`
      );

      return {
        success: true,
        monitoringPlan,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Failed to execute monitoring setup: ${(error as Error).message}`
      );
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Calculate next review date based on frequency
   */
  private calculateNextReviewDate(frequency: "quarterly" | "yearly"): Date {
    const now = new Date();
    const nextReview = new Date(now);

    if (frequency === "quarterly") {
      // Add 3 months
      nextReview.setMonth(now.getMonth() + 3);
    } else if (frequency === "yearly") {
      // Add 1 year
      nextReview.setFullYear(now.getFullYear() + 1);
    }

    return nextReview;
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "alertApp",
        type: "string",
        required: true,
        description: "Name of the alert application (e.g., 'Yahoo Finance', 'Robinhood')",
      },
      {
        name: "reviewFrequency",
        type: "string",
        required: true,
        description: "Review frequency: 'quarterly' or 'yearly'",
      },
      {
        name: "ticker",
        type: "string",
        required: true,
        description: "Stock ticker symbol to monitor",
      },
      {
        name: "priceDropPercent",
        type: "number",
        required: false,
        description: "Alert threshold for price drops (percentage)",
      },
      {
        name: "priceGainPercent",
        type: "number",
        required: false,
        description: "Alert threshold for price gains (percentage)",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      monitoringPlan: {
        type: "MonitoringPlan",
        description: "Monitoring configuration with alerts and review schedule",
      },
    };
  }
}
