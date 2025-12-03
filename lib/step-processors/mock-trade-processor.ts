import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  TradeConfirmation,
} from "../types";
import { randomBytes } from "crypto";

/**
 * MockTradeProcessor (Step 11)
 * Simulates trade execution for educational purposes
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export class MockTradeProcessor implements StepProcessor {
  stepId = 11;
  stepName = "Mock Trade Execution";
  isOptional = false;

  /**
   * Validate inputs - requires broker platform, ticker, quantity, and price
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    // Requirement 11.1: Accept broker platform name
    if (!inputs.brokerPlatform || typeof inputs.brokerPlatform !== "string") {
      errors.push("Broker platform name is required");
    }

    if (inputs.brokerPlatform && inputs.brokerPlatform.trim().length === 0) {
      errors.push("Broker platform name cannot be empty");
    }

    // Require ticker for trade execution
    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    // Require quantity
    if (!inputs.quantity || typeof inputs.quantity !== "number") {
      errors.push("Quantity is required and must be a number");
    }

    if (inputs.quantity && inputs.quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }

    if (inputs.quantity && !Number.isInteger(inputs.quantity)) {
      errors.push("Quantity must be a whole number");
    }

    // Require price
    if (!inputs.price || typeof inputs.price !== "number") {
      errors.push("Price is required and must be a number");
    }

    if (inputs.price && inputs.price <= 0) {
      errors.push("Price must be greater than 0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute mock trade simulation
   * Requirements: 11.1, 11.2, 11.3, 11.4
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

      const brokerPlatform = inputs.brokerPlatform as string;
      const ticker = inputs.ticker as string;
      const quantity = inputs.quantity as number;
      const price = inputs.price as number;

      // Requirement 11.2: Simulate trade execution with specified ticker, quantity, and price
      // Add a small delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Requirement 11.3: Generate a unique confirmation identifier
      const confirmationId = this.generateConfirmationId(brokerPlatform);

      // Requirement 11.4: Generate Trade Confirmation with mock flag set to true
      const tradeConfirmation: TradeConfirmation = {
        ticker,
        quantity,
        price,
        confirmationId,
        executedAt: new Date(),
        isMock: true, // Always true for educational purposes
      };

      // Add educational warning
      warnings.push(
        "This is a MOCK trade for educational purposes only. No actual trade has been executed."
      );

      return {
        success: true,
        tradeConfirmation,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Failed to execute mock trade: ${(error as Error).message}`
      );
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Generate a unique confirmation ID
   * Format: MOCK-{BROKER_PREFIX}-{TIMESTAMP}-{RANDOM}
   */
  private generateConfirmationId(brokerPlatform: string): string {
    // Extract first 3 letters of broker platform (uppercase)
    const brokerPrefix = brokerPlatform
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "X");

    // Generate timestamp component
    const timestamp = Date.now().toString(36).toUpperCase();

    // Generate random component
    const randomComponent = randomBytes(4).toString("hex").toUpperCase();

    return `MOCK-${brokerPrefix}-${timestamp}-${randomComponent}`;
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "brokerPlatform",
        type: "string",
        required: true,
        description: "Name of the broker platform (e.g., 'E*TRADE', 'TD Ameritrade')",
      },
      {
        name: "ticker",
        type: "string",
        required: true,
        description: "Stock ticker symbol to trade",
      },
      {
        name: "quantity",
        type: "number",
        required: true,
        description: "Number of shares to trade",
      },
      {
        name: "price",
        type: "number",
        required: true,
        description: "Price per share",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      tradeConfirmation: {
        type: "TradeConfirmation",
        description: "Mock trade confirmation with confirmation ID and execution details",
      },
    };
  }
}
