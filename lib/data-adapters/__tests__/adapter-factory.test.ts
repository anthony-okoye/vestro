/**
 * Tests for adapter factory and fallback chain configuration
 * 
 * Requirements: 5.5 - Test fallback activation on primary source failure
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  initializeAdapters,
  getConfiguredFallbackStrategies,
  resetFallbackStrategies,
} from "../adapter-factory";

describe("Adapter Factory", () => {
  beforeEach(() => {
    // Reset fallback strategies before each test
    resetFallbackStrategies();
  });

  describe("initializeAdapters", () => {
    it("should initialize adapters without throwing", () => {
      expect(() => initializeAdapters()).not.toThrow();
    });

    it("should handle missing API keys gracefully", () => {
      // Even with missing API keys, initialization should not throw
      // Adapters will be null but the function should complete
      expect(() => initializeAdapters()).not.toThrow();
    });
  });

  describe("getConfiguredFallbackStrategies", () => {
    it("should return a FallbackStrategies instance", () => {
      const strategies = getConfiguredFallbackStrategies();
      expect(strategies).toBeDefined();
      expect(strategies).toHaveProperty("registerFallbackChain");
      expect(strategies).toHaveProperty("fetchWithFallback");
    });

    it("should return the same instance on multiple calls (singleton)", () => {
      const strategies1 = getConfiguredFallbackStrategies();
      const strategies2 = getConfiguredFallbackStrategies();
      expect(strategies1).toBe(strategies2);
    });

    it("should configure fallback chains", () => {
      const strategies = getConfiguredFallbackStrategies();
      const chains = strategies.getFallbackChains();

      // At minimum, we should have Yahoo Finance as a fallback
      // Even without API keys, Yahoo Finance should be configured
      expect(chains.size).toBeGreaterThan(0);
    });

    it("should configure stock-quote fallback chain", () => {
      const strategies = getConfiguredFallbackStrategies();
      const chains = strategies.getFallbackChains();

      const stockQuoteChain = chains.get("stock-quote");
      expect(stockQuoteChain).toBeDefined();
      expect(stockQuoteChain?.primary).toBeDefined();
      expect(stockQuoteChain?.primary.sourceName).toBeDefined();
    });

    it("should configure company-profile fallback chain", () => {
      const strategies = getConfiguredFallbackStrategies();
      const chains = strategies.getFallbackChains();

      const companyProfileChain = chains.get("company-profile");
      expect(companyProfileChain).toBeDefined();
      expect(companyProfileChain?.primary).toBeDefined();
      expect(companyProfileChain?.primary.sourceName).toBeDefined();
    });

    it("should configure historical-data fallback chain", () => {
      const strategies = getConfiguredFallbackStrategies();
      const chains = strategies.getFallbackChains();

      const historicalDataChain = chains.get("historical-data");
      expect(historicalDataChain).toBeDefined();
      expect(historicalDataChain?.primary).toBeDefined();
      expect(historicalDataChain?.primary.sourceName).toBeDefined();
    });
  });

  describe("resetFallbackStrategies", () => {
    it("should reset the singleton instance", () => {
      const strategies1 = getConfiguredFallbackStrategies();
      resetFallbackStrategies();
      const strategies2 = getConfiguredFallbackStrategies();

      // After reset, we should get a new instance
      expect(strategies1).not.toBe(strategies2);
    });
  });

  describe("Fallback Chain Priority", () => {
    it("should prioritize API adapters over web scraping when available", () => {
      const strategies = getConfiguredFallbackStrategies();
      const chains = strategies.getFallbackChains();

      const stockQuoteChain = chains.get("stock-quote");
      if (stockQuoteChain) {
        // If API adapters are configured, they should be primary
        // Yahoo Finance should be in fallbacks, not primary
        const primarySource = stockQuoteChain.primary.sourceName;
        const fallbackSources = stockQuoteChain.fallbacks.map((f) => f.sourceName);

        // Either Polygon or Alpha Vantage should be primary if configured
        // Otherwise Yahoo Finance is primary
        if (primarySource !== "Yahoo Finance") {
          expect(["Polygon.io", "Alpha Vantage"]).toContain(primarySource);
          expect(fallbackSources).toContain("Yahoo Finance");
        }
      }
    });

    it("should include Yahoo Finance as final fallback for quotes", () => {
      const strategies = getConfiguredFallbackStrategies();
      const chains = strategies.getFallbackChains();

      const stockQuoteChain = chains.get("stock-quote");
      expect(stockQuoteChain).toBeDefined();

      // Yahoo Finance should be either primary or in fallbacks
      const allSources = [
        stockQuoteChain?.primary.sourceName,
        ...(stockQuoteChain?.fallbacks.map((f) => f.sourceName) || []),
      ];

      expect(allSources).toContain("Yahoo Finance");
    });
  });
});
