import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse, ValuationMetrics } from "../types";

export interface ValuationData {
  ticker: string;
  peRatio: number;
  pbRatio: number;
  psRatio: number;
  pegRatio: number;
  evToEbitda: number;
  priceToFreeCashFlow: number;
  fairValueEstimate: number;
  currentPrice: number;
  upside: number;
  valuationScore: number;
  peerComparison: PeerComparison;
}

export interface PeerComparison {
  averagePE: number;
  averagePB: number;
  averagePS: number;
  industryMedianPE: number;
  industryMedianPB: number;
  comparisonText: string;
}

/**
 * Adapter for Simply Wall St valuation data
 * Fetches stock valuations and peer comparisons
 * Requirements: 7.1
 */
export class SimplyWallStAdapter extends BaseDataSourceAdapter {
  sourceName = "Simply Wall St";

  constructor() {
    super("https://api.simplywall.st", 60); // 60 requests per minute
  }

  /**
   * Fetch valuation data for a ticker
   */
  async fetchValuationData(ticker: string): Promise<ValuationData> {
    try {
      const request: DataRequest = {
        endpoint: `/api/company/${ticker}/valuation`,
        params: {
          include: "peers,ratios,fairvalue",
        },
      };

      const response = await this.fetch(request);
      const valuation = this.parseValuationData(response.data, ticker);

      return valuation;
    } catch (error) {
      throw new Error(
        `Failed to fetch valuation data for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch valuation metrics (compatible with system ValuationMetrics interface)
   */
  async fetchValuationMetrics(ticker: string): Promise<ValuationMetrics> {
    try {
      const valuation = await this.fetchValuationData(ticker);

      return {
        ticker: valuation.ticker,
        peRatio: valuation.peRatio,
        pbRatio: valuation.pbRatio,
        vsPeers: valuation.peerComparison.comparisonText,
        fairValueEstimate: valuation.fairValueEstimate,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch valuation metrics for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch peer comparison data
   */
  async fetchPeerComparison(
    ticker: string,
    peerTickers: string[]
  ): Promise<PeerComparison> {
    try {
      const request: DataRequest = {
        endpoint: `/api/company/${ticker}/peers`,
        params: {
          peers: peerTickers.join(","),
        },
      };

      const response = await this.fetch(request);
      const comparison = this.parsePeerComparison(response.data);

      return comparison;
    } catch (error) {
      throw new Error(
        `Failed to fetch peer comparison for ${ticker}: ${(error as Error).message}`
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
        "User-Agent": "ResurrectionStockPicker/1.0",
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
   * Parse valuation data from Simply Wall St response
   */
  private parseValuationData(data: any, ticker: string): ValuationData {
    const valuation = data.valuation || data;
    const ratios = valuation.ratios || {};
    const fairValue = valuation.fairValue || {};
    const peers = valuation.peers || {};

    const currentPrice = valuation.currentPrice || ratios.price || 0;
    const fairValueEstimate = fairValue.estimate || fairValue.value || 0;
    const upside = fairValueEstimate > 0
      ? ((fairValueEstimate - currentPrice) / currentPrice) * 100
      : 0;

    return {
      ticker,
      peRatio: ratios.pe || ratios.priceToEarnings || 0,
      pbRatio: ratios.pb || ratios.priceToBook || 0,
      psRatio: ratios.ps || ratios.priceToSales || 0,
      pegRatio: ratios.peg || ratios.pegRatio || 0,
      evToEbitda: ratios.evToEbitda || ratios.enterpriseValueToEbitda || 0,
      priceToFreeCashFlow: ratios.priceToFreeCashFlow || ratios.pfcf || 0,
      fairValueEstimate,
      currentPrice,
      upside,
      valuationScore: valuation.score || this.calculateValuationScore(ratios, peers),
      peerComparison: this.parsePeerComparison(peers),
    };
  }

  /**
   * Parse peer comparison data
   */
  private parsePeerComparison(data: any): PeerComparison {
    const peers = data.peers || data;
    const averages = peers.averages || {};
    const medians = peers.medians || peers.industryMedians || {};

    const averagePE = averages.pe || averages.priceToEarnings || 0;
    const averagePB = averages.pb || averages.priceToBook || 0;
    const averagePS = averages.ps || averages.priceToSales || 0;
    const industryMedianPE = medians.pe || medians.priceToEarnings || 0;
    const industryMedianPB = medians.pb || medians.priceToBook || 0;

    const comparisonText = this.generateComparisonText(
      averagePE,
      averagePB,
      industryMedianPE,
      industryMedianPB
    );

    return {
      averagePE,
      averagePB,
      averagePS,
      industryMedianPE,
      industryMedianPB,
      comparisonText,
    };
  }

  /**
   * Calculate valuation score (0-100)
   */
  private calculateValuationScore(ratios: any, peers: any): number {
    let score = 50; // Start at neutral

    const pe = ratios.pe || 0;
    const pb = ratios.pb || 0;
    const peerAvgPE = peers.averages?.pe || 20;
    const peerAvgPB = peers.averages?.pb || 3;

    // Lower PE relative to peers is better
    if (pe > 0 && peerAvgPE > 0) {
      if (pe < peerAvgPE * 0.8) score += 20;
      else if (pe < peerAvgPE) score += 10;
      else if (pe > peerAvgPE * 1.2) score -= 20;
      else if (pe > peerAvgPE) score -= 10;
    }

    // Lower PB relative to peers is better
    if (pb > 0 && peerAvgPB > 0) {
      if (pb < peerAvgPB * 0.8) score += 20;
      else if (pb < peerAvgPB) score += 10;
      else if (pb > peerAvgPB * 1.2) score -= 20;
      else if (pb > peerAvgPB) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate human-readable comparison text
   */
  private generateComparisonText(
    avgPE: number,
    avgPB: number,
    medianPE: number,
    medianPB: number
  ): string {
    const parts = [];

    if (avgPE > 0) {
      parts.push(`Average peer P/E: ${avgPE.toFixed(2)}`);
    }
    if (avgPB > 0) {
      parts.push(`Average peer P/B: ${avgPB.toFixed(2)}`);
    }
    if (medianPE > 0) {
      parts.push(`Industry median P/E: ${medianPE.toFixed(2)}`);
    }
    if (medianPB > 0) {
      parts.push(`Industry median P/B: ${medianPB.toFixed(2)}`);
    }

    return parts.length > 0
      ? parts.join(". ")
      : "Peer comparison data not available";
  }
}
