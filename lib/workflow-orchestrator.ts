import {
  WorkflowOrchestrator as IWorkflowOrchestrator,
  WorkflowSession,
  WorkflowStatus,
  StepInputs,
  StepOutputs,
  StepProcessor,
  WorkflowContext,
} from "./types";
import { StateManager } from "./state-manager";
import { WorkflowStateMachine } from "./workflow-state-machine";

/**
 * WorkflowOrchestrator manages the 12-step investment research workflow
 * Handles step progression, validation, and state management
 */
export class WorkflowOrchestrator implements IWorkflowOrchestrator {
  private stateManager: StateManager;
  private stateMachine: WorkflowStateMachine;
  private stepProcessors: Map<number, StepProcessor>;
  private readonly TOTAL_STEPS = 12;

  constructor(stateManager: StateManager, stepProcessors?: StepProcessor[]) {
    this.stateManager = stateManager;
    this.stateMachine = new WorkflowStateMachine();
    this.stepProcessors = new Map();

    // Register step processors if provided
    if (stepProcessors) {
      stepProcessors.forEach((processor) => {
        this.stepProcessors.set(processor.stepId, processor);
      });
    }
  }

  /**
   * Register a step processor
   */
  registerStepProcessor(processor: StepProcessor): void {
    this.stepProcessors.set(processor.stepId, processor);
  }

  /**
   * Start a new workflow session for a user
   */
  async startWorkflow(userId: string): Promise<WorkflowSession> {
    const session = await this.stateManager.createSession(userId);
    return session;
  }

  /**
   * Execute a specific step in the workflow
   */
  async executeStep(
    sessionId: string,
    stepId: number,
    inputs: StepInputs
  ): Promise<StepOutputs> {
    // Validate step ID
    if (stepId < 1 || stepId > this.TOTAL_STEPS) {
      return {
        success: false,
        errors: [`Invalid step ID: ${stepId}. Must be between 1 and ${this.TOTAL_STEPS}`],
      };
    }

    // Get current session
    const session = await this.stateManager.getSession(sessionId);

    // Validate step dependencies
    const dependencyValidation = this.validateStepDependencies(session, stepId);
    if (!dependencyValidation.isValid) {
      return {
        success: false,
        errors: dependencyValidation.errors,
      };
    }

    // Get step processor
    const processor = this.stepProcessors.get(stepId);
    if (!processor) {
      return {
        success: false,
        errors: [`No processor registered for step ${stepId}`],
      };
    }

    // Validate inputs
    const inputValidation = processor.validateInputs(inputs);
    if (!inputValidation.isValid) {
      return {
        success: false,
        errors: inputValidation.errors,
      };
    }

    // Build workflow context
    const context: WorkflowContext = {
      sessionId,
      userId: session.userId,
      previousStepData: session.stepData,
    };

    // Try to get user profile if it exists
    try {
      context.userProfile = await this.stateManager.getUserProfile(session.userId);
    } catch (error) {
      // User profile may not exist yet (e.g., for step 1)
    }

    // Execute the step
    try {
      const outputs = await processor.execute(inputs, context);

      // Save step data
      await this.stateManager.saveStepData(sessionId, stepId, outputs);

      // Update session progress if step was successful
      if (outputs.success) {
        await this.updateSessionProgress(session, stepId);
      }

      return outputs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        errors: [`Step execution failed: ${errorMessage}`],
      };
    }
  }

  /**
   * Get the current status of a workflow session
   */
  async getWorkflowStatus(sessionId: string): Promise<WorkflowStatus> {
    const session = await this.stateManager.getSession(sessionId);

    const progress = this.calculateProgress(session);
    const canProceed = this.canProceedToNextStep(session);
    const nextStepRequirements = this.getNextStepRequirements(session);

    return {
      sessionId: session.sessionId,
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      totalSteps: this.TOTAL_STEPS,
      progress,
      canProceed,
      nextStepRequirements,
    };
  }

  /**
   * Skip an optional step in the workflow
   */
  async skipOptionalStep(sessionId: string, stepId: number): Promise<void> {
    // Validate that the step is optional using state machine
    if (!this.stateMachine.isStepOptional(stepId)) {
      throw new Error(`Step ${stepId} is not optional and cannot be skipped`);
    }

    const session = await this.stateManager.getSession(sessionId);

    // Validate that we're at the correct step
    if (session.currentStep !== stepId) {
      throw new Error(
        `Cannot skip step ${stepId}. Current step is ${session.currentStep}`
      );
    }

    // Mark step as completed (skipped) and move to next step
    const updatedCompletedSteps = [...session.completedSteps, stepId];
    const nextStep = stepId + 1;

    await this.stateManager.updateSession(sessionId, {
      currentStep: nextStep <= this.TOTAL_STEPS ? nextStep : stepId,
      completedSteps: updatedCompletedSteps,
    });

    // Save a marker in step data indicating it was skipped
    await this.stateManager.saveStepData(sessionId, stepId, {
      success: true,
      skipped: true,
      warnings: ["This optional step was skipped"],
    });
  }

  /**
   * Reset a workflow session to start from the beginning
   */
  async resetWorkflow(sessionId: string): Promise<void> {
    await this.stateManager.updateSession(sessionId, {
      currentStep: 1,
      completedSteps: [],
    });
  }

  /**
   * Validate that all dependencies for a step are met
   */
  private validateStepDependencies(
    session: WorkflowSession,
    stepId: number
  ): { isValid: boolean; errors: string[] } {
    // Use state machine to validate transition
    const transition = this.stateMachine.validateTransition(session, stepId);

    if (!transition.isValid) {
      return {
        isValid: false,
        errors: [transition.reason || "Invalid step transition"],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Update session progress after successful step execution
   */
  private async updateSessionProgress(
    session: WorkflowSession,
    completedStepId: number
  ): Promise<void> {
    // Add to completed steps if not already there
    const updatedCompletedSteps = session.completedSteps.includes(completedStepId)
      ? session.completedSteps
      : [...session.completedSteps, completedStepId];

    // Move to next step if we just completed the current step
    let nextStep = session.currentStep;
    if (completedStepId === session.currentStep) {
      nextStep = Math.min(session.currentStep + 1, this.TOTAL_STEPS);
    }

    await this.stateManager.updateSession(session.sessionId, {
      currentStep: nextStep,
      completedSteps: updatedCompletedSteps,
    });
  }

  /**
   * Calculate workflow progress as a percentage
   */
  private calculateProgress(session: WorkflowSession): number {
    return this.stateMachine.calculateProgress(session);
  }

  /**
   * Check if the workflow can proceed to the next step
   */
  private canProceedToNextStep(session: WorkflowSession): boolean {
    const nextStep = this.stateMachine.getNextStep(session);
    return nextStep !== null && nextStep !== session.currentStep;
  }

  /**
   * Get requirements for the next step
   */
  private getNextStepRequirements(session: WorkflowSession): string[] {
    const requirements: string[] = [];

    // If workflow is complete
    if (session.currentStep > this.TOTAL_STEPS) {
      return ["Workflow complete"];
    }

    // Get processor for current step
    const processor = this.stepProcessors.get(session.currentStep);
    if (processor) {
      const inputs = processor.getRequiredInputs();
      requirements.push(
        ...inputs
          .filter((input) => input.required)
          .map((input) => input.description || input.name)
      );
    } else {
      requirements.push(`Complete step ${session.currentStep}`);
    }

    return requirements;
  }
}
