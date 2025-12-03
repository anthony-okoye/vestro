import {
  SectorRanking,
  ValuationMetrics,
  InvestmentProfile,
  RiskModel,
  BuyRecommendation,
  MoatAnalysis,
  AnalystSummary,
} from "./types";

/**
 * AnalysisEngine performs calculations, scoring, and data transformations
 * for the investment research workflow
 */
export class AnalysisEngine {
  /**
   * Score and rank sectors based on growth indicators
   * Requirements: 3.3, 3.4, 3.5
   */
  scoreSectors(sectorData: any[], industryReports: any[]): SectorRanking[] {
    const rankings: SectorRanking[] = [];

    for (const sector of sectorData) {
      // Extract metrics from sector data
      const growthRate = sector.growthRate || 0;
      const marketCap = sector.marketCap || 0;
      const momentum = sector.momentum || 0;

      // Calculate weighted score
      // Growth rate: 50%, Market cap: 30%, Momentum: 20%
      const score =
        growthRate * 0.5 + 
        (marketCap / 1000000000) * 0.3 + // Normalize market cap to billions
        momentum * 0.2;

      // Generate rationale based on metrics
      let rationale = `Sector shows `;
      const reasons: string[] = [];

      if (growthRate > 10) {
        reasons.push(`strong growth (${growthRate.toFixed(1)}%)`);
      } else if (growthRate > 5) {
        reasons.push(`moderate growth (${growthRate.toFixed(1)}%)`);
      } else {
        reasons.push(`limited growth (${growthRate.toFixed(1)}%)`);
      }

      if (momentum > 0.7) {
        reasons.push("positive momentum");
      } else if (momentum > 0.4) {
        reasons.push("neutral momentum");
      } else {
        reasons.push("weak momentum");
      }

      rationale += reasons.join(" and ") + ".";

      // Check industry reports for additional context
      const industryReport = industryReports.find(
        (report) => report.sector === sector.sectorName
      );
      if (industryReport && industryReport.outlook) {
        rationale += ` Industry outlook: ${industryReport.outlook}.`;
      }

      rankings.push({
        sectorName: sector.sectorName,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        rationale,
        dataPoints: {
          growthRate,
          marketCap,
          momentum,
        },
      });
    }

    // Sort by score in descending order (Requirement 3.5)
    rankings.sort((a, b) => b.score - a.score);

    return rankings;
  }

  /**
   * Calculate valuation metrics and peer comparisons
   * Requirements: 7.3, 7.4, 7.5, 7.6
   */
  calculateValuations(fundamentals: any, peerData: any[]): ValuationMetrics {
    const ticker = fundamentals.ticker;
    
    // Calculate PE ratio (Requirement 7.3)
    const peRatio = fundamentals.peRatio || 
      (fundamentals.price && fundamentals.earningsPerShare 
        ? fundamentals.price / fundamentals.earningsPerShare 
        : 0);

    // Calculate PB ratio (Requirement 7.4)
    const pbRatio = fundamentals.pbRatio || 
      (fundamentals.price && fundamentals.bookValuePerShare 
        ? fundamentals.price / fundamentals.bookValuePerShare 
        : 0);

    // Peer comparison logic (Requirement 7.5)
    let vsPeers = "";
    let fairValueEstimate: number | undefined;

    if (peerData && peerData.length > 0) {
      // Calculate average peer PE and PB ratios
      const peerPEs = peerData
        .map((peer) => peer.peRatio)
        .filter((pe) => pe && pe > 0);
      const peerPBs = peerData
        .map((peer) => peer.pbRatio)
        .filter((pb) => pb && pb > 0);

      const avgPeerPE = peerPEs.length > 0
        ? peerPEs.reduce((sum, pe) => sum + pe, 0) / peerPEs.length
        : 0;
      const avgPeerPB = peerPBs.length > 0
        ? peerPBs.reduce((sum, pb) => sum + pb, 0) / peerPBs.length
        : 0;

      // Generate comparison text
      const peComparison = peRatio > 0 && avgPeerPE > 0
        ? peRatio < avgPeerPE * 0.9
          ? "undervalued"
          : peRatio > avgPeerPE * 1.1
          ? "overvalued"
          : "fairly valued"
        : "N/A";

      const pbComparison = pbRatio > 0 && avgPeerPB > 0
        ? pbRatio < avgPeerPB * 0.9
          ? "undervalued"
          : pbRatio > avgPeerPB * 1.1
          ? "overvalued"
          : "fairly valued"
        : "N/A";

      vsPeers = `PE ratio is ${peComparison} vs peers (avg: ${avgPeerPE.toFixed(2)}). `;
      vsPeers += `PB ratio is ${pbComparison} vs peers (avg: ${avgPeerPB.toFixed(2)}).`;

      // Estimate fair value based on peer average PE
      if (avgPeerPE > 0 && fundamentals.earningsPerShare) {
        fairValueEstimate = avgPeerPE * fundamentals.earningsPerShare;
      }
    } else {
      vsPeers = "No peer data available for comparison.";
    }

    return {
      ticker,
      peRatio: Math.round(peRatio * 100) / 100,
      pbRatio: Math.round(pbRatio * 100) / 100,
      vsPeers,
      fairValueEstimate: fairValueEstimate 
        ? Math.round(fairValueEstimate * 100) / 100 
        : undefined,
    };
  }

