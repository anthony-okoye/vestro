import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  SectorRanking,
} from "../types";
import { YahooFinanceAdapter, SectorData } from "../data-adapters/yahoo-finance-adapter";
import { AnalysisEngine } from "../analysis-engine";

/**
 * SectorIdentificationProcessor (Step 3)
 * Fetches sector data and generates sector rankings
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export class SectorIdentificationProcessor implements StepProcessor {
  stepId = 3;
  stepName = "Sector Identification";
  isOptional = false;

  private yahooFinanceAdapter: YahooFinanceAdapter;
  private analysisEngine: AnalysisEngine;

  constructor(
    yahooFinanceAdapter?: YahooFinanceAdapter,
    analysisEngine?: AnalysisEngine
  ) {
    this.yahooFinanceAdapter = yahooFinanceAdapter || new YahooFinanceAdapter();
    this.analysisEngine = analysisEngine || new AnalysisEngine();
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
   * Execute sector identification and ranking
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async execute(
    _inputs: StepInputs,
    _context: WorkflowContext
  ): Promise<StepOutputs> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Requirement 3.1: Fetch sector data from Yahoo Finance
      let sectorData: SectorData[] = [];
      try {
        sectorData = await this.yahooFinanceAdapter.fetchSectorData();
      } catch (error) {
        errors.push(`Failed to fetch sector data: ${(error as Error).message}`);
        return {
          success: false,
          errors,
        };
      }

      if (sectorData.length === 0) {
        errors.push("No sector data available");
        return {
          success: false,
          errors,
        };
      }

      // Requirement 3.2: Fetch industry reports
      // Note: In a real implementation, this would fetch from McKinsey, PwC, etc.
      // For now, we'll create mock industry reports based on sector data
      const industryReports = this.generateMockIndustryReports(sectorData);

      // Transform sector data to format expected by analysis engine
      const transformedSectorData = sectorData.map((sector) => ({
        sectorName: sector.sectorName,
        growthRate: sector.performance1Year, // Use 1-year performance as growth proxy
        marketCap: sector.marketCap,
        momentum: this.calculateMomentum(sector),
      }));

      // Requirements 3.3, 3.4, 3.5: Use analysis engine to score and rank sectors
      const sectorRankings: SectorRanking[] = this.analysisEngine.scoreSectors(
        transformedSectorData,
        industryReports
      );

      if (sectorRankings.length === 0) {
        warnings.push("No sector rankings generated");
      }

      return {
        success: true,
        sectorRankings,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(`Failed to identify sectors: ${(error as Error).message}`);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Calculate momentum score from sector performance data
   */
  private calculateMomentum(sector: SectorData): number {
    // Momentum is calculated as a weighted average of recent performance
    // Short-term performance weighted more heavily
    const weights = {
      day: 0.1,
      week: 0.2,
      month: 0.3,
      threeMonth: 0.4,
    };

    const momentum =
      sector.performance1Day * weights.day +
      sector.performance1Week * weights.week +
      sector.performance1Month * weights.month +
      sector.performance3Month * weights.threeMonth;

    // Normalize to 0-1 range (assuming -20% to +20% is typical range)
    const normalized = (momentum + 20) / 40;
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Generate mock industry reports
   * In production, this would fetch from McKinsey, PwC, etc.
   */
  private generateMockIndustryReports(sectorData: SectorData[]): any[] {
    return sectorData.map((sector) => {
      // Generate outlook based on performance
      let outlook: string;
      if (sector.performance1Year > 15) {
        outlook = "Strong growth expected with favorable market conditions";
      } else if (sector.performance1Year > 5) {
        outlook = "Moderate growth with stable fundamentals";
      } else if (sector.performance1Year > -5) {
        outlook = "Neutral outlook with mixed indicators";
      } else {
        outlook = "Challenging conditions with headwinds";
      }

      return {
        sector: sector.sectorName,
        outlook,
        growthForecast: sector.performance1Year * 0.8, // Assume future growth is 80% of past
        riskLevel: sector.performance1Month < -5 ? "high" : "moderate",
      };
    });
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
      sectorRankings: {
        type: "SectorRanking[]",
        description: "Ranked list of sectors with scores and rationale",
      },
    };
  }
}
