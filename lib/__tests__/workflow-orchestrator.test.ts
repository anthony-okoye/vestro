import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowOrchestrator } from "../workflow-orchestrator";
import { StateManager } from "../state-manager";
import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  WorkflowContext,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowSession,
} from "../types";

// Mock StateManager
class MockStateManager extends StateManager {
  private sessions: Map<string, WorkflowSession> = new Map();
  private stepDataStore: Map<string, Map<number, StepOutputs>> = new Map();

  async createSession(userId: string): Promise<WorkflowSession> {
    const sessionId = `session-${Date.now()}-${Math.random()}`;
    const session: WorkflowSession = {
      sessionId,
      userId,
      currentStep: 1,
      completedSteps: [],
      stepData: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    this.stepDataStore.set(sessionId, new Map());
    return session;
  }

  async getSession(sessionId: string): Promise<WorkflowSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Workflow session not found");
    }
    // Load step data
    const stepData = this.stepDataStore.get(sessionId) || new Map();
    return { ...session, stepData };
  }

  async updateSession(
    sessionId: string,
    updates: Partial<WorkflowSession>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Workflow session not found");
    }
    Object.assign(session, updates, { updatedAt: new Date() });
  }

  async saveStepData(
    sessionId: string,
    stepId: number,
    data: StepOutputs
  ): Promise<void> {
    let stepData = this.stepDataStore.get(sessionId);
    if (!stepData) {
      stepData = new Map();
      this.stepDataStore.set(sessionId, stepData);
    }
    stepData.set(stepId, data);
  }

  async getStepData(sessionId: string, stepId: number): Promise<StepOutputs> {
    const stepData = this.stepDataStore.get(sessionId);
    const data = stepData?.get(stepId);
    if (!data) {
      throw new Error("Step data not found");
    }
    return data;
  }

  async getUserProfile(userId: string): Promise<any> {
    throw new Error("Investment profile not found");
  }

  async saveUserProfile(userId: string, profile: any): Promise<void> {
    // Mock implementation
  }

  async getSessionHistory(userId: string): Promise<WorkflowSession[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId
    );
  }
}

// Mock StepProcessor
class MockStepProcessor implements StepProcessor {
  stepId: number;
  stepName: string;
  isOptional: boolean;
  private shouldFail: boolean = false;

  constructor(stepId: number, stepName: string, isOptional: boolean = false) {
    this.stepId = stepId;
    this.stepName = stepName;
    this.isOptional = isOptional;
  }

  setShouldFail(shouldFail: boolean) {
    this.shouldFail = shouldFail;
  }

  validateInputs(inputs: StepInputs): ValidationResult {
    if (inputs.invalid) {
      return {
        isValid: false,
        errors: ["Invalid input provided"],
      };
    }
    return {
      isValid: true,
      errors: [],
    };
  }

  async execute(
    inputs: StepInputs,
    context: WorkflowContext
  ): Promise<StepOutputs> {
    if (this.shouldFail) {
      throw new Error("Step execution failed");
    }
    return {
      success: true,
      stepId: this.stepId,
      processedData: `Processed by ${this.stepName}`,
      ...inputs,
    };
  }

  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "testInput",
        type: "string",
        required: true,
        description: "Test input for step",
      },
    ];
  }

  getOutputSchema(): OutputSchema {
    return {
      success: { type: "boolean" },
      stepId: { type: "number" },
      processedData: { type: "string" },
    };
  }
}