  /**
   * Determine appropriate position size based on risk model
   * Requirements: 10.3, 10.4, 10.5, 10.6
   */
  determinePositionSize(
    profile: InvestmentProfile,
    stockPrice: number,
    riskModel: RiskModel,
    ticker: string = "UNKNOWN"
  ): BuyRecommendation {
    const capitalAvailable = profile.capitalAvailable;

    // Apply risk model allocation rules (Requirement 10.3)
    let maxPositionPercentage: number;
    
    switch (riskModel.type) {
      case "conservative":
        // Conservative: max 5% per position, minimum 20 positions
        maxPositionPercentage = Math.min(5, riskModel.maxPositionSize);
        break;
      case "balanced":
        // Balanced: max 10% per position, minimum 10 positions
        maxPositionPercentage = Math.min(10, riskModel.maxPositionSize);
        break;
      case "aggressive":
        // Aggressive: max 15% per position, minimum 7 positions
        maxPositionPercentage = Math.min(15, riskModel.maxPositionSize);
        break;
      default:
        maxPositionPercentage = 10;
    }

    // Calculate total investment for this position (Requirement 10.4)
    const totalInvestment = (capitalAvailable * maxPositionPercentage) / 100;

    // Calculate share quantities (Requirement 10.3)
    const sharesToBuy = Math.floor(totalInvestment / stockPrice);

    // Adjust total investment based on whole shares
    const actualInvestment = sharesToBuy * stockPrice;
    const actualPercentage = (actualInvestment / capitalAvailable) * 100;

    // Determine order type based on risk tolerance (Requirement 10.5)
    let orderType: "market" | "limit";
    if (profile.riskTolerance === "low") {
      // Conservative investors prefer limit orders for price control
      orderType = "limit";
    } else if (profile.riskTolerance === "high") {
      // Aggressive investors may use market orders for quick execution
      orderType = "market";
    } else {
      // Balanced approach: use limit orders
      orderType = "limit";
    }

    return {
      ticker,
      sharesToBuy,
      entryPrice: stockPrice,
      orderType,
      totalInvestment: Math.round(actualInvestment * 100) / 100,
      portfolioPercentage: Math.round(actualPercentage * 100) / 100,
    };
  }

