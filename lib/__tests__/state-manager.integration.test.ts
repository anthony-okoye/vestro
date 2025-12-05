import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { StateManager } from "../state-manager";
import { prisma } from "../prisma";
import { InvestmentProfile, StepOutputs } from "../types";

describe("StateManager Integration Tests", () => {
  const stateManager = new StateManager();
  const testUserId = "test-user-integration";
  let createdSessionIds: string[] = [];
  let dbAvailable = false;

  // Check database availability and clean up test data before tests
  beforeAll(async () => {
    try {
      // Test database connection with a short timeout
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database connection timeout")), 2000)
        ),
      ]);
      dbAvailable = true;
      await cleanupTestData();
    } catch (error) {
      console.warn("Database not available, skipping integration tests:", error);
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await cleanupTestData();
      await prisma.$disconnect();
    }
  });

  beforeEach(() => {
    createdSessionIds = [];
  });

  async function cleanupTestData() {
    // Delete in correct order due to foreign key constraints
    await prisma.stepData.deleteMany({
      where: {
        session: {
          userId: testUserId,
        },
      },
    });
    await prisma.workflowSession.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.investmentProfile.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  }

  describe("Session Lifecycle", () => {
    it("should create a new workflow session", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.currentStep).toBe(1);
      expect(session.completedSteps).toEqual([]);
      expect(session.stepData.size).toBe(0);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.updatedAt).toBeInstanceOf(Date);
    });

    it("should update workflow session state", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      await stateManager.updateSession(session.sessionId, {
        currentStep: 3,
        completedSteps: [1, 2],
      });

      const updatedSession = await stateManager.getSession(session.sessionId);
      expect(updatedSession.currentStep).toBe(3);
      expect(updatedSession.completedSteps).toEqual([1, 2]);
    });

    it("should retrieve session with all step data", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      // Save step data for multiple steps
      const step1Data: StepOutputs = {
        success: true,
        riskTolerance: "medium",
        investmentHorizonYears: 10,
      };
      const step2Data: StepOutputs = {
        success: true,
        interestRate: 4.5,
        inflationRate: 2.3,
      };

      await stateManager.saveStepData(session.sessionId, 1, step1Data);
      await stateManager.saveStepData(session.sessionId, 2, step2Data);

      const retrievedSession = await stateManager.getSession(session.sessionId);
      expect(retrievedSession.stepData.size).toBe(2);
      expect(retrievedSession.stepData.get(1)).toMatchObject(step1Data);
      expect(retrievedSession.stepData.get(2)).toMatchObject(step2Data);
    });

    it("should get session history for a user", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      // Create multiple sessions
      const session1 = await stateManager.createSession(testUserId);
      const session2 = await stateManager.createSession(testUserId);
      createdSessionIds.push(session1.sessionId, session2.sessionId);

      const history = await stateManager.getSessionHistory(testUserId);
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history.map((s) => s.sessionId)).toContain(session1.sessionId);
      expect(history.map((s) => s.sessionId)).toContain(session2.sessionId);
    });

    it("should throw error when getting non-existent session", async () => {
      await expect(
        stateManager.getSession("non-existent-session-id")
      ).rejects.toThrow("Workflow session not found");
    });
  });

  describe("Step Data Persistence", () => {
    it("should save and retrieve step data", async () => {
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      const stepData: StepOutputs = {
        success: true,
        ticker: "AAPL",
        companyName: "Apple Inc.",
        sector: "Technology",
      };

      await stateManager.saveStepData(session.sessionId, 4, stepData);
      const retrieved = await stateManager.getStepData(session.sessionId, 4);

      expect(retrieved).toMatchObject(stepData);
    });

    it("should update existing step data", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      const initialData: StepOutputs = {
        success: true,
        value: "initial",
      };
      const updatedData: StepOutputs = {
        success: true,
        value: "updated",
        newField: "added",
      };

      await stateManager.saveStepData(session.sessionId, 5, initialData);
      await stateManager.saveStepData(session.sessionId, 5, updatedData);

      const retrieved = await stateManager.getStepData(session.sessionId, 5);
      expect(retrieved.value).toBe("updated");
      expect(retrieved.newField).toBe("added");
    });

    it("should handle step data with errors and warnings", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      const stepData: StepOutputs = {
        success: false,
        errors: ["Data source unavailable", "Timeout occurred"],
        warnings: ["Using cached data"],
        partialData: true,
      };

      await stateManager.saveStepData(session.sessionId, 6, stepData);
      const retrieved = await stateManager.getStepData(session.sessionId, 6);

      expect(retrieved.success).toBe(false);
      expect(retrieved.errors).toEqual([
        "Data source unavailable",
        "Timeout occurred",
      ]);
      expect(retrieved.warnings).toEqual(["Using cached data"]);
    });

    it("should throw error when getting non-existent step data", async () => {
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      await expect(
        stateManager.getStepData(session.sessionId, 99)
      ).rejects.toThrow("Step data not found");
    });
  });

  describe("User Profile Management", () => {
    it("should save and retrieve user profile", async () => {
      const profile: InvestmentProfile = {
        userId: testUserId,
        riskTolerance: "high",
        investmentHorizonYears: 15,
        capitalAvailable: 100000,
        longTermGoals: "steady growth",
        createdAt: new Date(),
      };

      await stateManager.saveUserProfile(testUserId, profile);
      const retrieved = await stateManager.getUserProfile(testUserId);

      expect(retrieved.userId).toBe(testUserId);
      expect(retrieved.riskTolerance).toBe("high");
      expect(retrieved.investmentHorizonYears).toBe(15);
      expect(retrieved.capitalAvailable).toBe(100000);
      expect(retrieved.longTermGoals).toBe("steady growth");
      expect(retrieved.createdAt).toBeInstanceOf(Date);
    });

    it("should update existing user profile", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const initialProfile: InvestmentProfile = {
        userId: testUserId,
        riskTolerance: "low",
        investmentHorizonYears: 5,
        capitalAvailable: 25000,
        longTermGoals: "capital preservation",
        createdAt: new Date(),
      };

      const updatedProfile: InvestmentProfile = {
        userId: testUserId,
        riskTolerance: "medium",
        investmentHorizonYears: 10,
        capitalAvailable: 50000,
        longTermGoals: "dividend income",
        createdAt: new Date(),
      };

      await stateManager.saveUserProfile(testUserId, initialProfile);
      await stateManager.saveUserProfile(testUserId, updatedProfile);

      const retrieved = await stateManager.getUserProfile(testUserId);
      expect(retrieved.riskTolerance).toBe("medium");
      expect(retrieved.investmentHorizonYears).toBe(10);
      expect(retrieved.capitalAvailable).toBe(50000);
      expect(retrieved.longTermGoals).toBe("dividend income");
    });

    it("should throw error when getting non-existent profile", async () => {
      await expect(
        stateManager.getUserProfile("non-existent-user")
      ).rejects.toThrow("Investment profile not found");
    });
  });

  describe("Concurrent Access", () => {
    it("should handle concurrent session creation", async () => {
      const promises = Array.from({ length: 5 }, () =>
        stateManager.createSession(testUserId)
      );

      const sessions = await Promise.all(promises);
      sessions.forEach((s) => createdSessionIds.push(s.sessionId));

      // All sessions should be created successfully
      expect(sessions).toHaveLength(5);
      // All session IDs should be unique
      const uniqueIds = new Set(sessions.map((s) => s.sessionId));
      expect(uniqueIds.size).toBe(5);
    });

    it("should handle concurrent step data saves to same session", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      const promises = Array.from({ length: 5 }, (_, i) =>
        stateManager.saveStepData(session.sessionId, i + 1, {
          success: true,
          stepNumber: i + 1,
          data: `Step ${i + 1} data`,
        })
      );

      await Promise.all(promises);

      // Verify all step data was saved
      const retrievedSession = await stateManager.getSession(session.sessionId);
      expect(retrievedSession.stepData.size).toBe(5);

      for (let i = 1; i <= 5; i++) {
        const stepData = retrievedSession.stepData.get(i);
        expect(stepData).toBeDefined();
        expect(stepData?.stepNumber).toBe(i);
      }
    });

    it("should handle concurrent updates to same step data", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      // Save initial data
      await stateManager.saveStepData(session.sessionId, 1, {
        success: true,
        counter: 0,
      });

      // Concurrent updates to the same step
      const promises = Array.from({ length: 3 }, (_, i) =>
        stateManager.saveStepData(session.sessionId, 1, {
          success: true,
          counter: i + 1,
          timestamp: new Date().toISOString(),
        })
      );

      await Promise.all(promises);

      // Last write should win
      const retrieved = await stateManager.getStepData(session.sessionId, 1);
      expect(retrieved.success).toBe(true);
      expect(retrieved.counter).toBeGreaterThan(0);
    });

    it("should handle concurrent session updates", async () => {
      if (!dbAvailable) {
        console.log("Skipping test: database not available");
        return;
      }
      
      const session = await stateManager.createSession(testUserId);
      createdSessionIds.push(session.sessionId);

      const promises = [
        stateManager.updateSession(session.sessionId, { currentStep: 2 }),
        stateManager.updateSession(session.sessionId, { completedSteps: [1] }),
        stateManager.updateSession(session.sessionId, { currentStep: 3 }),
      ];

      await Promise.all(promises);

      const updated = await stateManager.getSession(session.sessionId);
      // Session should be updated (exact values may vary due to race conditions)
      expect(updated.currentStep).toBeGreaterThan(1);
    });
  });
});
