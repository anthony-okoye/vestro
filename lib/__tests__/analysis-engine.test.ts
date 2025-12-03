import { describe, it, expect } from "vitest";
import { AnalysisEngine } from "../analysis-engine";
import { InvestmentProfile, RiskModel } from "../types";

describe("AnalysisEngine", () => {
  const engine = new AnalysisEngine();

  describe("scoreSectors", () => {
    it("should score and rank sectors based on growth indicators", () => {
      const sectorData = [
        {
          sectorName: "Technology",
          growthRate: 15,
          marketCap: 5000000000000,
          momentum: 0.8,
        },
        {
          sectorName: "Healthcare",
          growthRate: 8,
          marketCap: 3000000000000,
          momentum: 0.6,
        },
        {
          sectorName: "Energy",
          growthRate: 3,
          marketCap: 2000000000000,
          momentum: 0.3,
        },
      ];

      const industryReports = [
        {
          sector: "Technology",
          outlook: "Strong growth expected in AI and cloud computing",
        },
      ];

      const rankings = engine.scoreSectors(sectorData, industryReports);

      // Verify rankings are returned
      expect(rankings).toHaveLength(3);

      // Verify sectors are sorted by score in descending order (Requirement 3.5)
      expect(rankings[0].sectorName).toBe("Technology");
      expect(rankings[1].sectorName).toBe("Healthcare");
      expect(rankings[2].sectorName).toBe("Energy");

      // Verify scores are calculated correctly
      expect(rankings[0].score).toBeGreaterThan(rankings[1].score);
      expect(rankings[1].score).toBeGreaterThan(rankings[2].score);

      // Verify rationale is generated
      expect(rankings[0].rationale).toContain("strong growth");
      expect(rankings[0].rationale).toContain("Industry outlook");

      // Verify data points are preserved
      expect(rankings[0].dataPoints.growthRate).toBe(15);
      expect(rankings[0].dataPoints.marketCap).toBe(5000000000000);
      expect(rankings[0].dataPoints.momentum).toBe(0.8);
    });

    it("should handle sectors with missing data", () => {
      const sectorData = [
        {
          sectorName: "Technology",
          // Missing growthRate, marketCap, momentum
        },
      ];

      const rankings = engine.scoreSectors(sectorData, []);

      expect(rankings).toHaveLength(1);
      expect(rankings[0].score).toBe(0);
      expect(rankings[0].dataPoints.growthRate).toBe(0);
    });

    it("should handle empty sector data", () => {
      const rankings = engine.scoreSectors([], []);
      expect(rankings).toHaveLength(0);
    });

    it("should generate appropriate rationale for different growth levels", () => {
      const sectorData = [
        {
          sectorName: "High Growth",
          growthRate: 12,
          marketCap: 1000000000000,
          momentum: 0.9,
        },
        {
          sectorName: "Moderate Growth",
          growthRate: 7,
          marketCap: 1000000000000,
          momentum: 0.5,
        },
        {
          sectorName: "Low Growth",
          growthRate: 2,
          marketCap: 1000000000000,
          momentum: 0.2,
        },
      ];

      const rankings = engine.scoreSectors(sectorData, []);

      expect(rankings[0].rationale).toContain("strong growth");
      expect(rankings[0].rationale).toContain("positive momentum");
      expect(rankings[1].rationale).toContain("moderate growth");
      expect(rankings[1].rationale).toContain("neutral momentum");
      expect(rankings[2].rationale).toContain("limited growth");
      expect(rankings[2].rationale).toContain("weak momentum");
    });
  });

  describe("calculateValuations", () => {
    it("should calculate PE and PB ratios from fundamentals", () => {
      const fundamentals = {
        ticker: "AAPL",
        peRatio: 25.5,
        pbRatio: 8.2,
      };

      const valuation = engine.calculateValuations(fundamentals, []);

      expect(valuation.ticker).toBe("AAPL");
      expect(valuation.peRatio).toBe(25.5);
      expect(valuation.pbRatio).toBe(8.2);
      expect(valuation.vsPeers).toContain("No peer data available");
    });

    it("should calculate PE ratio from price and EPS when not provided", () => {
      const fundamentals = {
        ticker: "AAPL",
        price: 150,
        earningsPerShare: 6,
        bookValuePerShare: 20,
      };

      const valuation = engine.calculateValuations(fundamentals, []);

      expect(valuation.peRatio).toBe(25); // 150 / 6
      expect(valuation.pbRatio).toBe(7.5); // 150 / 20
    });

    it("should compare against peer valuations", () => {
      const fundamentals = {
        ticker: "AAPL",
        peRatio: 20,
        pbRatio: 6,
        earningsPerShare: 6,
      };

      const peerData = [
        { ticker: "MSFT", peRatio: 30, pbRatio: 10 },
        { ticker: "GOOGL", peRatio: 25, pbRatio: 5 },
        { ticker: "META", peRatio: 20, pbRatio: 4 },
      ];

      const valuation = engine.calculateValuations(fundamentals, peerData);

      // Average peer PE: (30 + 25 + 20) / 3 = 25
      // AAPL PE (20) < 25 * 0.9 (22.5), so undervalued
      expect(valuation.vsPeers).toContain("undervalued");
      expect(valuation.vsPeers).toContain("25.00");

      // Fair value estimate based on peer average PE
      expect(valuation.fairValueEstimate).toBeDefined();
      expect(valuation.fairValueEstimate).toBe(150); // 25 * 6
    });

    it("should identify overvalued stocks", () => {
      const fundamentals = {
        ticker: "TSLA",
        peRatio: 100,
        pbRatio: 20,
      };

      const peerData = [
        { ticker: "F", peRatio: 10, pbRatio: 1.5 },
        { ticker: "GM", peRatio: 8, pbRatio: 1.2 },
      ];

      const valuation = engine.calculateValuations(fundamentals, peerData);

      // Average peer PE: (10 + 8) / 2 = 9
      // TSLA PE (100) > 9 * 1.1 (9.9), so overvalued
      expect(valuation.vsPeers).toContain("overvalued");
    });

    it("should identify fairly valued stocks", () => {
      const fundamentals = {
        ticker: "AAPL",
        peRatio: 25,
        pbRatio: 8,
      };

      const peerData = [
        { ticker: "MSFT", peRatio: 26, pbRatio: 9 },
        { ticker: "GOOGL", peRatio: 24, pbRatio: 7 },
      ];

      const valuation = engine.calculateValuations(fundamentals, peerData);

      // Average peer PE: (26 + 24) / 2 = 25
      // AAPL PE (25) is within 10% of 25, so fairly valued
      expect(valuation.vsPeers).toContain("fairly valued");
    });

    it("should handle peers with missing or invalid ratios", () => {
      const fundamentals = {
        ticker: "AAPL",
        peRatio: 25,
        pbRatio: 8,
      };

      const peerData = [
        { ticker: "MSFT", peRatio: 30, pbRatio: 10 },
        { ticker: "INVALID", peRatio: 0, pbRatio: -5 },
        { ticker: "MISSING", peRatio: null, pbRatio: null },
      ];

      const valuation = engine.calculateValuations(fundamentals, peerData);

      // Should only use valid peer data (MSFT)
      expect(valuation.vsPeers).toContain("30.00");
    });

    it("should handle zero or negative ratios", () => {
      const fundamentals = {
        ticker: "LOSS",
        peRatio: 0,
        pbRatio: -1,
      };

      const valuation = engine.calculateValuations(fundamentals, []);

      expect(valuation.peRatio).toBe(0);
      expect(valuation.pbRatio).toBe(-1);
    });
  });

  describe("determinePositionSize", () => {
    const baseProfile: InvestmentProfile = {
      userId: "test-user",
      riskTolerance: "medium",
      investmentHorizonYears: 10,
      capitalAvailable: 100000,
      longTermGoals: "steady growth",
      createdAt: new Date(),
    };

    it("should calculate position size for conservative risk model", () => {
      const profile = { ...baseProfile, riskTolerance: "low" as const };
      const riskModel: RiskModel = {
        type: "conservative",
        maxPositionSize: 5,
        diversificationMin: 20,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        100,
        riskModel,
        "AAPL"
      );

      // Conservative: max 5% of $100,000 = $5,000
      // At $100/share: 50 shares
      expect(recommendation.ticker).toBe("AAPL");
      expect(recommendation.sharesToBuy).toBe(50);
      expect(recommendation.entryPrice).toBe(100);
      expect(recommendation.totalInvestment).toBe(5000);
      expect(recommendation.portfolioPercentage).toBe(5);
      expect(recommendation.orderType).toBe("limit"); // Low risk uses limit orders
    });

    it("should calculate position size for balanced risk model", () => {
      const profile = { ...baseProfile, riskTolerance: "medium" as const };
      const riskModel: RiskModel = {
        type: "balanced",
        maxPositionSize: 10,
        diversificationMin: 10,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        50,
        riskModel,
        "MSFT"
      );

      // Balanced: max 10% of $100,000 = $10,000
      // At $50/share: 200 shares
      expect(recommendation.sharesToBuy).toBe(200);
      expect(recommendation.totalInvestment).toBe(10000);
      expect(recommendation.portfolioPercentage).toBe(10);
      expect(recommendation.orderType).toBe("limit"); // Medium risk uses limit orders
    });

    it("should calculate position size for aggressive risk model", () => {
      const profile = { ...baseProfile, riskTolerance: "high" as const };
      const riskModel: RiskModel = {
        type: "aggressive",
        maxPositionSize: 15,
        diversificationMin: 7,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        200,
        riskModel,
        "TSLA"
      );

      // Aggressive: max 15% of $100,000 = $15,000
      // At $200/share: 75 shares
      expect(recommendation.sharesToBuy).toBe(75);
      expect(recommendation.totalInvestment).toBe(15000);
      expect(recommendation.portfolioPercentage).toBe(15);
      expect(recommendation.orderType).toBe("market"); // High risk uses market orders
    });

    it("should handle fractional shares by rounding down", () => {
      const profile = { ...baseProfile };
      const riskModel: RiskModel = {
        type: "balanced",
        maxPositionSize: 10,
        diversificationMin: 10,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        333.33,
        riskModel,
        "GOOGL"
      );

      // 10% of $100,000 = $10,000
      // At $333.33/share: 30.00 shares -> rounds down to 30
      expect(recommendation.sharesToBuy).toBe(30);
      expect(recommendation.totalInvestment).toBe(9999.9); // 30 * 333.33
    });

    it("should handle very expensive stocks", () => {
      const profile = { ...baseProfile };
      const riskModel: RiskModel = {
        type: "conservative",
        maxPositionSize: 5,
        diversificationMin: 20,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        10000,
        riskModel,
        "BRK.A"
      );

      // 5% of $100,000 = $5,000
      // At $10,000/share: 0.5 shares -> rounds down to 0
      expect(recommendation.sharesToBuy).toBe(0);
      expect(recommendation.totalInvestment).toBe(0);
      expect(recommendation.portfolioPercentage).toBe(0);
    });

    it("should handle very cheap stocks", () => {
      const profile = { ...baseProfile };
      const riskModel: RiskModel = {
        type: "balanced",
        maxPositionSize: 10,
        diversificationMin: 10,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        0.5,
        riskModel,
        "PENNY"
      );

      // 10% of $100,000 = $10,000
      // At $0.50/share: 20,000 shares
      expect(recommendation.sharesToBuy).toBe(20000);
      expect(recommendation.totalInvestment).toBe(10000);
    });

    it("should respect maxPositionSize from risk model", () => {
      const profile = { ...baseProfile };
      const riskModel: RiskModel = {
        type: "aggressive",
        maxPositionSize: 8, // Override default 15% with 8%
        diversificationMin: 7,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        100,
        riskModel,
        "AAPL"
      );

      // Should use 8% instead of default 15%
      expect(recommendation.sharesToBuy).toBe(80);
      expect(recommendation.totalInvestment).toBe(8000);
      expect(recommendation.portfolioPercentage).toBe(8);
    });

    it("should handle small capital amounts", () => {
      const profile = { ...baseProfile, capitalAvailable: 1000 };
      const riskModel: RiskModel = {
        type: "balanced",
        maxPositionSize: 10,
        diversificationMin: 10,
      };

      const recommendation = engine.determinePositionSize(
        profile,
        50,
        riskModel,
        "STOCK"
      );

      // 10% of $1,000 = $100
      // At $50/share: 2 shares
      expect(recommendation.sharesToBuy).toBe(2);
      expect(recommendation.totalInvestment).toBe(100);
    });
  });

  describe("analyzeMoat", () => {
    it("should analyze strong competitive moat", () => {
      const companyProfile = {
        ticker: "AAPL",
        patents: { count: 150 },
        brandValue: 500000000000,
        brandRecognition: 0.95,
        customers: {
          count: 2000000000,
          retentionRate: 0.95,
          concentration: 0.1,
        },
        costStructure: {
          operatingMargin: 0.3,
          efficiency: 0.9,
        },
      };

      const moat = engine.analyzeMoat(companyProfile);

      expect(moat.ticker).toBe("AAPL");
      expect(moat.patents).toContain("Strong patent portfolio");
      expect(moat.patents).toContain("150+");
      expect(moat.brandStrength).toContain("Exceptional brand");
      expect(moat.customerBase).toContain("Large, loyal customer base");
      expect(moat.customerBase).toContain("95%");
      expect(moat.costLeadership).toContain("Strong cost leadership");
      expect(moat.overallMoatScore).toBeGreaterThan(80);
    });

    it("should analyze moderate competitive moat", () => {
      const companyProfile = {
        ticker: "MODERATE",
        patents: { count: 50 },
        brandValue: 5000000000,
        brandRecognition: 0.6,
        customers: {
          count: 500000,
          retentionRate: 0.75,
        },
        costStructure: {
          operatingMargin: 0.18,
          efficiency: 0.65,
        },
      };

      const moat = engine.analyzeMoat(companyProfile);

      expect(moat.patents).toContain("Moderate patent portfolio");
      expect(moat.brandStrength).toContain("Strong brand");
      expect(moat.customerBase).toContain("Solid customer base");
      expect(moat.costLeadership).toContain("Competitive cost structure");
      expect(moat.overallMoatScore).toBeGreaterThan(40);
      expect(moat.overallMoatScore).toBeLessThan(80);
    });

    it("should analyze weak competitive moat", () => {
      const companyProfile = {
        ticker: "WEAK",
        patents: { count: 5 },
        brandValue: 100000000,
        brandRecognition: 0.2,
        customers: {
          count: 10000,
          retentionRate: 0.5,
          concentration: 0.5, // High concentration (not diversified)
        },
        costStructure: {
          operatingMargin: 0.08,
          efficiency: 0.4,
        },
      };

      const moat = engine.analyzeMoat(companyProfile);

      expect(moat.patents).toContain("Limited patent portfolio");
      expect(moat.brandStrength).toContain("Developing brand");
      expect(moat.customerBase).toContain("Growing customer base");
      expect(moat.costLeadership).toContain("Average cost position");
      expect(moat.overallMoatScore).toBeLessThan(40);
    });

    it("should handle missing moat data", () => {
      const companyProfile = {
        ticker: "UNKNOWN",
      };

      const moat = engine.analyzeMoat(companyProfile);

      expect(moat.ticker).toBe("UNKNOWN");
      expect(moat.patents).toContain("No patent information available");
      expect(moat.brandStrength).toContain("Brand strength not assessed");
      expect(moat.customerBase).toContain("Customer base information not available");
      expect(moat.costLeadership).toContain("Cost position not assessed");
      expect(moat.overallMoatScore).toBe(0);
    });

    it("should handle diversified customer base with low concentration", () => {
      const companyProfile = {
        ticker: "DIVERSE",
        customers: {
          count: 50000,
          retentionRate: 0.6,
          concentration: 0.2, // Low concentration is good
        },
      };

      const moat = engine.analyzeMoat(companyProfile);

      expect(moat.customerBase).toContain("Diversified customer base");
      expect(moat.customerBase).toContain("low concentration risk");
    });
  });

  describe("aggregateAnalystSentiment", () => {
    it("should aggregate analyst ratings and calculate consensus", () => {
      const ratings = [
        { rating: "Buy", priceTarget: 180 },
        { rating: "Strong Buy", priceTarget: 200 },
        { rating: "Buy", priceTarget: 190 },
        { rating: "Hold", priceTarget: 150 },
        { rating: "Sell", priceTarget: 120 },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "AAPL");

      expect(summary.ticker).toBe("AAPL");
      expect(summary.buyCount).toBe(3);
      expect(summary.holdCount).toBe(1);
      expect(summary.sellCount).toBe(1);
      expect(summary.averageTarget).toBe(168); // (180 + 200 + 190 + 150 + 120) / 5
      expect(summary.consensus).toBe("buy"); // 60% buy
    });

    it("should identify strong buy consensus", () => {
      const ratings = [
        { rating: "Buy", priceTarget: 100 },
        { rating: "Buy", priceTarget: 110 },
        { rating: "Outperform", priceTarget: 105 },
        { rating: "Overweight", priceTarget: 108 },
        { rating: "Hold", priceTarget: 95 },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "STRONG");

      expect(summary.buyCount).toBe(4);
      expect(summary.consensus).toBe("strong buy"); // 80% buy
    });

    it("should identify sell consensus", () => {
      const ratings = [
        { rating: "Sell", priceTarget: 50 },
        { rating: "Underperform", priceTarget: 45 },
        { rating: "Underweight", priceTarget: 48 },
        { rating: "Hold", priceTarget: 55 },
        { rating: "Buy", priceTarget: 60 },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "WEAK");

      expect(summary.sellCount).toBe(3);
      expect(summary.consensus).toBe("sell"); // 60% sell
    });

    it("should identify hold consensus", () => {
      const ratings = [
        { rating: "Buy", priceTarget: 100 },
        { rating: "Hold", priceTarget: 95 },
        { rating: "Neutral", priceTarget: 98 },
        { rating: "Equal Weight", priceTarget: 97 },
        { rating: "Sell", priceTarget: 90 },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "NEUTRAL");

      expect(summary.buyCount).toBe(1);
      expect(summary.holdCount).toBe(3);
      expect(summary.sellCount).toBe(1);
      expect(summary.consensus).toBe("hold"); // Mixed ratings
    });

    it("should handle ratings without price targets", () => {
      const ratings = [
        { rating: "Buy" },
        { rating: "Buy", priceTarget: 100 },
        { rating: "Hold" },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "PARTIAL");

      expect(summary.buyCount).toBe(2);
      expect(summary.holdCount).toBe(1);
      expect(summary.averageTarget).toBe(100); // Only one valid target
    });

    it("should handle empty ratings array", () => {
      const summary = engine.aggregateAnalystSentiment([], "EMPTY");

      expect(summary.buyCount).toBe(0);
      expect(summary.holdCount).toBe(0);
      expect(summary.sellCount).toBe(0);
      expect(summary.averageTarget).toBe(0);
      expect(summary.consensus).toBe("hold"); // Default to hold
    });

    it("should handle invalid or zero price targets", () => {
      const ratings = [
        { rating: "Buy", priceTarget: 100 },
        { rating: "Buy", priceTarget: 0 },
        { rating: "Buy", priceTarget: -50 },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "INVALID");

      // Should only count valid positive price targets
      expect(summary.averageTarget).toBe(100);
    });

    it("should handle case-insensitive rating types", () => {
      const ratings = [
        { rating: "BUY", priceTarget: 100 },
        { rating: "buy", priceTarget: 105 },
        { rating: "HOLD", priceTarget: 95 },
        { rating: "hold", priceTarget: 98 },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "CASE");

      expect(summary.buyCount).toBe(2);
      expect(summary.holdCount).toBe(2);
    });

    it("should handle various rating synonyms", () => {
      const ratings = [
        { rating: "Outperform", priceTarget: 100 },
        { rating: "Overweight", priceTarget: 105 },
        { rating: "Underperform", priceTarget: 80 },
        { rating: "Underweight", priceTarget: 75 },
        { rating: "Neutral", priceTarget: 90 },
        { rating: "Equal Weight", priceTarget: 92 },
      ];

      const summary = engine.aggregateAnalystSentiment(ratings, "SYNONYMS");

      expect(summary.buyCount).toBe(2); // Outperform, Overweight
      expect(summary.holdCount).toBe(2); // Neutral, Equal Weight
      expect(summary.sellCount).toBe(2); // Underperform, Underweight
    });
  });
});
