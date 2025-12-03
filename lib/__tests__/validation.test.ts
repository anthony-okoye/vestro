import { describe, it, expect } from "vitest";
import {
  validateRiskTolerance,
  validateInvestmentHorizon,
  validateCapitalAvailable,
  validateInvestmentGoals,
  validateInvestmentProfile,
  validateMarketCap,
  validateDividendYield,
  validatePERatio,
  validateSector,
  validateScreeningFilters,
  validatePortfolioSize,
  validateRiskModel,
  validateReviewFrequency,
  validateAlertApp,
  validateBrokerPlatform,
  validateTicker,
} from "../validation";

describe("Investment Profile Validation", () => {
  describe("validateRiskTolerance", () => {
    it("should accept valid risk tolerance values", () => {
      expect(validateRiskTolerance("low").isValid).toBe(true);
      expect(validateRiskTolerance("medium").isValid).toBe(true);
      expect(validateRiskTolerance("high").isValid).toBe(true);
    });

    it("should reject invalid enum values", () => {
      const result = validateRiskTolerance("invalid");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Risk tolerance must be one of: low, medium, high"
      );
    });

    it("should reject missing required field", () => {
      const result1 = validateRiskTolerance(undefined);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Risk tolerance is required");

      const result2 = validateRiskTolerance(null);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain("Risk tolerance is required");
    });
  });

  describe("validateInvestmentHorizon", () => {
    it("should accept valid positive integers", () => {
      expect(validateInvestmentHorizon(1).isValid).toBe(true);
      expect(validateInvestmentHorizon(10).isValid).toBe(true);
      expect(validateInvestmentHorizon(50).isValid).toBe(true);
    });

    it("should reject negative values", () => {
      const result = validateInvestmentHorizon(-5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Investment horizon must be greater than 0 years"
      );
    });

    it("should reject zero", () => {
      const result = validateInvestmentHorizon(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Investment horizon must be greater than 0 years"
      );
    });

    it("should reject non-integer values", () => {
      const result = validateInvestmentHorizon(5.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Investment horizon must be an integer");
    });

    it("should reject missing required field", () => {
      const result1 = validateInvestmentHorizon(undefined);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Investment horizon is required");

      const result2 = validateInvestmentHorizon(null);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain("Investment horizon is required");
    });

    it("should reject excessively large values", () => {
      const result = validateInvestmentHorizon(150);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Investment horizon must be 100 years or less"
      );
    });
  });

  describe("validateCapitalAvailable", () => {
    it("should accept valid positive numbers", () => {
      expect(validateCapitalAvailable(1000).isValid).toBe(true);
      expect(validateCapitalAvailable(50000.5).isValid).toBe(true);
      expect(validateCapitalAvailable(0.01).isValid).toBe(true);
    });

    it("should reject negative values", () => {
      const result = validateCapitalAvailable(-1000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Capital available must be greater than 0"
      );
    });

    it("should reject zero", () => {
      const result = validateCapitalAvailable(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Capital available must be greater than 0"
      );
    });

    it("should reject missing required field", () => {
      const result1 = validateCapitalAvailable(undefined);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Capital available is required");

      const result2 = validateCapitalAvailable(null);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain("Capital available is required");
    });

    it("should reject non-numeric values", () => {
      const result = validateCapitalAvailable("not a number");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Capital available must be a number");
    });
  });

  describe("validateInvestmentGoals", () => {
    it("should accept valid goal values", () => {
      expect(validateInvestmentGoals("steady growth").isValid).toBe(true);
      expect(validateInvestmentGoals("dividend income").isValid).toBe(true);
      expect(validateInvestmentGoals("capital preservation").isValid).toBe(
        true
      );
    });

    it("should reject invalid enum values", () => {
      const result = validateInvestmentGoals("get rich quick");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Investment goals must be one of: steady growth, dividend income, capital preservation"
      );
    });

    it("should reject missing required field", () => {
      const result1 = validateInvestmentGoals(undefined);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Investment goals are required");

      const result2 = validateInvestmentGoals(null);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain("Investment goals are required");
    });
  });

  describe("validateInvestmentProfile", () => {
    it("should accept valid complete profile", () => {
      const profile = {
        riskTolerance: "medium",
        investmentHorizonYears: 10,
        capitalAvailable: 50000,
        longTermGoals: "steady growth",
      };
      const result = validateInvestmentProfile(profile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should collect all validation errors", () => {
      const profile = {
        riskTolerance: "invalid",
        investmentHorizonYears: -5,
        capitalAvailable: 0,
        longTermGoals: undefined,
      };
      const result = validateInvestmentProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it("should reject profile with missing required fields", () => {
      const profile = {};
      const result = validateInvestmentProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Risk tolerance is required");
      expect(result.errors).toContain("Investment horizon is required");
      expect(result.errors).toContain("Capital available is required");
      expect(result.errors).toContain("Investment goals are required");
    });
  });
});

describe("Screening Filters Validation", () => {
  describe("validateMarketCap", () => {
    it("should accept valid market cap values", () => {
      expect(validateMarketCap("large").isValid).toBe(true);
      expect(validateMarketCap("mid").isValid).toBe(true);
      expect(validateMarketCap("small").isValid).toBe(true);
    });

    it("should accept undefined for optional field", () => {
      expect(validateMarketCap(undefined).isValid).toBe(true);
      expect(validateMarketCap(null).isValid).toBe(true);
    });

    it("should reject invalid enum values", () => {
      const result = validateMarketCap("mega");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Market cap must be one of: large, mid, small"
      );
    });
  });

  describe("validateDividendYield", () => {
    it("should accept valid positive numbers", () => {
      expect(validateDividendYield(0).isValid).toBe(true);
      expect(validateDividendYield(2.5).isValid).toBe(true);
      expect(validateDividendYield(10).isValid).toBe(true);
    });

    it("should accept undefined for optional field", () => {
      expect(validateDividendYield(undefined).isValid).toBe(true);
    });

    it("should reject negative values", () => {
      const result = validateDividendYield(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Dividend yield cannot be negative");
    });

    it("should reject values over 100", () => {
      const result = validateDividendYield(150);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Dividend yield cannot exceed 100%");
    });
  });

  describe("validatePERatio", () => {
    it("should accept valid positive numbers", () => {
      expect(validatePERatio(10).isValid).toBe(true);
      expect(validatePERatio(25.5).isValid).toBe(true);
    });

    it("should accept undefined for optional field", () => {
      expect(validatePERatio(undefined).isValid).toBe(true);
    });

    it("should reject negative values", () => {
      const result = validatePERatio(-5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("PE ratio cannot be negative");
    });
  });

  describe("validateSector", () => {
    it("should accept valid sector strings", () => {
      expect(validateSector("Technology").isValid).toBe(true);
      expect(validateSector("Healthcare").isValid).toBe(true);
    });

    it("should accept undefined for optional field", () => {
      expect(validateSector(undefined).isValid).toBe(true);
    });

    it("should reject empty strings", () => {
      const result = validateSector("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Sector cannot be empty");
    });

    it("should reject non-string values", () => {
      const result = validateSector(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Sector must be a string");
    });
  });

  describe("validateScreeningFilters", () => {
    it("should accept valid complete filters", () => {
      const filters = {
        marketCap: "large",
        dividendYieldMin: 2.5,
        peRatioMax: 20,
        sector: "Technology",
        minPrice: 50,
        maxPrice: 200,
      };
      const result = validateScreeningFilters(filters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept empty filters object", () => {
      const result = validateScreeningFilters({});
      expect(result.isValid).toBe(true);
    });

    it("should reject when minPrice > maxPrice", () => {
      const filters = {
        minPrice: 200,
        maxPrice: 50,
      };
      const result = validateScreeningFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Minimum price cannot be greater than maximum price"
      );
    });

    it("should reject negative prices", () => {
      const filters = {
        minPrice: -10,
        maxPrice: -5,
      };
      const result = validateScreeningFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Minimum price cannot be negative");
      expect(result.errors).toContain("Maximum price cannot be negative");
    });
  });
});

describe("Additional Validation Functions", () => {
  describe("validatePortfolioSize", () => {
    it("should accept valid positive numbers", () => {
      expect(validatePortfolioSize(10000).isValid).toBe(true);
      expect(validatePortfolioSize(100000.5).isValid).toBe(true);
    });

    it("should reject negative values", () => {
      const result = validatePortfolioSize(-5000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Portfolio size must be greater than 0");
    });

    it("should reject zero", () => {
      const result = validatePortfolioSize(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Portfolio size must be greater than 0");
    });

    it("should reject missing required field", () => {
      const result = validatePortfolioSize(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Portfolio size is required");
    });
  });

  describe("validateRiskModel", () => {
    it("should accept valid risk model values", () => {
      expect(validateRiskModel("conservative").isValid).toBe(true);
      expect(validateRiskModel("balanced").isValid).toBe(true);
      expect(validateRiskModel("aggressive").isValid).toBe(true);
    });

    it("should reject invalid enum values", () => {
      const result = validateRiskModel("risky");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Risk model must be one of: conservative, balanced, aggressive"
      );
    });

    it("should reject missing required field", () => {
      const result = validateRiskModel(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Risk model is required");
    });
  });

  describe("validateReviewFrequency", () => {
    it("should accept valid frequency values", () => {
      expect(validateReviewFrequency("quarterly").isValid).toBe(true);
      expect(validateReviewFrequency("yearly").isValid).toBe(true);
    });

    it("should reject invalid enum values", () => {
      const result = validateReviewFrequency("monthly");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Review frequency must be one of: quarterly, yearly"
      );
    });

    it("should reject missing required field", () => {
      const result = validateReviewFrequency(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Review frequency is required");
    });
  });

  describe("validateAlertApp", () => {
    it("should accept valid app names", () => {
      expect(validateAlertApp("TradingView").isValid).toBe(true);
      expect(validateAlertApp("Yahoo Finance").isValid).toBe(true);
    });

    it("should reject empty strings", () => {
      const result = validateAlertApp("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Alert application name cannot be empty"
      );
    });

    it("should reject missing required field", () => {
      const result = validateAlertApp(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Alert application name is required");
    });

    it("should reject non-string values", () => {
      const result = validateAlertApp(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Alert application name must be a string");
    });
  });

  describe("validateBrokerPlatform", () => {
    it("should accept valid platform names", () => {
      expect(validateBrokerPlatform("E*TRADE").isValid).toBe(true);
      expect(validateBrokerPlatform("TD Ameritrade").isValid).toBe(true);
    });

    it("should reject empty strings", () => {
      const result = validateBrokerPlatform("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Broker platform name cannot be empty");
    });

    it("should reject missing required field", () => {
      const result = validateBrokerPlatform(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Broker platform name is required");
    });
  });

  describe("validateTicker", () => {
    it("should accept valid ticker symbols", () => {
      expect(validateTicker("AAPL").isValid).toBe(true);
      expect(validateTicker("MSFT").isValid).toBe(true);
      expect(validateTicker("A").isValid).toBe(true);
      expect(validateTicker("GOOGL").isValid).toBe(true);
    });

    it("should reject lowercase tickers", () => {
      const result = validateTicker("aapl");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Ticker symbol must be 1-5 uppercase letters"
      );
    });

    it("should reject tickers with numbers", () => {
      const result = validateTicker("AAP1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Ticker symbol must be 1-5 uppercase letters"
      );
    });

    it("should reject tickers longer than 5 characters", () => {
      const result = validateTicker("TOOLONG");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Ticker symbol must be 1-5 uppercase letters"
      );
    });

    it("should reject empty strings", () => {
      const result = validateTicker("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Ticker symbol cannot be empty");
    });

    it("should reject missing required field", () => {
      const result = validateTicker(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Ticker symbol is required");
    });
  });
});
