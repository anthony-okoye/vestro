import { describe, it, expect, beforeEach, vi } from "vitest";
import { TechnicalTrendsProcessor } from "../technical-trends-processor";
import { TradingViewAdapter } from "../../data-adapters/tradingview-adapter";
import { WorkflowContext, TechnicalSignals } from "../../types";

describe("TechnicalTrendsProcessor", () => {
  let processor: TechnicalTrendsProcessor;
  let mockAdapter: TradingViewAdapter;

  beforeEach(() => {
    mockAdapter = {
      fetchTechnicalSignals: vi.fn(),
      fetchIndicator: vi.fn(),
    } as any;

    processor = new TechnicalTrendsProcessor(mockAdapter);
  });

  describe("validateInputs", () => {
    it("should validate valid inputs", () => {
      const result = processor.validateInputs({
        ticker: "AAPL",
        indicator: "moving average",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject missing ticker", () => {
      const result = processor.validateInputs({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Ticker symbol is required");
    });

    it("should reject invalid ticker type", () => {
      const result = processor.validateInputs({ ticker: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Ticker symbol is required");
    });

    it("should reject ticker longer than 10 characters", () => {
      const result = processor.validateInputs({ ticker: "VERYLONGTICKER" });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Ticker symbol must be 10 characters or less");
    });

    it("should reject invalid indicator", () => {
      const result = processor.validateInputs({
        ticker: "AAPL",
        indicator: "invalid",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Invalid indicator");
    });

    it("should accept valid indicators", () => {
      const result1 = processor.validateInputs({
        ticker: "AAPL",
        indicator: "moving average",
      });
      expect(result1.isValid).toBe(true);

      const result2 = processor.validateInputs({
        ticker: "AAPL",
        indicator: "RSI",
      });
      expect(result2.isValid).toBe(true);
    });
  });

  describe("execute", () => {
    const mockContext: WorkflowContext = {
      sessionId: "test-session",
      userId: "test-user",
      previousStepData: new Map(),
    };

    it("should fetch technical signals successfully", async () => {
      const mockSignals: TechnicalSignals = {
        ticker: "AAPL",
        trend: "upward",
        maCross: true,
        rsi: 65,
        analyzedAt: new Date(),
      };

      vi.mocked(mockAdapter.fetchTechnicalSignals).mockResolvedValue(mockSignals);

      const result = await processor.execute(
        { ticker: "AAPL" },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.technicalSignals).toEqual(mockSignals);
      expect(mockAdapter.fetchTechnicalSignals).toHaveBeenCalledWith("AAPL");
    });

    it("should fetch indicator data when requested", async () => {
      const mockSignals: TechnicalSignals = {
        ticker: "AAPL",
        trend: "upward",
        maCross: false,
        analyzedAt: new Date(),
      };

      const mockIndicatorData = {
        sma20: 150.5,
        sma50: 145.2,
        sma200: 140.1,
      };

      vi.mocked(mockAdapter.fetchTechnicalSignals).mockResolvedValue(mockSignals);
      vi.mocked(mockAdapter.fetchIndicator).mockResolvedValue(mockIndicatorData);

      const result = await processor.execute(
        { ticker: "AAPL", indicator: "moving average" },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.technicalSignals).toEqual(mockSignals);
      expect(result.indicatorData).toEqual(mockIndicatorData);
      expect(mockAdapter.fetchIndicator).toHaveBeenCalledWith("AAPL", "moving average");
    });

    it("should handle technical signals fetch failure", async () => {
      vi.mocked(mockAdapter.fetchTechnicalSignals).mockRejectedValue(
        new Error("API unavailable")
      );

      const result = await processor.execute(
        { ticker: "AAPL" },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatch(/Failed to fetch technical signals from all sources/);
    });

    it("should handle indicator fetch failure gracefully", async () => {
      const mockSignals: TechnicalSignals = {
        ticker: "AAPL",
        trend: "sideways",
        maCross: false,
        analyzedAt: new Date(),
      };

      vi.mocked(mockAdapter.fetchTechnicalSignals).mockResolvedValue(mockSignals);
      vi.mocked(mockAdapter.fetchIndicator).mockRejectedValue(
        new Error("Indicator unavailable")
      );

      const result = await processor.execute(
        { ticker: "AAPL", indicator: "RSI" },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.technicalSignals).toEqual(mockSignals);
      expect(result.warnings).toContain("Failed to fetch RSI data: Indicator unavailable");
    });

    it("should return error for invalid inputs", async () => {
      const result = await processor.execute(
        { ticker: "" },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("metadata", () => {
    it("should have correct step metadata", () => {
      expect(processor.stepId).toBe(8);
      expect(processor.stepName).toBe("Technical Trends");
      expect(processor.isOptional).toBe(true);
    });

    it("should return required inputs schema", () => {
      const inputs = processor.getRequiredInputs();

      expect(inputs).toHaveLength(2);
      expect(inputs[0].name).toBe("ticker");
      expect(inputs[0].required).toBe(true);
      expect(inputs[1].name).toBe("indicator");
      expect(inputs[1].required).toBe(false);
    });

    it("should return output schema", () => {
      const schema = processor.getOutputSchema();

      expect(schema.technicalSignals).toBeDefined();
      expect(schema.indicatorData).toBeDefined();
    });
  });
});
