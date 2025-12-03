import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";

export interface MarketBeatRating {
  brokerageFirm: string;
  rating: "buy" | "hold" | "sell";
  priceTarget?: number;
  date: string;
}

export interface MarketBeatAnalystData {
  ticker: string;
  consensusRating: "strong buy" | "buy" | "hold" | "sell" | "strong sell";
  buyCount: number;
  holdCount: number;
  sellCount: number;
  averageTarget: number;
  ratings: MarketBeatRating[];
  lastUpdated: Date;
}

/**
 * Adapter for MarketBeat analyst ratings
 * Fetches brokerage firm recommendations and price targets
 */
export class MarketBeatAdapter extends BaseDataSourceAdapter {
  sourceName = "MarketBeat";

  constructor() {
    super("https://www.marketbeat.com/api", 30); // 30 requests per minute
  }

  /**
   * Fetch analyst ratings for a ticker
   */
  async fetchAnalystRatings(ticker: string): Promise<MarketBeatAnalystData> {
    try {
      const request: DataRequest = {
        endpoint: `/stocks/${ticker}/ratings`,
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
   * Parse analyst ratings from MarketBeat response
   */
  private parseAnalystRatings(
    data: any,
    ticker: string
  ): MarketBeatAnalystData {
    // MarketBeat API structure (this is a simplified version)
    const ratings = data.ratings || data.analystRatings || [];
    const summary = data.summary || {};

    let buyCount = 0;
    let holdCount = 0;
    let sellCount = 0;
    let totalTarget = 0;
    let targetCount = 0;

    const parsedRatings: MarketBeatRating[] = [];

    // Parse individual brokerage ratings
    for (const rating of ratings) {
      const ratingType = this.normalizeRating(
        rating.rating || rating.recommendation || rating.action
      );

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
        brokerageFirm: rating.firm || rating.brokerage || rating.brokerageFirm || "Unknown",
        rating: ratingType,
        priceTarget: rating.priceTarget || rating.target,
        date: rating.date || rating.ratingDate || new Date().toISOString(),
      });
    }

    // If summary data is available, use it
    if (summary.buyRatings !== undefined) {
      buyCount = summary.buyRatings || buyCount;
    }
    if (summary.holdRatings !== undefined) {
      holdCount = summary.holdRatings || holdCount;
    }
    if (summary.sellRatings !== undefined) {
      sellCount = summary.sellRatings || sellCount;
    }
    if (summary.averagePriceTarget !== undefined && summary.averagePriceTarget > 0) {
      totalTarget = summary.averagePriceTarget * (buyCount + holdCount + sellCount);
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
      ratingLower.includes("overweight") ||
      ratingLower.includes("positive") ||
      ratingLower.includes("accumulate")
    ) {
      return "buy";
    } else if (
      ratingLower.includes("sell") ||
      ratingLower.includes("underperform") ||
      ratingLower.includes("underweight") ||
      ratingLower.includes("negative") ||
      ratingLower.includes("reduce")
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
