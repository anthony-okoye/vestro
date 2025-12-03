import {
  StepProcessor as IStepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
} from "./types";

/**
 * BaseStepProcessor provides common functionality for all workflow steps
 * Each specific step processor should extend this class
 */
export abstract class BaseStepProcessor implements IStepProcessor {
  abstract stepId: number;
  abstract stepName: string;
  abstract isOptional: boolean;

  abstract validateInputs(inputs: StepInputs): ValidationResult;
  abstract execute(
    inputs: StepInputs,
    context: WorkflowContext
  ): Promise<StepOutputs>;
  abstract getRequiredInputs(): InputSchema[];
  abstract getOutputSchema(): OutputSchema;

  /**
   * Helper method to create a successful output
   */
  protected createSuccessOutput(data: Record<string, any>): StepOutputs {
    return {
      ...data,
      success: true,
    };
  }

  /**
   * Helper method to create an error output
   */
  protected createErrorOutput(errors: string[]): StepOutputs {
    return {
      success: false,
      errors,
    };
  }

  /**
   * Helper method to create an output with warnings
   */
  protected createWarningOutput(
    data: Record<string, any>,
    warnings: string[]
  ): StepOutputs {
    return {
      ...data,
      success: true,
      warnings,
    };
  }
}
