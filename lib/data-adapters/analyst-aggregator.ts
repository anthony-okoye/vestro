import { AnalystSummary } from "../types";
import { TipRanksAnalystData } from "./tipranks-adapter";
import { MarketBeatAnalystData } from "./marketbeat-adapter";

/**
 * Aggregate analyst data from multiple sources
 */
export class AnalystAggregator {
  /**
   * Combine analyst data from TipRanks and MarketBeat
   * Merges counts and calculates weighted average price target
   */
  static aggregateFromSources(
    tipRanksData?: TipRanksAnalystData,
    marketBeatData?: MarketBeatAnalystData
  ): AnalystSummary {
    let buyCount = 0;
    let holdCount = 0;
    let sellCount = 0;
    let totalTarget = 0;
    let targetCount = 0;

    // Aggregate TipRanks data
    if (tipRanksData) {
      buyCount += tipRanksData.buyCount;
      holdCount += tipRanksData.holdCount;
      sellCount += tipRanksData.sellCount;

      if (tipRanksData.averageTarget > 0) {
        const tipRanksTotal = tipRanksData.buyCount + tipRanksData.holdCount + tipRanksData.sellCount;
        totalTarget += tipRanksData.averageTarget * tipRanksTotal;
        targetCount += tipRanksTotal;
      }
    }

    // Aggregate MarketBeat data
    if (marketBeatData) {
      buyCount += marketBeatData.buyCount;
      holdCount += marketBeatData.holdCount;
      sellCount += marketBeatData.sellCount;

      if (marketBeatData.averageTarget > 0) {
        const marketBeatTotal = marketBeatData.buyCount + marketBeatData.holdCount + marketBeatData.sellCount;
        totalTarget += marketBeatData.averageTarget * marketBeatTotal;
        targetCount += marketBeatTotal;
      }
    }

    const averageTarget = targetCount > 0 ? totalTarget / targetCount : 0;
    const consensus = this.calculateConsensus(buyCount, holdCount, sellCount);

    // Use ticker from whichever source is available
    const ticker = tipRanksData?.ticker || marketBeatData?.ticker || "";

    return {
      ticker,
      buyCount,
      holdCount,
      sellCount,
      averageTarget,
      consensus,
    };
  }

  /**
   * Calculate consensus rating from counts
   */
  private static calculateConsensus(
    buyCount: number,
    holdCount: number,
    sellCount: number
  ): "strong buy" | "buy" | "hold" | "sell" | "strong sell" {
    const total = buyCount + holdCount + sellCount;

    if (total === 0) {
      return "hold";
    }

    const buyPercent = (buyCount / total) * 100;
    const sellPercent = (sellCount / total) * 100;

    if (buyPercent >= 70) {
      return "strong buy";
    } else if (buyPercent >= 50) {
      return "buy";
    } else if (sellPercent >= 70) {
      return "strong sell";
    } else if (sellPercent >= 50) {
      return "sell";
    } else {
      return "hold";
    }
  }
}