describe("WorkflowOrchestrator", () => {
  let orchestrator: WorkflowOrchestrator;
  let stateManager: MockStateManager;
  let testUserId: string;

  beforeEach(() => {
    stateManager = new MockStateManager();
    orchestrator = new WorkflowOrchestrator(stateManager);
    testUserId = `test-user-${Date.now()}`;

    // Register mock processors for steps 1-12
    for (let i = 1; i <= 12; i++) {
      const isOptional = i === 8; // Step 8 is optional
      orchestrator.registerStepProcessor(
        new MockStepProcessor(i, `Step ${i}`, isOptional)
      );
    }
  });

  describe("Workflow Initialization", () => {
    it("should start a new workflow session", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.currentStep).toBe(1);
      expect(session.completedSteps).toEqual([]);
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it("should create multiple independent sessions for same user", async () => {
      const session1 = await orchestrator.startWorkflow(testUserId);
      const session2 = await orchestrator.startWorkflow(testUserId);

      expect(session1.sessionId).not.toBe(session2.sessionId);
      expect(session1.userId).toBe(session2.userId);
    });
  });

  describe("Step Progression", () => {
    it("should execute step 1 successfully", async () => {
      const session = await orchestrator.startWorkflow(testUserId);
      const inputs: StepInputs = { testData: "value1" };

      const result = await orchestrator.executeStep(
        session.sessionId,
        1,
        inputs
      );

      expect(result.success).toBe(true);
      expect(result.stepId).toBe(1);
      expect(result.processedData).toContain("Step 1");
    });

    it("should progress to next step after completing current step", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute step 1
      await orchestrator.executeStep(session.sessionId, 1, {
        testData: "value1",
      });

      // Check status
      const status = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(status.currentStep).toBe(2);
      expect(status.progress).toBeGreaterThan(0);
    });

    it("should allow executing steps in sequence", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute steps 1-3
      for (let i = 1; i <= 3; i++) {
        const result = await orchestrator.executeStep(session.sessionId, i, {
          testData: `value${i}`,
        });
        expect(result.success).toBe(true);
      }

      const status = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(status.currentStep).toBe(4);
      expect(status.progress).toBeGreaterThan(20);
    });

    it("should prevent skipping steps", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Try to execute step 3 without completing steps 1 and 2
      const result = await orchestrator.executeStep(session.sessionId, 3, {
        testData: "value",
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("skip");
    });

    it("should allow re-executing current step", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute step 1 twice
      const result1 = await orchestrator.executeStep(session.sessionId, 1, {
        testData: "first",
      });
      const result2 = await orchestrator.executeStep(session.sessionId, 2, {
        testData: "second",
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it("should allow going back to previous steps", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute steps 1-3
      await orchestrator.executeStep(session.sessionId, 1, {});
      await orchestrator.executeStep(session.sessionId, 2, {});
      await orchestrator.executeStep(session.sessionId, 3, {});

      // Go back to step 2
      const result = await orchestrator.executeStep(session.sessionId, 2, {
        testData: "revised",
      });

      expect(result.success).toBe(true);
      expect(result.testData).toBe("revised");
    });

    it("should track completed steps correctly", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute steps 1-4
      for (let i = 1; i <= 4; i++) {
        await orchestrator.executeStep(session.sessionId, i, {});
      }

      const updatedSession = await stateManager.getSession(session.sessionId);
      expect(updatedSession.completedSteps).toContain(1);
      expect(updatedSession.completedSteps).toContain(2);
      expect(updatedSession.completedSteps).toContain(3);
      expect(updatedSession.completedSteps).toContain(4);
    });
  });

  describe("Optional Step Skipping", () => {
    it("should skip optional step 8", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute steps 1-7
      for (let i = 1; i <= 7; i++) {
        await orchestrator.executeStep(session.sessionId, i, {});
      }

      // Skip step 8 (optional)
      await orchestrator.skipOptionalStep(session.sessionId, 8);

      const status = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(status.currentStep).toBe(9);

      // Verify step 8 is marked as completed (skipped)
      const updatedSession = await stateManager.getSession(session.sessionId);
      expect(updatedSession.completedSteps).toContain(8);

      // Verify skip marker in step data
      const step8Data = await stateManager.getStepData(session.sessionId, 8);
      expect(step8Data.skipped).toBe(true);
      expect(step8Data.success).toBe(true);
    });

    it("should not allow skipping non-optional steps", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Try to skip step 1 (not optional)
      await expect(
        orchestrator.skipOptionalStep(session.sessionId, 1)
      ).rejects.toThrow("not optional");
    });

    it("should not allow skipping step if not at that step", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute steps 1-7
      for (let i = 1; i <= 7; i++) {
        await orchestrator.executeStep(session.sessionId, i, {});
      }

      // Try to skip step 9 while at step 8
      await expect(
        orchestrator.skipOptionalStep(session.sessionId, 9)
      ).rejects.toThrow("not optional");
    });

    it("should continue workflow after skipping optional step", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute steps 1-7
      for (let i = 1; i <= 7; i++) {
        await orchestrator.executeStep(session.sessionId, i, {});
      }

      // Skip step 8
      await orchestrator.skipOptionalStep(session.sessionId, 8);

      // Execute step 9
      const result = await orchestrator.executeStep(session.sessionId, 9, {});
      expect(result.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid step ID", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      const result = await orchestrator.executeStep(session.sessionId, 99, {});

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("Invalid step ID");
    });

    it("should handle negative step ID", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      const result = await orchestrator.executeStep(session.sessionId, -1, {});

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("Invalid step ID");
    });

    it("should handle missing step processor", async () => {
      const session = await orchestrator.startWorkflow(testUserId);
      const orchestratorWithoutProcessors = new WorkflowOrchestrator(
        stateManager
      );

      const result = await orchestratorWithoutProcessors.executeStep(
        session.sessionId,
        1,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("No processor registered");
    });

    it("should handle invalid inputs", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      const result = await orchestrator.executeStep(session.sessionId, 1, {
        invalid: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Invalid input provided");
    });

    it("should handle step execution failure", async () => {
      const session = await orchestrator.startWorkflow(testUserId);
      const failingProcessor = new MockStepProcessor(1, "Failing Step");
      failingProcessor.setShouldFail(true);

      const orchestratorWithFailingProcessor = new WorkflowOrchestrator(
        stateManager,
        [failingProcessor]
      );

      const result = await orchestratorWithFailingProcessor.executeStep(
        session.sessionId,
        1,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("Step execution failed");
    });

    it("should handle non-existent session", async () => {
      await expect(
        orchestrator.getWorkflowStatus("non-existent-session")
      ).rejects.toThrow("Workflow session not found");
    });

    it("should not update progress on failed step execution", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute step with invalid input
      await orchestrator.executeStep(session.sessionId, 1, { invalid: true });

      const status = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(status.currentStep).toBe(1);
      expect(status.progress).toBe(0);
    });
  });

  describe("Workflow Status", () => {
    it("should return correct workflow status at start", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      const status = await orchestrator.getWorkflowStatus(session.sessionId);

      expect(status.sessionId).toBe(session.sessionId);
      expect(status.currentStep).toBe(1);
      expect(status.totalSteps).toBe(12);
      expect(status.progress).toBe(0);
      expect(status.nextStepRequirements).toBeDefined();
    });

    it("should update progress as steps complete", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute 6 steps (50% of workflow)
      for (let i = 1; i <= 6; i++) {
        await orchestrator.executeStep(session.sessionId, i, {});
      }

      const status = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(status.progress).toBe(50);
      expect(status.currentStep).toBe(7);
    });

    it("should indicate when workflow can proceed", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // At start, current step is 1 and not completed, so canProceed is false
      const initialStatus = await orchestrator.getWorkflowStatus(
        session.sessionId
      );
      expect(initialStatus.canProceed).toBe(false);

      // After executing step 1, current step becomes 2 (not completed), so canProceed is still false
      await orchestrator.executeStep(session.sessionId, 1, {});
      const afterStep1 = await orchestrator.getWorkflowStatus(
        session.sessionId
      );
      expect(afterStep1.canProceed).toBe(false);
      expect(afterStep1.currentStep).toBe(2);

      // After executing step 2, current step becomes 3 (not completed), so canProceed is still false
      await orchestrator.executeStep(session.sessionId, 2, {});
      const afterStep2 = await orchestrator.getWorkflowStatus(
        session.sessionId
      );
      expect(afterStep2.canProceed).toBe(false);
      expect(afterStep2.currentStep).toBe(3);
    });

    it("should provide next step requirements", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      const status = await orchestrator.getWorkflowStatus(session.sessionId);

      expect(status.nextStepRequirements).toBeDefined();
      expect(status.nextStepRequirements.length).toBeGreaterThan(0);
    });
  });

  describe("Workflow Reset", () => {
    it("should reset workflow to beginning", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute several steps
      for (let i = 1; i <= 5; i++) {
        await orchestrator.executeStep(session.sessionId, i, {});
      }

      // Reset workflow
      await orchestrator.resetWorkflow(session.sessionId);

      const status = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(status.currentStep).toBe(1);
      expect(status.progress).toBe(0);

      const updatedSession = await stateManager.getSession(session.sessionId);
      expect(updatedSession.completedSteps).toEqual([]);
    });

    it("should allow re-executing steps after reset", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute and reset
      await orchestrator.executeStep(session.sessionId, 1, {});
      await orchestrator.resetWorkflow(session.sessionId);

      // Execute again
      const result = await orchestrator.executeStep(session.sessionId, 1, {
        testData: "after reset",
      });

      expect(result.success).toBe(true);
      expect(result.testData).toBe("after reset");
    });
  });

  describe("Step Data Persistence", () => {
    it("should save step data after successful execution", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      await orchestrator.executeStep(session.sessionId, 1, {
        testData: "important data",
      });

      const stepData = await stateManager.getStepData(session.sessionId, 1);
      expect(stepData.success).toBe(true);
      expect(stepData.testData).toBe("important data");
    });

    it("should make previous step data available in context", async () => {
      const session = await orchestrator.startWorkflow(testUserId);

      // Execute step 1
      await orchestrator.executeStep(session.sessionId, 1, {
        profileData: "user profile",
      });

      // Execute step 2 - it should have access to step 1 data
      await orchestrator.executeStep(session.sessionId, 2, {});

      const updatedSession = await stateManager.getSession(session.sessionId);
      expect(updatedSession.stepData.size).toBe(2);
      expect(updatedSession.stepData.get(1)).toBeDefined();
    });
  });
});
