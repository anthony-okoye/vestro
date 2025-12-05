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
import { FinancialModelingPrepAdapter } from "../data-adapters/fmp-adapter";
import { YahooFinanceAdapter } from "../data-adapters/yahoo-finance-adapter";

/**
 * FundamentalAnalysisProcessor (Step 5)
 * Fetches and analyzes fundamental financial metrics using API adapters
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 * API Integration: Uses FMP for financial statements (Requirement 6.2)
 */
export class FundamentalAnalysisProcessor implements StepProcessor {
  stepId = 5;
  stepName = "Fundamental Analysis";
  isOptional = false;

  private secEdgarAdapter: SECEdgarAdapter;
  private morningstarAdapter: MorningstarAdapter;
  private fmpAdapter: FinancialModelingPrepAdapter | null;
  private yahooFinanceAdapter: YahooFinanceAdapter;

  constructor(
    secEdgarAdapter?: SECEdgarAdapter,
    morningstarAdapter?: MorningstarAdapter,
    fmpAdapter?: FinancialModelingPrepAdapter,
    yahooFinanceAdapter?: YahooFinanceAdapter
  ) {
    this.secEdgarAdapter = secEdgarAdapter || new SECEdgarAdapter();
    this.morningstarAdapter = morningstarAdapter || new MorningstarAdapter();
    this.yahooFinanceAdapter = yahooFinanceAdapter || new YahooFinanceAdapter();
    
    // Initialize API adapters with fallback to null if not configured
    // Requirement 6.2: Use FMP adapter for financial statements
    try {
      this.fmpAdapter = fmpAdapter || new FinancialModelingPrepAdapter();
    } catch (error) {
      console.warn("FMP adapter not configured, will use fallback sources");
      this.fmpAdapter = null;
    }
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
   * Execute fundamental analysis using API adapters with fallback
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
   * API Integration: Requirement 6.2
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

      // Requirement 6.2: Try to fetch fundamentals from API adapters first
      let fundamentals: Fundamentals | null = null;
      
      // Try FMP adapter first for financial statements
      if (this.fmpAdapter && this.fmpAdapter.isConfigured()) {
        try {
          fundamentals = await this.fetchFundamentalsFromFMP(ticker);
          warnings.push(`Using Financial Modeling Prep API for ${ticker}`);
        } catch (error) {
          warnings.push(
            `FMP API failed: ${(error as Error).message}. Trying fallback sources...`
          );
        }
      }

      // Fallback to Yahoo Finance if FMP failed or not configured
      if (!fundamentals) {
        try {
          fundamentals = await this.fetchFundamentalsFromYahoo(ticker);
          warnings.push(`Using Yahoo Finance for ${ticker}`);
        } catch (yahooError) {
          warnings.push(
            `Yahoo Finance failed: ${(yahooError as Error).message}. Trying Morningstar...`
          );
          
          // Final fallback to Morningstar
          try {
            fundamentals = await this.morningstarAdapter.fetchFundamentals(ticker);
            warnings.push(`Using Morningstar (web scraping) for ${ticker}`);
          } catch (error) {
            errors.push(
              `Failed to fetch fundamentals from all sources (FMP, Yahoo Finance, Morningstar): ${(error as Error).message}`
            );
            return {
              success: false,
              errors,
            };
          }
        }
      }

      // Fetch SEC filings in parallel (optional data)
      const filingsResult = await Promise.allSettled([
        this.secEdgarAdapter.fetchFilings(ticker, "10-K"),
      ]);

      // Requirement 5.1: Process SEC EDGAR filings
      let filings: any[] = [];
      if (filingsResult[0].status === "fulfilled") {
        filings = filingsResult[0].value;
        if (filings.length === 0) {
          warnings.push(`No 10-K filings found for ${ticker} in SEC EDGAR`);
        }
      } else {
        warnings.push(
          `Failed to fetch SEC filings: ${filingsResult[0].reason?.message || "Unknown error"}`
        );
      }

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
   * Fetch fundamentals from FMP API
   * Requirement 6.2: Use FMP adapter for financial statements
   * Requirements 5.3, 5.4, 5.5, 5.6, 5.7: Extract metrics
   */
  private async fetchFundamentalsFromFMP(ticker: string): Promise<Fundamentals> {
    if (!this.fmpAdapter) {
      throw new Error("FMP adapter not configured");
    }

    // Fetch financial statements in parallel
    const [incomeStatements, balanceSheets, cashFlowStatements] = await Promise.all([
      this.fmpAdapter.getIncomeStatement(ticker, 'annual', 5),
      this.fmpAdapter.getBalanceSheet(ticker, 'annual', 5),
      this.fmpAdapter.getCashFlowStatement(ticker, 'annual', 5),
    ]);

    if (incomeStatements.length === 0) {
      throw new Error(`No financial data available for ${ticker}`);
    }

    // Calculate 5-year growth rates
    // Requirement 5.3: Revenue growth
    const revenueGrowth5y = this.calculateGrowthRate(
      incomeStatements.map(s => s.revenue)
    );

    // Requirement 5.4: Earnings growth
    const earningsGrowth5y = this.calculateGrowthRate(
      incomeStatements.map(s => s.netIncome)
    );

    // Requirement 5.5: Profit margin (most recent)
    const latestIncome = incomeStatements[0];
    const profitMargin = latestIncome.revenue > 0 
      ? (latestIncome.netIncome / latestIncome.revenue) * 100 
      : 0;

    // Requirement 5.6: Debt to equity (most recent)
    const latestBalance = balanceSheets[0];
    const debtToEquity = latestBalance.equity > 0 
      ? latestBalance.liabilities / latestBalance.equity 
      : 0;

    // Requirement 5.7: Free cash flow (most recent)
    const latestCashFlow = cashFlowStatements[0];
    const freeCashFlow = latestCashFlow.operatingCashFlow;

    return {
      ticker: ticker.toUpperCase(),
      revenueGrowth5y,
      earningsGrowth5y,
      profitMargin,
      debtToEquity,
      freeCashFlow,
      analyzedAt: new Date(),
    };
  }

  /**
   * Fetch fundamentals from Yahoo Finance API
   * Fallback source when FMP is not available
   */
  private async fetchFundamentalsFromYahoo(ticker: string): Promise<Fundamentals> {
    const financialData = await this.yahooFinanceAdapter.fetchFinancialData(ticker);

    return {
      ticker: financialData.ticker,
      revenueGrowth5y: financialData.revenueGrowth5y,
      earningsGrowth5y: financialData.earningsGrowth5y,
      profitMargin: financialData.profitMargin,
      debtToEquity: financialData.debtToEquity,
      freeCashFlow: financialData.freeCashFlow,
      analyzedAt: new Date(),
    };
  }

  /**
   * Calculate compound annual growth rate (CAGR) from a series of values
   * @param values - Array of values in reverse chronological order (newest first)
   * @returns CAGR as a percentage
   */
  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) {
      return 0;
    }

    // Filter out zero or negative values
    const validValues = values.filter(v => v > 0);
    if (validValues.length < 2) {
      return 0;
    }

    const endValue = validValues[0]; // Most recent
    const startValue = validValues[validValues.length - 1]; // Oldest
    const years = validValues.length - 1;

    if (startValue === 0) {
      return 0;
    }

    // CAGR formula: ((End Value / Start Value) ^ (1 / years)) - 1
    const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    return cagr;
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
