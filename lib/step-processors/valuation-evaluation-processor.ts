import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  ValuationMetrics,
} from "../types";
import { SimplyWallStAdapter } from "../data-adapters/simplywallst-adapter";
import { AnalysisEngine } from "../analysis-engine";

/**
 * ValuationEvaluationProcessor (Step 7)
 * Evaluates stock valuation and peer comparisons
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export class ValuationEvaluationProcessor implements StepProcessor {
  stepId = 7;
  stepName = "Valuation Evaluation";
  isOptional = false;

  private simplyWallStAdapter: SimplyWallStAdapter;
  private analysisEngine: AnalysisEngine;

  constructor(
    simplyWallStAdapter?: SimplyWallStAdapter,
    analysisEngine?: AnalysisEngine
  ) {
    this.simplyWallStAdapter = simplyWallStAdapter || new SimplyWallStAdapter();
    this.analysisEngine = analysisEngine || new AnalysisEngine();
  }

  /**
   * Validate inputs - requires ticker and optionally peer tickers
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    if (inputs.ticker && inputs.ticker.length > 10) {
      errors.push("Ticker symbol must be 10 characters or less");
    }

    if (inputs.peerTickers) {
      if (!Array.isArray(inputs.peerTickers)) {
        errors.push("Peer tickers must be an array");
      } else {
        for (const peer of inputs.peerTickers) {
          if (typeof peer !== "string" || peer.length > 10) {
            errors.push(`Invalid peer ticker: ${peer}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute valuation evaluation
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
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
      const peerTickers = (inputs.peerTickers as string[]) || [];

      // Requirement 7.1: Fetch valuation data from Simply Wall St
      let valuationData: any;
      try {
        valuationData = await this.simplyWallStAdapter.fetchValuationData(ticker);
      } catch (error) {
        errors.push(
          `Failed to fetch valuation data: ${(error as Error).message}`
        );
        return {
          success: false,
          errors,
        };
      }

      // Requirement 7.2: Accept comparison ticker symbols (from inputs)
      // Fetch peer data if peer tickers provided
      let peerData: any[] = [];
      if (peerTickers.length > 0) {
        for (const peerTicker of peerTickers) {
          try {
            const peerValuation = await this.simplyWallStAdapter.fetchValuationData(
              peerTicker
            );
            peerData.push({
              ticker: peerTicker,
              peRatio: peerValuation.peRatio,
              pbRatio: peerValuation.pbRatio,
              earningsPerShare: peerValuation.currentPrice / peerValuation.peRatio,
              bookValuePerShare: peerValuation.currentPrice / peerValuation.pbRatio,
            });
          } catch (error) {
            warnings.push(
              `Failed to fetch peer data for ${peerTicker}: ${(error as Error).message}`
            );
          }
        }
      }

      // Prepare fundamentals data for analysis engine
      const fundamentals = {
        ticker,
        peRatio: valuationData.peRatio,
        pbRatio: valuationData.pbRatio,
        price: valuationData.currentPrice,
        earningsPerShare: valuationData.currentPrice / valuationData.peRatio,
        bookValuePerShare: valuationData.currentPrice / valuationData.pbRatio,
      };

      // Requirements 7.3, 7.4, 7.5: Use analysis engine to calculate PE, PB ratios and peer comparison
      const valuationMetrics = this.analysisEngine.calculateValuations(
        fundamentals,
        peerData
      );

      // Requirement 7.6: Generate Valuations data
      return {
        success: true,
        valuationMetrics,
        additionalMetrics: {
          psRatio: valuationData.psRatio,
          pegRatio: valuationData.pegRatio,
          evToEbitda: valuationData.evToEbitda,
          priceToFreeCashFlow: valuationData.priceToFreeCashFlow,
          currentPrice: valuationData.currentPrice,
          upside: valuationData.upside,
          valuationScore: valuationData.valuationScore,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute valuation evaluation: ${(error as Error).message}`
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
        name: "peerTickers",
        type: "array",
        required: false,
        description: "Array of peer ticker symbols for comparison",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      valuationMetrics: {
        type: "ValuationMetrics",
        description: "PE and PB ratios with peer comparison analysis",
      },
      additionalMetrics: {
        type: "object",
        description: "Additional valuation metrics (PS, PEG, EV/EBITDA, etc.)",
      },
    };
  }
}
