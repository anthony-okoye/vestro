import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  MoatAnalysis,
} from "../types";
import { ReutersAdapter } from "../data-adapters/reuters-adapter";
import { YahooFinanceAdapter } from "../data-adapters/yahoo-finance-adapter";
import { AnalysisEngine } from "../analysis-engine";

/**
 * CompetitivePositionProcessor (Step 6)
 * Analyzes company's competitive position and moat
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export class CompetitivePositionProcessor implements StepProcessor {
  stepId = 6;
  stepName = "Competitive Position";
  isOptional = false;

  private reutersAdapter: ReutersAdapter;
  private yahooFinanceAdapter: YahooFinanceAdapter;
  private analysisEngine: AnalysisEngine;

  constructor(
    reutersAdapter?: ReutersAdapter,
    yahooFinanceAdapter?: YahooFinanceAdapter,
    analysisEngine?: AnalysisEngine
  ) {
    this.reutersAdapter = reutersAdapter || new ReutersAdapter();
    this.yahooFinanceAdapter = yahooFinanceAdapter || new YahooFinanceAdapter();
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
   * Execute competitive position analysis
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
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

      // Fetch company profiles from multiple sources in parallel
      // Requirements 6.1, 6.2
      const [reutersResult, yahooResult] = await Promise.allSettled([
        this.reutersAdapter.fetchCompanyProfile(ticker),
        this.yahooFinanceAdapter.fetchCompanyProfile(ticker),
      ]);

      // Requirement 6.1: Process Reuters profile
      let reutersProfile: any = null;
      if (reutersResult.status === "fulfilled") {
        reutersProfile = reutersResult.value;
      } else {
        warnings.push(
          `Failed to fetch Reuters profile: ${reutersResult.reason?.message || "Unknown error"}`
        );
      }

      // Requirement 6.2: Process Yahoo Finance profile
      let yahooProfile: any = null;
      if (yahooResult.status === "fulfilled") {
        yahooProfile = yahooResult.value;
      } else {
        warnings.push(
          `Failed to fetch Yahoo Finance profile: ${yahooResult.reason?.message || "Unknown error"}`
        );
      }

      // Merge profile data from both sources
      const companyProfile = this.mergeProfiles(
        ticker,
        reutersProfile,
        yahooProfile
      );

      if (!companyProfile) {
        errors.push(
          "Failed to fetch company profile from any data source"
        );
        return {
          success: false,
          errors,
        };
      }

      // Requirements 6.3, 6.4, 6.5, 6.6, 6.7: Use analysis engine to generate moat analysis
      const moatAnalysis = this.analysisEngine.analyzeMoat(companyProfile);

      return {
        success: true,
        moatAnalysis,
        companyProfile: {
          name: companyProfile.name,
          sector: companyProfile.sector,
          industry: companyProfile.industry,
          description: companyProfile.description,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute competitive position analysis: ${(error as Error).message}`
      );
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Merge company profiles from multiple sources
   */
  private mergeProfiles(
    ticker: string,
    reutersProfile: any,
    yahooProfile: any
  ): any {
    if (!reutersProfile && !yahooProfile) {
      return null;
    }

    // Prefer Reuters data, fallback to Yahoo Finance
    return {
      ticker,
      name: reutersProfile?.name || yahooProfile?.name || ticker,
      sector: reutersProfile?.sector || yahooProfile?.sector || "Unknown",
      industry: reutersProfile?.industry || yahooProfile?.industry || "Unknown",
      description:
        reutersProfile?.description ||
        yahooProfile?.description ||
        reutersProfile?.businessSummary ||
        yahooProfile?.longBusinessSummary ||
        "",
      website: reutersProfile?.website || yahooProfile?.website,
      employees: reutersProfile?.employees || yahooProfile?.fullTimeEmployees,
      marketCap: reutersProfile?.marketCap || yahooProfile?.marketCap,
      // Patent information (if available)
      patents: yahooProfile?.patents || reutersProfile?.patents,
      // Brand information (if available)
      brandValue: yahooProfile?.brandValue,
      brandRecognition: yahooProfile?.brandRecognition,
      // Customer information (if available)
      customers: yahooProfile?.customers || {
        count: yahooProfile?.customerCount,
        retentionRate: yahooProfile?.customerRetention,
        concentration: yahooProfile?.customerConcentration,
      },
      // Cost structure information (if available)
      costStructure: {
        operatingMargin: yahooProfile?.operatingMargin || yahooProfile?.profitMargin,
        efficiency: yahooProfile?.operationalEfficiency,
      },
    };
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
      moatAnalysis: {
        type: "MoatAnalysis",
        description: "Analysis of competitive advantages and moat strength",
      },
      companyProfile: {
        type: "object",
        description: "Basic company information",
      },
    };
  }
}
