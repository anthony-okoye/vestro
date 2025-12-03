import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  StockCandidate,
  ScreeningFilters,
} from "../types";
import { validateScreeningFilters } from "../validation";
import { FinvizAdapter, StockScreenResult } from "../data-adapters/finviz-adapter";

/**
 * StockScreeningProcessor (Step 4)
 * Accepts screening filters and queries stock screener
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export class StockScreeningProcessor implements StepProcessor {
  stepId = 4;
  stepName = "Stock Screening";
  isOptional = false;

  private finvizAdapter: FinvizAdapter;

  constructor(finvizAdapter?: FinvizAdapter) {
    this.finvizAdapter = finvizAdapter || new FinvizAdapter();
  }

  /**
   * Validate screening filter inputs
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const filters: ScreeningFilters = {
      marketCap: inputs.marketCap,
      dividendYieldMin: inputs.dividendYieldMin,
      peRatioMax: inputs.peRatioMax,
      sector: inputs.sector,
      minPrice: inputs.minPrice,
      maxPrice: inputs.maxPrice,
    };

    return validateScreeningFilters(filters);
  }

  /**
   * Execute stock screening
   * Requirements: 4.5, 4.6
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

      // Build screening filters
      const filters: ScreeningFilters = {
        marketCap: inputs.marketCap as "large" | "mid" | "small" | undefined,
        dividendYieldMin: inputs.dividendYieldMin as number | undefined,
        peRatioMax: inputs.peRatioMax as number | undefined,
        sector: inputs.sector as string | undefined,
        minPrice: inputs.minPrice as number | undefined,
        maxPrice: inputs.maxPrice as number | undefined,
      };

      // Requirement 4.5: Query Finviz adapter with filters
      let screenResults: StockScreenResult[] = [];
      try {
        screenResults = await this.finvizAdapter.screenStocks(filters);
      } catch (error) {
        errors.push(`Failed to screen stocks: ${(error as Error).message}`);
        return {
          success: false,
          errors,
        };
      }

      if (screenResults.length === 0) {
        warnings.push("No stocks found matching the specified criteria");
      }

      // Requirement 4.6: Transform to stock shortlist format
      const stockShortlist: StockCandidate[] = screenResults.map((result) =>
        this.transformToStockCandidate(result)
      );

      return {
        success: true,
        stockShortlist,
        filters, // Include filters in output for reference
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(`Failed to execute stock screening: ${(error as Error).message}`);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Transform StockScreenResult to StockCandidate format
   * Requirement 4.6: Return stock shortlist with ticker, company name, sector, dividend yield, and PE ratio
   */
  private transformToStockCandidate(result: StockScreenResult): StockCandidate {
    // Determine market cap category based on value
    let marketCapCategory: "large" | "mid" | "small";
    if (result.marketCap >= 10000000000) {
      // >= $10B
      marketCapCategory = "large";
    } else if (result.marketCap >= 2000000000) {
      // >= $2B
      marketCapCategory = "mid";
    } else {
      marketCapCategory = "small";
    }

    return {
      ticker: result.ticker,
      companyName: result.companyName,
      sector: result.sector,
      dividendYield: result.dividendYield,
      peRatio: result.peRatio,
      marketCap: marketCapCategory,
    };
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "marketCap",
        type: "string",
        required: false,
        description: "Market capitalization filter: large, mid, or small",
      },
      {
        name: "dividendYieldMin",
        type: "number",
        required: false,
        description: "Minimum dividend yield percentage",
      },
      {
        name: "peRatioMax",
        type: "number",
        required: false,
        description: "Maximum price-to-earnings ratio",
      },
      {
        name: "sector",
        type: "string",
        required: false,
        description: "Sector name to filter by",
      },
      {
        name: "minPrice",
        type: "number",
        required: false,
        description: "Minimum stock price",
      },
      {
        name: "maxPrice",
        type: "number",
        required: false,
        description: "Maximum stock price",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      stockShortlist: {
        type: "StockCandidate[]",
        description: "Filtered list of stock candidates matching criteria",
      },
      filters: {
        type: "ScreeningFilters",
        description: "The filters that were applied",
      },
    };
  }
}
