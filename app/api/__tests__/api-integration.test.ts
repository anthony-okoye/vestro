import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { InvestmentProfile } from "@/lib/types";

/**
 * API Integration Tests
 * 
 * These tests verify complete workflow execution via API routes.
 * Tests Requirements: 1.5, 2.6
 */

describe("API Integration Tests", () => {
  const testUserId = "api-test-user";
  let createdSessionIds: string[] = [];
  let dbAvailable = false;

  beforeAll(async () => {
    // Check if database is available
    try {
      await prisma.$connect();
      dbAvailable = true;
      // Clean up any existing test data
      await cleanupTestData();
    } catch (error) {
      console.warn("Database not available, tests will be skipped. Set DATABASE_URL to run integration tests.");
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      try {
        await cleanupTestData();
      } catch (error) {
        console.warn("Error during cleanup:", error);
      }
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    createdSessionIds = [];
  });

  async function cleanupTestData() {
    if (!dbAvailable) return;
    
    try {
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
    } catch (error) {
      console.warn("Error during cleanup:", error);
    }
  }

  function skipIfNoDb() {
    if (!dbAvailable) {
      return it.skip;
    }
    return it;
  }

  describe("Complete Workflow Execution", () => {
    skipIfNoDb()("should execute a complete workflow from start to finish", async () => {
      // Step 0: Create user profile
      const profileData = {
        userId: testUserId,
        riskTolerance: "medium" as const,
        investmentHorizonYears: 10,
        capitalAvailable: 50000,
        longTermGoals: "steady growth" as const,
      };

      // Create profile via state manager (profiles API would be used in real scenario)
      const { StateManager } = await import("@/lib/state-manager");
      const stateManager = new StateManager();
      const profile: InvestmentProfile = {
        ...profileData,
        createdAt: new Date(),
      };
      await stateManager.saveUserProfile(testUserId, profile);

      // Step 1: Start workflow
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const orchestrator = new WorkflowOrchestrator(stateManager);
      
      // Register all processors
      const stepProcessors = await import("@/lib/step-processors");
      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
      orchestrator.registerStepProcessor(new stepProcessors.MarketConditionsProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.SectorIdentificationProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.StockScreeningProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.FundamentalAnalysisProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.CompetitivePositionProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.ValuationEvaluationProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.TechnicalTrendsProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.AnalystSentimentProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.PositionSizingProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.MockTradeProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.MonitoringSetupProcessor());

      const session = await orchestrator.startWorkflow(testUserId);
      createdSessionIds.push(session.sessionId);

      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.currentStep).toBe(1);

      // Step 2: Execute Step 1 - Profile Definition
      const step1Result = await orchestrator.executeStep(session.sessionId, 1, profileData);
      expect(step1Result.success).toBe(true);

      // Step 3: Execute Step 2 - Market Conditions
      const step2Result = await orchestrator.executeStep(session.sessionId, 2, {});
      expect(step2Result.success).toBe(true);
      expect(step2Result.interestRate).toBeDefined();
      expect(step2Result.marketTrend).toBeDefined();

      // Step 4: Execute Step 3 - Sector Identification
      const step3Result = await orchestrator.executeStep(session.sessionId, 3, {});
      expect(step3Result.success).toBe(true);
      expect(step3Result.sectors).toBeDefined();
      expect(Array.isArray(step3Result.sectors)).toBe(true);

      // Step 5: Execute Step 4 - Stock Screening
      const step4Result = await orchestrator.executeStep(session.sessionId, 4, {
        marketCap: "large",
        dividendYieldMin: 2.0,
        peRatioMax: 25,
        sector: step3Result.sectors[0]?.sectorName || "Technology",
      });
      expect(step4Result.success).toBe(true);
      expect(step4Result.stocks).toBeDefined();

      // Get a ticker for subsequent steps
      const testTicker = step4Result.stocks?.[0]?.ticker || "AAPL";

      // Step 6: Execute Step 5 - Fundamental Analysis
      const step5Result = await orchestrator.executeStep(session.sessionId, 5, {
        ticker: testTicker,
      });
      expect(step5Result.success).toBe(true);

      // Step 7: Execute Step 6 - Competitive Position
      const step6Result = await orchestrator.executeStep(session.sessionId, 6, {
        ticker: testTicker,
      });
      expect(step6Result.success).toBe(true);

      // Step 8: Execute Step 7 - Valuation Evaluation
      const step7Result = await orchestrator.executeStep(session.sessionId, 7, {
        ticker: testTicker,
        peerTickers: ["MSFT", "GOOGL"],
      });
      expect(step7Result.success).toBe(true);

      // Step 9: Skip Step 8 - Technical Trends (optional)
      await orchestrator.skipOptionalStep(session.sessionId, 8);
      const statusAfterSkip = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(statusAfterSkip.currentStep).toBe(9);

      // Step 10: Execute Step 9 - Analyst Sentiment
      const step9Result = await orchestrator.executeStep(session.sessionId, 9, {
        ticker: testTicker,
      });
      expect(step9Result.success).toBe(true);

      // Step 11: Execute Step 10 - Position Sizing
      const step10Result = await orchestrator.executeStep(session.sessionId, 10, {
        ticker: testTicker,
        portfolioSize: 50000,
        riskModel: "balanced",
      });
      expect(step10Result.success).toBe(true);
      expect(step10Result.sharesToBuy).toBeDefined();

      // Step 12: Execute Step 11 - Mock Trade
      const step11Result = await orchestrator.executeStep(session.sessionId, 11, {
        ticker: testTicker,
        quantity: step10Result.sharesToBuy,
        brokerPlatform: "Test Broker",
      });
      expect(step11Result.success).toBe(true);
      expect(step11Result.confirmationId).toBeDefined();
      expect(step11Result.isMock).toBe(true);

      // Step 13: Execute Step 12 - Monitoring Setup
      const step12Result = await orchestrator.executeStep(session.sessionId, 12, {
        ticker: testTicker,
        alertApp: "Email",
        reviewFrequency: "quarterly",
      });
      expect(step12Result.success).toBe(true);

      // Verify final workflow status
      const finalStatus = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(finalStatus.progress).toBe(100);
      expect(finalStatus.currentStep).toBe(13); // After completing step 12

      // Verify all step data is persisted
      const finalSession = await stateManager.getSession(session.sessionId);
      expect(finalSession.completedSteps.length).toBe(12);
      expect(finalSession.stepData.size).toBe(12);
    });

    skipIfNoDb()("should handle workflow with technical analysis included", async () => {
      const { StateManager } = await import("@/lib/state-manager");
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const stepProcessors = await import("@/lib/step-processors");

      const stateManager = new StateManager();
      const orchestrator = new WorkflowOrchestrator(stateManager);

      // Register all processors
      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
      orchestrator.registerStepProcessor(new stepProcessors.MarketConditionsProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.SectorIdentificationProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.StockScreeningProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.FundamentalAnalysisProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.CompetitivePositionProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.ValuationEvaluationProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.TechnicalTrendsProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.AnalystSentimentProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.PositionSizingProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.MockTradeProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.MonitoringSetupProcessor());

      // Create profile
      const profile: InvestmentProfile = {
        userId: testUserId,
        riskTolerance: "high" as const,
        investmentHorizonYears: 5,
        capitalAvailable: 100000,
        longTermGoals: "steady growth" as const,
        createdAt: new Date(),
      };
      await stateManager.saveUserProfile(testUserId, profile);

      const session = await orchestrator.startWorkflow(testUserId);
      createdSessionIds.push(session.sessionId);

      // Execute steps 1-7
      await orchestrator.executeStep(session.sessionId, 1, {
        userId: testUserId,
        riskTolerance: "high",
        investmentHorizonYears: 5,
        capitalAvailable: 100000,
        longTermGoals: "steady growth",
      });
      await orchestrator.executeStep(session.sessionId, 2, {});
      await orchestrator.executeStep(session.sessionId, 3, {});
      const step4 = await orchestrator.executeStep(session.sessionId, 4, {
        marketCap: "large",
        dividendYieldMin: 1.5,
        peRatioMax: 30,
        sector: "Technology",
      });
      
      const ticker = step4.stocks?.[0]?.ticker || "MSFT";
      
      await orchestrator.executeStep(session.sessionId, 5, { ticker });
      await orchestrator.executeStep(session.sessionId, 6, { ticker });
      await orchestrator.executeStep(session.sessionId, 7, {
        ticker,
        peerTickers: ["AAPL", "GOOGL"],
      });

      // Execute Step 8 - Technical Trends (not skipped)
      const step8Result = await orchestrator.executeStep(session.sessionId, 8, {
        ticker,
        indicators: ["moving average"],
      });
      expect(step8Result.success).toBe(true);
      expect(step8Result.trend).toBeDefined();

      // Continue with remaining steps
      await orchestrator.executeStep(session.sessionId, 9, { ticker });
      const step10 = await orchestrator.executeStep(session.sessionId, 10, {
        ticker,
        portfolioSize: 100000,
        riskModel: "aggressive",
      });
      await orchestrator.executeStep(session.sessionId, 11, {
        ticker,
        quantity: step10.sharesToBuy,
        brokerPlatform: "Test Broker",
      });
      await orchestrator.executeStep(session.sessionId, 12, {
        ticker,
        alertApp: "SMS",
        reviewFrequency: "yearly",
      });

      const finalStatus = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(finalStatus.progress).toBe(100);
    });
  });

  describe("Workflow State Management", () => {
    skipIfNoDb()("should persist workflow state across multiple sessions", async () => {
      const { StateManager } = await import("@/lib/state-manager");
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const stepProcessors = await import("@/lib/step-processors");

      const stateManager = new StateManager();
      const orchestrator = new WorkflowOrchestrator(stateManager);

      // Register processors
      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
      orchestrator.registerStepProcessor(new stepProcessors.MarketConditionsProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.SectorIdentificationProcessor());

      // Create profile
      const profile: InvestmentProfile = {
        userId: testUserId,
        riskTolerance: "low" as const,
        investmentHorizonYears: 20,
        capitalAvailable: 25000,
        longTermGoals: "capital preservation" as const,
        createdAt: new Date(),
      };
      await stateManager.saveUserProfile(testUserId, profile);

      // Start workflow and execute first 3 steps
      const session = await orchestrator.startWorkflow(testUserId);
      createdSessionIds.push(session.sessionId);

      await orchestrator.executeStep(session.sessionId, 1, {
        userId: testUserId,
        riskTolerance: "low",
        investmentHorizonYears: 20,
        capitalAvailable: 25000,
        longTermGoals: "capital preservation",
      });
      await orchestrator.executeStep(session.sessionId, 2, {});
      await orchestrator.executeStep(session.sessionId, 3, {});

      // Create new orchestrator instance (simulating new session)
      const newOrchestrator = new WorkflowOrchestrator(stateManager);
      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
      orchestrator.registerStepProcessor(new stepProcessors.MarketConditionsProcessor());
      orchestrator.registerStepProcessor(new stepProcessors.SectorIdentificationProcessor());

      // Retrieve workflow status
      const status = await newOrchestrator.getWorkflowStatus(session.sessionId);
      expect(status.currentStep).toBe(4);
      expect(status.progress).toBeGreaterThan(0);

      // Retrieve session data
      const retrievedSession = await stateManager.getSession(session.sessionId);
      expect(retrievedSession.completedSteps).toContain(1);
      expect(retrievedSession.completedSteps).toContain(2);
      expect(retrievedSession.completedSteps).toContain(3);
      expect(retrievedSession.stepData.size).toBe(3);
    });

    skipIfNoDb()("should handle workflow reset correctly", async () => {
      const { StateManager } = await import("@/lib/state-manager");
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const stepProcessors = await import("@/lib/step-processors");

      const stateManager = new StateManager();
      const orchestrator = new WorkflowOrchestrator(stateManager);

      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
      orchestrator.registerStepProcessor(new stepProcessors.MarketConditionsProcessor());

      await stateManager.saveUserProfile(testUserId, {
        userId: testUserId,
        riskTolerance: "medium",
        investmentHorizonYears: 10,
        capitalAvailable: 50000,
        longTermGoals: "steady growth",
        createdAt: new Date(),
      });

      const session = await orchestrator.startWorkflow(testUserId);
      createdSessionIds.push(session.sessionId);

      // Execute some steps
      await orchestrator.executeStep(session.sessionId, 1, {
        userId: testUserId,
        riskTolerance: "medium",
        investmentHorizonYears: 10,
        capitalAvailable: 50000,
        longTermGoals: "steady growth",
      });
      await orchestrator.executeStep(session.sessionId, 2, {});

      // Reset workflow
      await orchestrator.resetWorkflow(session.sessionId);

      // Verify reset
      const status = await orchestrator.getWorkflowStatus(session.sessionId);
      expect(status.currentStep).toBe(1);
      expect(status.progress).toBe(0);

      const resetSession = await stateManager.getSession(session.sessionId);
      expect(resetSession.completedSteps).toEqual([]);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    skipIfNoDb()("should handle invalid step execution gracefully", async () => {
      const { StateManager } = await import("@/lib/state-manager");
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const stepProcessors = await import("@/lib/step-processors");

      const stateManager = new StateManager();
      const orchestrator = new WorkflowOrchestrator(stateManager);

      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));

      const session = await orchestrator.startWorkflow(testUserId);
      createdSessionIds.push(session.sessionId);

      // Try to execute step with invalid inputs
      const result = await orchestrator.executeStep(session.sessionId, 1, {
        // Missing required fields
        userId: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    skipIfNoDb()("should prevent skipping non-optional steps", async () => {
      const { StateManager } = await import("@/lib/state-manager");
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const stepProcessors = await import("@/lib/step-processors");

      const stateManager = new StateManager();
      const orchestrator = new WorkflowOrchestrator(stateManager);

      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));

      const session = await orchestrator.startWorkflow(testUserId);
      createdSessionIds.push(session.sessionId);

      // Try to skip step 1 (not optional)
      await expect(
        orchestrator.skipOptionalStep(session.sessionId, 1)
      ).rejects.toThrow("not optional");
    });

    skipIfNoDb()("should handle non-existent session gracefully", async () => {
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const { StateManager } = await import("@/lib/state-manager");

      const stateManager = new StateManager();
      const orchestrator = new WorkflowOrchestrator(stateManager);

      await expect(
        orchestrator.getWorkflowStatus("non-existent-session")
      ).rejects.toThrow("not found");
    });

    skipIfNoDb()("should handle data source failures with fallbacks", async () => {
      const { StateManager } = await import("@/lib/state-manager");
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const stepProcessors = await import("@/lib/step-processors");

      const stateManager = new StateManager();
      const orchestrator = new WorkflowOrchestrator(stateManager);

      orchestrator.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
      orchestrator.registerStepProcessor(new stepProcessors.MarketConditionsProcessor());

      await stateManager.saveUserProfile(testUserId, {
        userId: testUserId,
        riskTolerance: "medium",
        investmentHorizonYears: 10,
        capitalAvailable: 50000,
        longTermGoals: "steady growth",
        createdAt: new Date(),
      });

      const session = await orchestrator.startWorkflow(testUserId);
      createdSessionIds.push(session.sessionId);

      await orchestrator.executeStep(session.sessionId, 1, {
        userId: testUserId,
        riskTolerance: "medium",
        investmentHorizonYears: 10,
        capitalAvailable: 50000,
        longTermGoals: "steady growth",
      });

      // Execute step 2 - may have warnings if data sources fail
      const result = await orchestrator.executeStep(session.sessionId, 2, {});
      
      // Should succeed even with potential data source issues
      expect(result.success).toBe(true);
      
      // May have warnings about fallback data
      if (result.warnings) {
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });
  });

  describe("Multiple User Workflows", () => {
    skipIfNoDb()("should handle concurrent workflows for different users", async () => {
      const { StateManager } = await import("@/lib/state-manager");
      const { WorkflowOrchestrator } = await import("@/lib/workflow-orchestrator");
      const stepProcessors = await import("@/lib/step-processors");

      const stateManager = new StateManager();
      
      const user1Id = `${testUserId}-1`;
      const user2Id = `${testUserId}-2`;

      // Create profiles for both users
      await stateManager.saveUserProfile(user1Id, {
        userId: user1Id,
        riskTolerance: "low",
        investmentHorizonYears: 15,
        capitalAvailable: 30000,
        longTermGoals: "capital preservation",
        createdAt: new Date(),
      });

      await stateManager.saveUserProfile(user2Id, {
        userId: user2Id,
        riskTolerance: "high",
        investmentHorizonYears: 5,
        capitalAvailable: 75000,
        longTermGoals: "steady growth",
        createdAt: new Date(),
      });

      // Start workflows for both users
      const orchestrator1 = new WorkflowOrchestrator(stateManager);
      const orchestrator2 = new WorkflowOrchestrator(stateManager);

      orchestrator1.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));
      orchestrator2.registerStepProcessor(new stepProcessors.ProfileDefinitionProcessor(stateManager));

      const session1 = await orchestrator1.startWorkflow(user1Id);
      const session2 = await orchestrator2.startWorkflow(user2Id);

      createdSessionIds.push(session1.sessionId, session2.sessionId);

      // Execute steps for both users
      await orchestrator1.executeStep(session1.sessionId, 1, {
        userId: user1Id,
        riskTolerance: "low",
        investmentHorizonYears: 15,
        capitalAvailable: 30000,
        longTermGoals: "capital preservation",
      });

      await orchestrator2.executeStep(session2.sessionId, 1, {
        userId: user2Id,
        riskTolerance: "high",
        investmentHorizonYears: 5,
        capitalAvailable: 75000,
        longTermGoals: "steady growth",
      });

      // Verify both sessions are independent
      const status1 = await orchestrator1.getWorkflowStatus(session1.sessionId);
      const status2 = await orchestrator2.getWorkflowStatus(session2.sessionId);

      expect(status1.sessionId).not.toBe(status2.sessionId);
      expect(status1.currentStep).toBe(2);
      expect(status2.currentStep).toBe(2);

      // Verify step data is separate
      const session1Data = await stateManager.getSession(session1.sessionId);
      const session2Data = await stateManager.getSession(session2.sessionId);

      const step1Data1 = session1Data.stepData.get(1);
      const step1Data2 = session2Data.stepData.get(1);

      expect(step1Data1?.riskTolerance).toBe("low");
      expect(step1Data2?.riskTolerance).toBe("high");

      // Cleanup
      await prisma.stepData.deleteMany({
        where: {
          session: {
            userId: { in: [user1Id, user2Id] },
          },
        },
      });
      await prisma.workflowSession.deleteMany({
        where: { userId: { in: [user1Id, user2Id] } },
      });
      await prisma.investmentProfile.deleteMany({
        where: { userId: { in: [user1Id, user2Id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [user1Id, user2Id] } },
      });
    });
  });
});
