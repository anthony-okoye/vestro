import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  TechnicalSignals,
} from "../types";
import { TradingViewAdapter } from "../data-adapters/tradingview-adapter";

/**
 * TechnicalTrendsProcessor (Step 8) - Optional
 * Analyzes technical trends and chart patterns
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export class TechnicalTrendsProcessor implements StepProcessor {
  stepId = 8;
  stepName = "Technical Trends";
  isOptional = true; // Requirement 8.5: Mark as optional step

  private tradingViewAdapter: TradingViewAdapter;

  constructor(tradingViewAdapter?: TradingViewAdapter) {
    this.tradingViewAdapter = tradingViewAdapter || new TradingViewAdapter();
  }

  /**
   * Validate inputs - requires ticker and optionally indicator selection
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    if (inputs.ticker && inputs.ticker.length > 10) {
      errors.push("Ticker symbol must be 10 characters or less");
    }

    // Requirement 8.2: Accept indicator selection
    if (inputs.indicator) {
      const validIndicators = ["moving average", "RSI"];
      if (!validIndicators.includes(inputs.indicator)) {
        errors.push(
          `Invalid indicator. Must be one of: ${validIndicators.join(", ")}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute technical trends analysis
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
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

      const ticker = inputs.ticker as string;
      const indicator = inputs.indicator as "moving average" | "RSI" | undefined;

      // Requirement 8.1: Provide optional access to TradingView charting tools
      let technicalSignals: TechnicalSignals;
      try {
        technicalSignals = await this.tradingViewAdapter.fetchTechnicalSignals(
          ticker
        );
      } catch (error) {
        errors.push(
          `Failed to fetch technical signals: ${(error as Error).message}`
        );
        return {
          success: false,
          errors,
        };
      }

      // Requirement 8.3: Determine price trend
      // Already determined by the adapter (trend: upward, downward, or sideways)

      // Requirement 8.4: Detect moving average crossover
      // Already detected by the adapter (maCross: boolean)

      // Fetch specific indicator data if requested (Requirement 8.2)
      let indicatorData: any = null;
      if (indicator) {
        try {
          indicatorData = await this.tradingViewAdapter.fetchIndicator(
            ticker,
            indicator
          );
        } catch (error) {
          warnings.push(
            `Failed to fetch ${indicator} data: ${(error as Error).message}`
          );
        }
      }

      // Requirement 8.5: Generate Technical Signals
      return {
        success: true,
        technicalSignals,
        indicatorData: indicatorData || undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute technical trends analysis: ${(error as Error).message}`
      );
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "ticker",
        type: "string",
        required: true,
        description: "Stock ticker symbol to analyze",
      },
      {
        name: "indicator",
        type: "string",
        required: false,
        description: "Technical indicator to fetch: 'moving average' or 'RSI'",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      technicalSignals: {
        type: "TechnicalSignals",
        description: "Technical analysis signals including trend and MA crossover",
      },
      indicatorData: {
        type: "object",
        description: "Specific indicator data if requested",
      },
    };
  }
}
