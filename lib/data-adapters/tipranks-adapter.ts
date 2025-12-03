import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";

export interface AnalystRating {
  analystName: string;
  analystFirm: string;
  rating: "buy" | "hold" | "sell";
  priceTarget?: number;
  date: string;
}

export interface TipRanksAnalystData {
  ticker: string;
  consensusRating: "strong buy" | "buy" | "hold" | "sell" | "strong sell";
  buyCount: number;
  holdCount: number;
  sellCount: number;
  averageTarget: number;
  ratings: AnalystRating[];
  lastUpdated: Date;
}

/**
 * Adapter for TipRanks analyst ratings
 * Fetches analyst recommendations and price targets
 */
export class TipRanksAdapter extends BaseDataSourceAdapter {
  sourceName = "TipRanks";

  constructor() {
    super("https://www.tipranks.com/api", 30); // 30 requests per minute
  }

  /**
   * Fetch analyst ratings for a ticker
   */
  async fetchAnalystRatings(ticker: string): Promise<TipRanksAnalystData> {
    try {
      const request: DataRequest = {
        endpoint: `/stocks/${ticker}/analysts`,
        params: {},
      };

      const response = await this.fetch(request);
      const analystData = this.parseAnalystRatings(response.data, ticker);

      return analystData;
    } catch (error) {
      throw new Error(
        `Failed to fetch analyst ratings for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Perform the actual HTTP fetch
   */
  protected async performFetch(request: DataRequest): Promise<DataResponse> {
    const url = this.buildUrl(request.endpoint, request.params);

    const response = await fetch(url, {
      headers: {
        ...request.headers,
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      data,
      status: response.status,
      timestamp: new Date(),
      source: this.sourceName,
    };
  }

  /**
   * Parse analyst ratings from TipRanks response
   */
  private parseAnalystRatings(data: any, ticker: string): TipRanksAnalystData {
    // TipRanks API structure (this is a simplified version)
    const consensus = data.consensus || {};
    const ratings = data.ratings || [];

    let buyCount = 0;
    let holdCount = 0;
    let sellCount = 0;
    let totalTarget = 0;
    let targetCount = 0;

    const parsedRatings: AnalystRating[] = [];

    // Parse individual analyst ratings
    for (const rating of ratings) {
      const ratingType = this.normalizeRating(rating.rating || rating.recommendation);
      
      if (ratingType === "buy") {
        buyCount++;
      } else if (ratingType === "hold") {
        holdCount++;
      } else if (ratingType === "sell") {
        sellCount++;
      }

      if (rating.priceTarget && rating.priceTarget > 0) {
        totalTarget += rating.priceTarget;
        targetCount++;
      }

      parsedRatings.push({
        analystName: rating.analystName || rating.analyst || "Unknown",
        analystFirm: rating.firm || rating.analystFirm || "Unknown",
        rating: ratingType,
        priceTarget: rating.priceTarget,
        date: rating.date || rating.ratingDate || new Date().toISOString(),
      });
    }

    // If consensus data is available, use it
    if (consensus.buy !== undefined) {
      buyCount = consensus.buy || buyCount;
    }
    if (consensus.hold !== undefined) {
      holdCount = consensus.hold || holdCount;
    }
    if (consensus.sell !== undefined) {
      sellCount = consensus.sell || sellCount;
    }
    if (consensus.priceTarget !== undefined && consensus.priceTarget > 0) {
      totalTarget = consensus.priceTarget * (buyCount + holdCount + sellCount);
      targetCount = buyCount + holdCount + sellCount;
    }

    const averageTarget = targetCount > 0 ? totalTarget / targetCount : 0;
    const consensusRating = this.calculateConsensus(buyCount, holdCount, sellCount);

    return {
      ticker,
      consensusRating,
      buyCount,
      holdCount,
      sellCount,
      averageTarget,
      ratings: parsedRatings,
      lastUpdated: new Date(),
    };
  }

  /**
   * Normalize rating strings to standard format
   */
  private normalizeRating(rating: string): "buy" | "hold" | "sell" {
    const ratingLower = (rating || "").toLowerCase();

    if (
      ratingLower.includes("buy") ||
      ratingLower.includes("outperform") ||
      ratingLower.includes("overweight")
    ) {
      return "buy";
    } else if (
      ratingLower.includes("sell") ||
      ratingLower.includes("underperform") ||
      ratingLower.includes("underweight")
    ) {
      return "sell";
    } else {
      return "hold";
    }
  }

  /**
   * Calculate consensus rating from counts
   */
  private calculateConsensus(
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
