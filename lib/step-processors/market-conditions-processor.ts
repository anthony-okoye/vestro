import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  MacroSnapshot,
} from "../types";
import { FederalReserveAdapter } from "../data-adapters/federal-reserve-adapter";
import { CNBCAdapter } from "../data-adapters/cnbc-adapter";
import { BloombergAdapter } from "../data-adapters/bloomberg-adapter";

/**
 * MarketConditionsProcessor (Step 2)
 * Fetches macro economic data and generates market snapshot using FRED API
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * API Integration: Uses FRED API adapter for economic indicators (Requirement 6.1)
 */
export class MarketConditionsProcessor implements StepProcessor {
  stepId = 2;
  stepName = "Market Conditions";
  isOptional = false;

  private federalReserveAdapter: FederalReserveAdapter;
  private cnbcAdapter: CNBCAdapter;
  private bloombergAdapter: BloombergAdapter;

  constructor(
    federalReserveAdapter?: FederalReserveAdapter,
    cnbcAdapter?: CNBCAdapter,
    bloombergAdapter?: BloombergAdapter
  ) {
    // Initialize FRED adapter with API key from environment
    // Requirement 6.1: Use FRED API adapter for macroeconomic data
    this.federalReserveAdapter = federalReserveAdapter || new FederalReserveAdapter();
    this.cnbcAdapter = cnbcAdapter || new CNBCAdapter();
    this.bloombergAdapter = bloombergAdapter || new BloombergAdapter();
  }

  /**
   * Validate inputs - no user inputs required for this step
   */
  validateInputs(_inputs: StepInputs): ValidationResult {
    // This step doesn't require user inputs
    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Execute market conditions analysis
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   */
  async execute(
    _inputs: StepInputs,
    _context: WorkflowContext
  ): Promise<StepOutputs> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Fetch all economic data in parallel for better performance
      // Requirements 2.2, 2.3, 2.4, 2.5
      const [interestRateResult, inflationRateResult, unemploymentRateResult, marketTrendResult] = 
        await Promise.allSettled([
          this.federalReserveAdapter.fetchInterestRate(),
          this.federalReserveAdapter.fetchInflationRate(),
          this.federalReserveAdapter.fetchUnemploymentRate(),
          this.fetchMarketTrendWithFallback(),
        ]);

      // Requirement 2.2: Extract interest rate data
      let interestRate = 0;
      if (interestRateResult.status === "fulfilled") {
        interestRate = interestRateResult.value;
      } else {
        warnings.push(`Failed to fetch interest rate: ${interestRateResult.reason?.message || "Unknown error"}`);
      }

      // Requirement 2.3: Extract inflation rate data
      let inflationRate = 0;
      if (inflationRateResult.status === "fulfilled") {
        inflationRate = inflationRateResult.value;
      } else {
        warnings.push(`Failed to fetch inflation rate: ${inflationRateResult.reason?.message || "Unknown error"}`);
      }

      // Requirement 2.4: Extract unemployment rate data
      let unemploymentRate = 0;
      if (unemploymentRateResult.status === "fulfilled") {
        unemploymentRate = unemploymentRateResult.value;
      } else {
        warnings.push(`Failed to fetch unemployment rate: ${unemploymentRateResult.reason?.message || "Unknown error"}`);
      }

      // Requirement 2.5: Determine market trend classification
      let marketTrend: "bullish" | "bearish" | "neutral" = "neutral";
      if (marketTrendResult.status === "fulfilled") {
        marketTrend = marketTrendResult.value;
      } else {
        warnings.push(`Failed to fetch market trend: ${marketTrendResult.reason?.message || "Unknown error"}`);
      }

      // Requirement 2.6: Generate macro snapshot with summary
      const summary = this.generateSummary(
        interestRate,
        inflationRate,
        unemploymentRate,
        marketTrend
      );

      const macroSnapshot: MacroSnapshot = {
        interestRate,
        inflationRate,
        unemploymentRate,
        marketTrend,
        summary,
        fetchedAt: new Date(),
      };

      return {
        success: true,
        macroSnapshot,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(`Failed to fetch market conditions: ${(error as Error).message}`);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Fetch market trend with fallback from Bloomberg to CNBC
   */
  private async fetchMarketTrendWithFallback(): Promise<"bullish" | "bearish" | "neutral"> {
    try {
      // Try Bloomberg first
      return await this.bloombergAdapter.determineMarketTrend();
    } catch (error) {
      // Fallback to CNBC
      try {
        const cnbcData = await this.cnbcAdapter.fetchMarketTrend();
        return cnbcData.trend;
      } catch (cnbcError) {
        // Return neutral as final fallback
        return "neutral";
      }
    }
  }

  /**
   * Generate human-readable summary of macro conditions
   */
  private generateSummary(
    interestRate: number,
    inflationRate: number,
    unemploymentRate: number,
    marketTrend: "bullish" | "bearish" | "neutral"
  ): string {
    const parts: string[] = [];

    // Interest rate assessment
    if (interestRate > 5) {
      parts.push(`Interest rates are elevated at ${interestRate.toFixed(2)}%`);
    } else if (interestRate > 2) {
      parts.push(`Interest rates are moderate at ${interestRate.toFixed(2)}%`);
    } else {
      parts.push(`Interest rates are low at ${interestRate.toFixed(2)}%`);
    }

    // Inflation assessment
    if (inflationRate > 4) {
      parts.push(`inflation is high at ${inflationRate.toFixed(2)}%`);
    } else if (inflationRate > 2) {
      parts.push(`inflation is moderate at ${inflationRate.toFixed(2)}%`);
    } else {
      parts.push(`inflation is low at ${inflationRate.toFixed(2)}%`);
    }

    // Unemployment assessment
    if (unemploymentRate > 6) {
      parts.push(`unemployment is elevated at ${unemploymentRate.toFixed(1)}%`);
    } else if (unemploymentRate > 4) {
      parts.push(`unemployment is moderate at ${unemploymentRate.toFixed(1)}%`);
    } else {
      parts.push(`unemployment is low at ${unemploymentRate.toFixed(1)}%`);
    }

    // Market trend
    const trendDescriptions = {
      bullish: "Markets are showing positive momentum",
      bearish: "Markets are experiencing downward pressure",
      neutral: "Markets are trading sideways",
    };
    parts.push(trendDescriptions[marketTrend]);

    return parts.join(", ") + ".";
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    // No user inputs required for this step
    return [];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      macroSnapshot: {
        type: "MacroSnapshot",
        description: "Economic indicators and market conditions snapshot",
      },
    };
  }
}
