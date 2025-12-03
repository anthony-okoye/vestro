import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  BuyRecommendation,
  RiskModel,
  InvestmentProfile,
} from "../types";
import { AnalysisEngine } from "../analysis-engine";

/**
 * PositionSizingProcessor (Step 10)
 * Calculates appropriate position sizes based on portfolio and risk model
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export class PositionSizingProcessor implements StepProcessor {
  stepId = 10;
  stepName = "Position Sizing";
  isOptional = false;

  private analysisEngine: AnalysisEngine;

  constructor(analysisEngine?: AnalysisEngine) {
    this.analysisEngine = analysisEngine || new AnalysisEngine();
  }

  /**
   * Validate inputs - requires portfolio size, risk model, ticker, and entry price
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    // Requirement 10.1: Accept portfolio size
    if (!inputs.portfolioSize || typeof inputs.portfolioSize !== "number") {
      errors.push("Portfolio size is required and must be a number");
    }

    if (inputs.portfolioSize && inputs.portfolioSize <= 0) {
      errors.push("Portfolio size must be greater than 0");
    }

    // Requirement 10.2: Accept risk model selection
    if (!inputs.riskModel || typeof inputs.riskModel !== "string") {
      errors.push("Risk model is required");
    }

    const validRiskModels = ["conservative", "balanced", "aggressive"];
    if (inputs.riskModel && !validRiskModels.includes(inputs.riskModel)) {
      errors.push(
        `Invalid risk model. Must be one of: ${validRiskModels.join(", ")}`
      );
    }

    // Require ticker and entry price for position sizing
    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    if (!inputs.entryPrice || typeof inputs.entryPrice !== "number") {
      errors.push("Entry price is required and must be a number");
    }

    if (inputs.entryPrice && inputs.entryPrice <= 0) {
      errors.push("Entry price must be greater than 0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute position sizing calculation
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
   */
  async execute(
    inputs: StepInputs,
    context: WorkflowContext
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

      const portfolioSize = inputs.portfolioSize as number;
      const riskModelType = inputs.riskModel as "conservative" | "balanced" | "aggressive";
      const ticker = inputs.ticker as string;
      const entryPrice = inputs.entryPrice as number;

      // Get user profile from context for risk tolerance
      const userProfile = context.userProfile;
      if (!userProfile) {
        errors.push("User profile not found in context");
        return {
          success: false,
          errors,
        };
      }

      // Build risk model based on type (Requirement 10.2)
      const riskModel: RiskModel = this.buildRiskModel(riskModelType);

      // Create a temporary investment profile with the portfolio size
      const profileForCalculation: InvestmentProfile = {
        ...userProfile,
        capitalAvailable: portfolioSize,
      };

      // Requirement 10.3, 10.4, 10.5, 10.6: Use analysis engine to calculate position sizes
      // Generate buy recommendations with ticker, shares, entry price, and order type
      const buyRecommendation: BuyRecommendation = this.analysisEngine.determinePositionSize(
        profileForCalculation,
        entryPrice,
        riskModel,
        ticker
      );

      // Add warnings if position size is very small
      if (buyRecommendation.sharesToBuy === 0) {
        warnings.push(
          "Position size calculation resulted in 0 shares. Consider increasing portfolio size or choosing a lower-priced stock."
        );
      }

      return {
        success: true,
        buyRecommendation,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute position sizing: ${(error as Error).message}`
      );
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Build risk model configuration based on type
   */
  private buildRiskModel(type: "conservative" | "balanced" | "aggressive"): RiskModel {
    switch (type) {
      case "conservative":
        return {
          type: "conservative",
          maxPositionSize: 5, // 5% max per position
          diversificationMin: 20, // Minimum 20 positions
        };
      case "balanced":
        return {
          type: "balanced",
          maxPositionSize: 10, // 10% max per position
          diversificationMin: 10, // Minimum 10 positions
        };
      case "aggressive":
        return {
          type: "aggressive",
          maxPositionSize: 15, // 15% max per position
          diversificationMin: 7, // Minimum 7 positions
        };
      default:
        return {
          type: "balanced",
          maxPositionSize: 10,
          diversificationMin: 10,
        };
    }
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "portfolioSize",
        type: "number",
        required: true,
        description: "Total portfolio size in dollars",
      },
      {
        name: "riskModel",
        type: "string",
        required: true,
        description: "Risk model: 'conservative', 'balanced', or 'aggressive'",
      },
      {
        name: "ticker",
        type: "string",
        required: true,
        description: "Stock ticker symbol",
      },
      {
        name: "entryPrice",
        type: "number",
        required: true,
        description: "Entry price per share",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      buyRecommendation: {
        type: "BuyRecommendation",
        description: "Position sizing recommendation with shares, price, and order type",
      },
    };
  }
}
