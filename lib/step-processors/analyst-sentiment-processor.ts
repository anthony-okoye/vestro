import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  AnalystSummary,
} from "../types";
import { TipRanksAdapter } from "../data-adapters/tipranks-adapter";
import { MarketBeatAdapter } from "../data-adapters/marketbeat-adapter";
import { AnalysisEngine } from "../analysis-engine";

/**
 * AnalystSentimentProcessor (Step 9)
 * Gathers and aggregates analyst sentiment from multiple sources
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */
export class AnalystSentimentProcessor implements StepProcessor {
  stepId = 9;
  stepName = "Analyst Sentiment";
  isOptional = false;

  private tipRanksAdapter: TipRanksAdapter;
  private marketBeatAdapter: MarketBeatAdapter;
  private analysisEngine: AnalysisEngine;

  constructor(
    tipRanksAdapter?: TipRanksAdapter,
    marketBeatAdapter?: MarketBeatAdapter,
    analysisEngine?: AnalysisEngine
  ) {
    this.tipRanksAdapter = tipRanksAdapter || new TipRanksAdapter();
    this.marketBeatAdapter = marketBeatAdapter || new MarketBeatAdapter();
    this.analysisEngine = analysisEngine || new AnalysisEngine();
  }

  /**
   * Validate inputs - requires ticker symbol
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    if (inputs.ticker && inputs.ticker.length > 10) {
      errors.push("Ticker symbol must be 10 characters or less");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute analyst sentiment aggregation
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
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

      // Fetch analyst ratings from multiple sources in parallel
      // Requirements 9.1, 9.2
      const [tipRanksResult, marketBeatResult] = await Promise.allSettled([
        this.tipRanksAdapter.fetchAnalystRatings(ticker),
        this.marketBeatAdapter.fetchAnalystRatings(ticker),
      ]);

      // Collect all analyst ratings from multiple sources
      const allRatings: any[] = [];

      // Requirement 9.1: Process TipRanks ratings
      if (tipRanksResult.status === "fulfilled") {
        allRatings.push(...tipRanksResult.value.ratings);
      } else {
        warnings.push(
          `Failed to fetch TipRanks data: ${tipRanksResult.reason?.message || "Unknown error"}`
        );
      }

      // Requirement 9.2: Process MarketBeat ratings
      if (marketBeatResult.status === "fulfilled") {
        allRatings.push(...marketBeatResult.value.ratings);
      } else {
        warnings.push(
          `Failed to fetch MarketBeat data: ${marketBeatResult.reason?.message || "Unknown error"}`
        );
      }

      // Check if we have any ratings
      if (allRatings.length === 0) {
        errors.push("No analyst ratings available from any source");
        return {
          success: false,
          errors,
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      }

      // Requirement 9.3, 9.4, 9.5, 9.6, 9.7: Use analysis engine to aggregate sentiment
      // Count buy, hold, sell recommendations and calculate average target
      const analystSummary: AnalystSummary = this.analysisEngine.aggregateAnalystSentiment(
        allRatings,
        ticker
      );

      return {
        success: true,
        analystSummary,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute analyst sentiment analysis: ${(error as Error).message}`
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
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      analystSummary: {
        type: "AnalystSummary",
        description: "Aggregated analyst sentiment with buy/hold/sell counts and consensus",
      },
    };
  }
}
