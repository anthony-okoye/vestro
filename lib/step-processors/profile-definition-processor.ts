import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  InvestmentProfile,
} from "../types";
import { validateInvestmentProfile } from "../validation";
import { StateManager } from "../state-manager";

/**
 * ProfileDefinitionProcessor (Step 1)
 * Accepts and validates investment profile inputs and stores them
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export class ProfileDefinitionProcessor implements StepProcessor {
  stepId = 1;
  stepName = "Profile Definition";
  isOptional = false;

  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Validate investment profile inputs
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    return validateInvestmentProfile({
      riskTolerance: inputs.riskTolerance,
      investmentHorizonYears: inputs.investmentHorizonYears,
      capitalAvailable: inputs.capitalAvailable,
      longTermGoals: inputs.longTermGoals,
    });
  }

  /**
   * Execute profile definition step
   * Requirement: 1.5 - Store the Investment Profile
   */
  async execute(
    inputs: StepInputs,
    context: WorkflowContext
  ): Promise<StepOutputs> {
    try {
      // Validate inputs first
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Create investment profile
      const profile: InvestmentProfile = {
        userId: context.userId,
        riskTolerance: inputs.riskTolerance as "low" | "medium" | "high",
        investmentHorizonYears: inputs.investmentHorizonYears as number,
        capitalAvailable: inputs.capitalAvailable as number,
        longTermGoals: inputs.longTermGoals as
          | "steady growth"
          | "dividend income"
          | "capital preservation",
        createdAt: new Date(),
      };

      // Store profile in state manager (Requirement 1.5)
      await this.stateManager.saveUserProfile(context.userId, profile);

      return {
        success: true,
        profile,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to save investment profile: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "riskTolerance",
        type: "string",
        required: true,
        description: "Risk tolerance level: low, medium, or high",
      },
      {
        name: "investmentHorizonYears",
        type: "number",
        required: true,
        description: "Investment horizon in years",
      },
      {
        name: "capitalAvailable",
        type: "number",
        required: true,
        description: "Capital available for investment",
      },
      {
        name: "longTermGoals",
        type: "string",
        required: true,
        description:
          "Investment goals: steady growth, dividend income, or capital preservation",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      profile: {
        type: "InvestmentProfile",
        description: "The created investment profile",
      },
    };
  }
}
