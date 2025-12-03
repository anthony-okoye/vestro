import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse, Fundamentals } from "../types";

export interface FinancialSnapshot {
  ticker: string;
  revenueGrowth5y: number;
  earningsGrowth5y: number;
  profitMargin: number;
  debtToEquity: number;
  freeCashFlow: number;
  roe: number;
  roa: number;
  currentRatio: number;
  quickRatio: number;
  asOfDate: string;
}

/**
 * Adapter for Morningstar financial data
 * Fetches financial snapshots and fundamental metrics
 * Requirements: 5.2
 */
export class MorningstarAdapter extends BaseDataSourceAdapter {
  sourceName = "Morningstar";

  constructor() {
    super("https://api.morningstar.com", 60); // 60 requests per minute
  }

  /**
   * Fetch financial snapshot for a ticker
   */
  async fetchFinancialSnapshot(ticker: string): Promise<FinancialSnapshot> {
    try {
      const request: DataRequest = {
        endpoint: `/v1/stocks/${ticker}/financials`,
        params: {
          period: "annual",
          limit: 5,
        },
      };

      const response = await this.fetch(request);
      const snapshot = this.parseFinancialSnapshot(response.data, ticker);

      return snapshot;
    } catch (error) {
      throw new Error(
        `Failed to fetch financial snapshot for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch fundamentals data (compatible with system Fundamentals interface)
   */
  async fetchFundamentals(ticker: string): Promise<Fundamentals> {
    try {
      const snapshot = await this.fetchFinancialSnapshot(ticker);

      return {
        ticker: snapshot.ticker,
        revenueGrowth5y: snapshot.revenueGrowth5y,
        earningsGrowth5y: snapshot.earningsGrowth5y,
        profitMargin: snapshot.profitMargin,
        debtToEquity: snapshot.debtToEquity,
        freeCashFlow: snapshot.freeCashFlow,
        analyzedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch fundamentals for ${ticker}: ${(error as Error).message}`
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
   * Parse financial snapshot from Morningstar response
   */
  private parseFinancialSnapshot(
    data: any,
    ticker: string
  ): FinancialSnapshot {
    // Morningstar API structure (simplified)
    const financials = data.financials || data;
    const latestYear = financials[0] || {};

    // Calculate 5-year growth rates
    const revenueGrowth5y = this.calculateGrowthRate(
      financials,
      "revenue"
    );
    const earningsGrowth5y = this.calculateGrowthRate(
      financials,
      "netIncome"
    );

    return {
      ticker,
      revenueGrowth5y,
      earningsGrowth5y,
      profitMargin: latestYear.profitMargin || 0,
      debtToEquity: latestYear.debtToEquity || 0,
      freeCashFlow: latestYear.freeCashFlow || 0,
      roe: latestYear.returnOnEquity || 0,
      roa: latestYear.returnOnAssets || 0,
      currentRatio: latestYear.currentRatio || 0,
      quickRatio: latestYear.quickRatio || 0,
      asOfDate: latestYear.fiscalYearEnd || new Date().toISOString(),
    };
  }

  /**
   * Calculate compound annual growth rate over 5 years
   */
  private calculateGrowthRate(
    financials: any[],
    field: string
  ): number {
    if (!financials || financials.length < 2) {
      return 0;
    }

    const latest = financials[0]?.[field];
    const oldest = financials[Math.min(4, financials.length - 1)]?.[field];

    if (!latest || !oldest || oldest === 0) {
      return 0;
    }

    const years = Math.min(5, financials.length);
    const cagr = (Math.pow(latest / oldest, 1 / years) - 1) * 100;

    return cagr;
  }
}
