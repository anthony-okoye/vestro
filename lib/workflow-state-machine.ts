import { WorkflowSession } from "./types";

/**
 * Step transition rules and validation for the workflow state machine
 */
export interface StepTransition {
  fromStep: number;
  toStep: number;
  isValid: boolean;
  reason?: string;
}

/**
 * WorkflowStateMachine manages step transitions and validation rules
 * for the 12-step investment research workflow
 */
export class WorkflowStateMachine {
  private readonly TOTAL_STEPS = 12;
  private readonly OPTIONAL_STEPS = [8]; // Step 8: Technical Trends

  /**
   * Step definitions with metadata
   */
  private readonly STEP_DEFINITIONS = [
    { id: 1, name: "Profile Definition", isOptional: false, dependencies: [] },
    { id: 2, name: "Market Conditions", isOptional: false, dependencies: [1] },
    { id: 3, name: "Sector Identification", isOptional: false, dependencies: [1, 2] },
    { id: 4, name: "Stock Screening", isOptional: false, dependencies: [1, 2, 3] },
    { id: 5, name: "Fundamental Analysis", isOptional: false, dependencies: [4] },
    { id: 6, name: "Competitive Position", isOptional: false, dependencies: [4, 5] },
    { id: 7, name: "Valuation Evaluation", isOptional: false, dependencies: [5, 6] },
    { id: 8, name: "Technical Trends", isOptional: true, dependencies: [4] },
    { id: 9, name: "Analyst Sentiment", isOptional: false, dependencies: [4] },
    { id: 10, name: "Position Sizing", isOptional: false, dependencies: [1, 5, 7, 9] },
    { id: 11, name: "Mock Trade", isOptional: false, dependencies: [10] },
    { id: 12, name: "Monitoring Setup", isOptional: false, dependencies: [11] },
  ];

  /**
   * Check if a step is optional
   */
  isStepOptional(stepId: number): boolean {
    return this.OPTIONAL_STEPS.includes(stepId);
  }

  /**
   * Get step definition by ID
   */
  getStepDefinition(stepId: number) {
    return this.STEP_DEFINITIONS.find((step) => step.id === stepId);
  }

  /**
   * Validate if a transition from one step to another is allowed
   */
  validateTransition(session: WorkflowSession, targetStep: number): StepTransition {
    const currentStep = session.currentStep;

    // Can't go to invalid step numbers
    if (targetStep < 1 || targetStep > this.TOTAL_STEPS) {
      return {
        fromStep: currentStep,
        toStep: targetStep,
        isValid: false,
        reason: `Invalid step number: ${targetStep}`,
      };
    }

    // Can always stay on current step (re-execute)
    if (targetStep === currentStep) {
      return {
        fromStep: currentStep,
        toStep: targetStep,
        isValid: true,
      };
    }

    // Can go back to any previous step
    if (targetStep < currentStep) {
      return {
        fromStep: currentStep,
        toStep: targetStep,
        isValid: true,
      };
    }

    // Can only advance one step at a time
    if (targetStep > currentStep + 1) {
      return {
        fromStep: currentStep,
        toStep: targetStep,
        isValid: false,
        reason: `Cannot skip steps. Must complete step ${currentStep} first`,
      };
    }

    // Check if all dependencies are met
    const stepDef = this.getStepDefinition(targetStep);
    if (stepDef) {
      const unmetDependencies = this.getUnmetDependencies(session, stepDef.dependencies);
      if (unmetDependencies.length > 0) {
        return {
          fromStep: currentStep,
          toStep: targetStep,
          isValid: false,
          reason: `Missing required steps: ${unmetDependencies.join(", ")}`,
        };
      }
    }

    return {
      fromStep: currentStep,
      toStep: targetStep,
      isValid: true,
    };
  }

  /**
   * Get unmet dependencies for a step
   */
  private getUnmetDependencies(
    session: WorkflowSession,
    dependencies: number[]
  ): number[] {
    return dependencies.filter((depStep) => {
      const isCompleted = session.completedSteps.includes(depStep);
      const isOptional = this.OPTIONAL_STEPS.includes(depStep);
      // Dependency is unmet if it's not completed and not optional
      return !isCompleted && !isOptional;
    });
  }

  /**
   * Calculate workflow progress percentage
   */
  calculateProgress(session: WorkflowSession): number {
    const completedCount = session.completedSteps.length;
    return Math.round((completedCount / this.TOTAL_STEPS) * 100);
  }

  /**
   * Get the next recommended step
   */
  getNextStep(session: WorkflowSession): number | null {
    // If current step is not completed, stay on it
    if (!session.completedSteps.includes(session.currentStep)) {
      return session.currentStep;
    }

    // If we've completed all steps, no next step
    if (session.currentStep >= this.TOTAL_STEPS) {
      return null;
    }

    // Return next step
    return session.currentStep + 1;
  }

  /**
   * Check if workflow is complete
   */
  isWorkflowComplete(session: WorkflowSession): boolean {
    // Count required steps that are completed
    const requiredSteps = this.STEP_DEFINITIONS.filter((step) => !step.isOptional).map(
      (step) => step.id
    );

    const completedRequiredSteps = requiredSteps.filter((stepId) =>
      session.completedSteps.includes(stepId)
    );

    return completedRequiredSteps.length === requiredSteps.length;
  }

  /**
   * Get all steps that can be executed from current state
   */
  getAvailableSteps(session: WorkflowSession): number[] {
    const available: number[] = [];

    for (let stepId = 1; stepId <= this.TOTAL_STEPS; stepId++) {
      const transition = this.validateTransition(session, stepId);
      if (transition.isValid) {
        available.push(stepId);
      }
    }

    return available;
  }

  /**
   * Get validation rules for a specific step
   */
  getStepValidationRules(stepId: number): {
    canSkip: boolean;
    requiredPreviousSteps: number[];
    description: string;
  } {
    const stepDef = this.getStepDefinition(stepId);

    if (!stepDef) {
      return {
        canSkip: false,
        requiredPreviousSteps: [],
        description: "Unknown step",
      };
    }

    return {
      canSkip: stepDef.isOptional,
      requiredPreviousSteps: stepDef.dependencies,
      description: stepDef.name,
    };
  }

  /**
   * Get workflow summary
   */
  getWorkflowSummary(session: WorkflowSession): {
    totalSteps: number;
    completedSteps: number;
    remainingSteps: number;
    currentStepName: string;
    isComplete: boolean;
    progress: number;
  } {
    const currentStepDef = this.getStepDefinition(session.currentStep);

    return {
      totalSteps: this.TOTAL_STEPS,
      completedSteps: session.completedSteps.length,
      remainingSteps: this.TOTAL_STEPS - session.completedSteps.length,
      currentStepName: currentStepDef?.name || "Unknown",
      isComplete: this.isWorkflowComplete(session),
      progress: this.calculateProgress(session),
    };
  }
}