  /**
   * Analyze competitive moat and advantages
   * Requirements: 6.3, 6.4, 6.5, 6.6, 6.7
   */
  analyzeMoat(companyProfile: any): MoatAnalysis {
    const ticker = companyProfile.ticker || "UNKNOWN";

    // Analyze patents (Requirement 6.3)
    let patents = "No patent information available.";
    let patentScore = 0;
    if (companyProfile.patents) {
      const patentCount = companyProfile.patents.count || 0;
      if (patentCount > 100) {
        patents = `Strong patent portfolio with ${patentCount}+ patents providing significant IP protection.`;
        patentScore = 3;
      } else if (patentCount > 20) {
        patents = `Moderate patent portfolio with ${patentCount} patents.`;
        patentScore = 2;
      } else if (patentCount > 0) {
        patents = `Limited patent portfolio with ${patentCount} patents.`;
        patentScore = 1;
      }
    }

    // Analyze brand strength (Requirement 6.4)
    let brandStrength = "Brand strength not assessed.";
    let brandScore = 0;
    if (companyProfile.brandValue || companyProfile.brandRecognition) {
      const brandValue = companyProfile.brandValue || 0;
      const recognition = companyProfile.brandRecognition || 0;
      
      if (brandValue > 10000000000 || recognition > 0.8) {
        brandStrength = "Exceptional brand with global recognition and strong customer loyalty.";
        brandScore = 3;
      } else if (brandValue > 1000000000 || recognition > 0.5) {
        brandStrength = "Strong brand with significant market presence.";
        brandScore = 2;
      } else {
        brandStrength = "Developing brand with limited recognition.";
        brandScore = 1;
      }
    }

    // Analyze customer base (Requirement 6.5)
    let customerBase = "Customer base information not available.";
    let customerScore = 0;
    if (companyProfile.customers) {
      const customerCount = companyProfile.customers.count || 0;
      const retention = companyProfile.customers.retentionRate || 0;
      const concentration = companyProfile.customers.concentration || 0;

      if (customerCount > 1000000 && retention > 0.9) {
        customerBase = `Large, loyal customer base with ${customerCount.toLocaleString()}+ customers and ${(retention * 100).toFixed(0)}% retention rate.`;
        customerScore = 3;
      } else if (customerCount > 100000 && retention > 0.7) {
        customerBase = `Solid customer base with ${customerCount.toLocaleString()} customers and ${(retention * 100).toFixed(0)}% retention.`;
        customerScore = 2;
      } else if (concentration < 0.3) {
        customerBase = "Diversified customer base with low concentration risk.";
        customerScore = 2;
      } else {
        customerBase = `Growing customer base with ${customerCount.toLocaleString()} customers.`;
        customerScore = 1;
      }
    }

    // Analyze cost leadership (Requirement 6.6)
    let costLeadership = "Cost position not assessed.";
    let costScore = 0;
    if (companyProfile.costStructure) {
      const margin = companyProfile.costStructure.operatingMargin || 0;
      const efficiency = companyProfile.costStructure.efficiency || 0;

      if (margin > 0.25 || efficiency > 0.8) {
        costLeadership = "Strong cost leadership with industry-leading margins and operational efficiency.";
        costScore = 3;
      } else if (margin > 0.15 || efficiency > 0.6) {
        costLeadership = "Competitive cost structure with above-average margins.";
        costScore = 2;
      } else {
        costLeadership = "Average cost position relative to peers.";
        costScore = 1;
      }
    }

    // Calculate overall moat score (Requirement 6.7)
    const overallMoatScore = Math.round(
      ((patentScore + brandScore + customerScore + costScore) / 12) * 100
    );

    return {
      ticker,
      patents,
      brandStrength,
      customerBase,
      costLeadership,
      overallMoatScore,
    };
  }

  /**
   * Aggregate analyst sentiment and ratings
   * Requirements: 9.3, 9.4, 9.5, 9.6, 9.7
   */
  aggregateAnalystSentiment(ratings: any[], ticker: string = "UNKNOWN"): AnalystSummary {
    // Count ratings by type (Requirements 9.3, 9.4, 9.5)
    let buyCount = 0;
    let holdCount = 0;
    let sellCount = 0;
    const priceTargets: number[] = [];

    for (const rating of ratings) {
      const ratingType = rating.rating?.toLowerCase() || "";
      
      if (ratingType.includes("buy") || ratingType.includes("outperform") || ratingType.includes("overweight")) {
        buyCount++;
      } else if (ratingType.includes("hold") || ratingType.includes("neutral") || ratingType.includes("equal")) {
        holdCount++;
      } else if (ratingType.includes("sell") || ratingType.includes("underperform") || ratingType.includes("underweight")) {
        sellCount++;
      }

      // Collect price targets (Requirement 9.6)
      if (rating.priceTarget && rating.priceTarget > 0) {
        priceTargets.push(rating.priceTarget);
      }
    }

    // Calculate average price target (Requirement 9.6)
    const averageTarget = priceTargets.length > 0
      ? priceTargets.reduce((sum, target) => sum + target, 0) / priceTargets.length
      : 0;

    // Calculate consensus recommendation (Requirement 9.7)
    const totalRatings = buyCount + holdCount + sellCount;
    let consensus: "strong buy" | "buy" | "hold" | "sell" | "strong sell";

    if (totalRatings === 0) {
      consensus = "hold";
    } else {
      const buyPercentage = (buyCount / totalRatings) * 100;
      const sellPercentage = (sellCount / totalRatings) * 100;

      if (buyPercentage >= 70) {
        consensus = "strong buy";
      } else if (buyPercentage >= 50) {
        consensus = "buy";
      } else if (sellPercentage >= 50) {
        consensus = "sell";
      } else if (sellPercentage >= 30) {
        consensus = "sell";
      } else {
        consensus = "hold";
      }
    }

    return {
      ticker,
      buyCount,
      holdCount,
      sellCount,
      averageTarget: Math.round(averageTarget * 100) / 100,
      consensus,
    };
  }
}
