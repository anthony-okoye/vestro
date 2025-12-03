import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  Fundamentals,
} from "../types";
import { SECEdgarAdapter } from "../data-adapters/sec-edgar-adapter";
import { MorningstarAdapter } from "../data-adapters/morningstar-adapter";

/**
 * FundamentalAnalysisProcessor (Step 5)
 * Fetches and analyzes fundamental financial metrics
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */
export class FundamentalAnalysisProcessor implements StepProcessor {
  stepId = 5;
  stepName = "Fundamental Analysis";
  isOptional = false;

  private secEdgarAdapter: SECEdgarAdapter;
  private morningstarAdapter: MorningstarAdapter;

  constructor(
    secEdgarAdapter?: SECEdgarAdapter,
    morningstarAdapter?: MorningstarAdapter
  ) {
    this.secEdgarAdapter = secEdgarAdapter || new SECEdgarAdapter();
    this.morningstarAdapter = morningstarAdapter || new MorningstarAdapter();
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
   * Execute fundamental analysis
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
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

      // Fetch data from multiple sources in parallel for better performance
      // Requirements 5.1, 5.2
      const [filingsResult, fundamentalsResult] = await Promise.allSettled([
        this.secEdgarAdapter.fetchFilings(ticker, "10-K"),
        this.morningstarAdapter.fetchFundamentals(ticker),
      ]);

      // Requirement 5.1: Process SEC EDGAR filings
      let filings: any[] = [];
      if (filingsResult.status === "fulfilled") {
        filings = filingsResult.value;
        if (filings.length === 0) {
          warnings.push(`No 10-K filings found for ${ticker} in SEC EDGAR`);
        }
      } else {
        warnings.push(
          `Failed to fetch SEC filings: ${filingsResult.reason?.message || "Unknown error"}`
        );
      }

      // Requirement 5.2: Process Morningstar fundamentals
      let fundamentals: Fundamentals;
      if (fundamentalsResult.status === "fulfilled") {
        fundamentals = fundamentalsResult.value;
      } else {
        errors.push(
          `Failed to fetch fundamentals from Morningstar: ${fundamentalsResult.reason?.message || "Unknown error"}`
        );
        return {
          success: false,
          errors,
        };
      }

      // Requirements 5.3, 5.4, 5.5, 5.6, 5.7: Extract metrics
      // These are already extracted by the Morningstar adapter:
      // - revenueGrowth5y (Requirement 5.3)
      // - earningsGrowth5y (Requirement 5.4)
      // - profitMargin (Requirement 5.5)
      // - debtToEquity (Requirement 5.6)
      // - freeCashFlow (Requirement 5.7)

      // Add filing information to the output
      const latestFiling = filings.length > 0 ? filings[0] : null;

      // Requirement 5.8: Generate Fundamentals data
      return {
        success: true,
        fundamentals,
        filings: {
          count: filings.length,
          latestFiling: latestFiling
            ? {
                formType: latestFiling.formType,
                filingDate: latestFiling.filingDate,
                reportDate: latestFiling.reportDate,
              }
            : null,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute fundamental analysis: ${(error as Error).message}`
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
      fundamentals: {
        type: "Fundamentals",
        description: "Financial metrics including growth, margins, and cash flow",
      },
      filings: {
        type: "object",
        description: "SEC filing information",
      },
    };
  }
}
