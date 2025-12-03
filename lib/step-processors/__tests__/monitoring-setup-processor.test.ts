import { describe, it, expect } from "vitest";
import { MonitoringSetupProcessor } from "../monitoring-setup-processor";
import { WorkflowContext } from "../../types";

describe("MonitoringSetupProcessor", () => {
  const processor = new MonitoringSetupProcessor();

  const mockContext: WorkflowContext = {
    sessionId: "test-session",
    userId: "test-user",
    previousStepData: new Map(),
  };

  describe("validateInputs", () => {
    it("should validate correct inputs", () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "quarterly",
        ticker: "AAPL",
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject missing alert app", () => {
      const inputs = {
        reviewFrequency: "quarterly",
        ticker: "AAPL",
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Alert application name is required");
    });

    it("should reject empty alert app", () => {
      const inputs = {
        alertApp: "   ",
        reviewFrequency: "quarterly",
        ticker: "AAPL",
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Alert application name cannot be empty");
    });

    it("should reject missing review frequency", () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        ticker: "AAPL",
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Review frequency is required");
    });

    it("should reject invalid review frequency", () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "monthly",
        ticker: "AAPL",
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid review frequency"))).toBe(true);
    });

    it("should reject missing ticker", () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "quarterly",
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Ticker symbol is required");
    });

    it("should validate optional alert thresholds", () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "quarterly",
        ticker: "AAPL",
        priceDropPercent: 10,
        priceGainPercent: 20,
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid price drop percent", () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "quarterly",
        ticker: "AAPL",
        priceDropPercent: -5,
      };

      const result = processor.validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Price drop percent"))).toBe(true);
    });
  });

  describe("execute", () => {
    it("should create monitoring plan with quarterly review", async () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "quarterly",
        ticker: "AAPL",
      };

      const result = await processor.execute(inputs, mockContext);

      expect(result.success).toBe(true);
      expect(result.monitoringPlan).toBeDefined();
      expect(result.monitoringPlan.ticker).toBe("AAPL");
      expect(result.monitoringPlan.priceAlertsSet).toBe(true);
      expect(result.monitoringPlan.earningsReviewPlanned).toBe(true);
      expect(result.monitoringPlan.reviewFrequency).toBe("quarterly");
      expect(result.monitoringPlan.nextReviewDate).toBeInstanceOf(Date);
    });

    it("should create monitoring plan with yearly review", async () => {
      const inputs = {
        alertApp: "Robinhood",
        reviewFrequency: "yearly",
        ticker: "MSFT",
      };

      const result = await processor.execute(inputs, mockContext);

      expect(result.success).toBe(true);
      expect(result.monitoringPlan).toBeDefined();
      expect(result.monitoringPlan.reviewFrequency).toBe("yearly");
    });

    it("should include alert thresholds when provided", async () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "quarterly",
        ticker: "AAPL",
        priceDropPercent: 15,
        priceGainPercent: 25,
      };

      const result = await processor.execute(inputs, mockContext);

      expect(result.success).toBe(true);
      expect(result.monitoringPlan.alertThresholds).toBeDefined();
      expect(result.monitoringPlan.alertThresholds?.priceDropPercent).toBe(15);
      expect(result.monitoringPlan.alertThresholds?.priceGainPercent).toBe(25);
    });

    it("should calculate next review date 3 months ahead for quarterly", async () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "quarterly",
        ticker: "AAPL",
      };

      const beforeExecution = new Date();
      const result = await processor.execute(inputs, mockContext);
      const afterExecution = new Date();

      expect(result.success).toBe(true);
      const nextReview = result.monitoringPlan.nextReviewDate;
      
      // Should be approximately 3 months from now
      const threeMonthsFromNow = new Date(beforeExecution);
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      const timeDiff = Math.abs(nextReview.getTime() - threeMonthsFromNow.getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeLessThan(1); // Should be within 1 day
    });

    it("should calculate next review date 1 year ahead for yearly", async () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        reviewFrequency: "yearly",
        ticker: "AAPL",
      };

      const beforeExecution = new Date();
      const result = await processor.execute(inputs, mockContext);

      expect(result.success).toBe(true);
      const nextReview = result.monitoringPlan.nextReviewDate;
      
      // Should be approximately 1 year from now
      const oneYearFromNow = new Date(beforeExecution);
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      const timeDiff = Math.abs(nextReview.getTime() - oneYearFromNow.getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeLessThan(1); // Should be within 1 day
    });

    it("should fail with invalid inputs", async () => {
      const inputs = {
        alertApp: "Yahoo Finance",
        // Missing reviewFrequency and ticker
      };

      const result = await processor.execute(inputs, mockContext);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe("getRequiredInputs", () => {
    it("should return correct input schema", () => {
      const inputs = processor.getRequiredInputs();

      expect(inputs).toHaveLength(5);
      expect(inputs.find((i) => i.name === "alertApp")?.required).toBe(true);
      expect(inputs.find((i) => i.name === "reviewFrequency")?.required).toBe(true);
      expect(inputs.find((i) => i.name === "ticker")?.required).toBe(true);
      expect(inputs.find((i) => i.name === "priceDropPercent")?.required).toBe(false);
      expect(inputs.find((i) => i.name === "priceGainPercent")?.required).toBe(false);
    });
  });

  describe("getOutputSchema", () => {
    it("should return correct output schema", () => {
      const schema = processor.getOutputSchema();

      expect(schema.monitoringPlan).toBeDefined();
      expect(schema.monitoringPlan.type).toBe("MonitoringPlan");
    });
  });
});
