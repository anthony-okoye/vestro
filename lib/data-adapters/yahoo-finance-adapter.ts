import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse } from "../types";
import { createCachedFetcher, CACHE_CONFIG, CacheKeys } from "../cache-config";

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  timestamp: Date;
}

export interface SectorData {
  sectorName: string;
  performance1Day: number;
  performance1Week: number;
  performance1Month: number;
  performance3Month: number;
  performance1Year: number;
  marketCap: number;
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  website?: string;
  employees?: number;
  headquarters?: string;
  founded?: string;
}

export interface FinancialData {
  ticker: string;
  revenueGrowth5y: number;
  earningsGrowth5y: number;
  profitMargin: number;
  debtToEquity: number;
  freeCashFlow: number;
  returnOnEquity: number;
  totalRevenue: number;
  netIncome: number;
  totalDebt: number;
  totalCash: number;
  operatingCashFlow: number;
  source: string;
}

/**
 * Adapter for Yahoo Finance data
 * Fetches stock quotes, sector data, and company profiles
 */
export class YahooFinanceAdapter extends BaseDataSourceAdapter {
  sourceName = "Yahoo Finance";

  constructor() {
    super("https://query2.finance.yahoo.com", 120); // 120 requests per minute
  }

  /**
   * Fetch real-time quote for a ticker
   */
  async fetchQuote(ticker: string): Promise<Quote> {
    return this.fetchQuoteCached(ticker);
  }

  /**
   * Cached version of fetchQuote
   * Cache for 15 minutes (quotes update frequently)
   */
  private fetchQuoteCached = createCachedFetcher(
    async (ticker: string): Promise<Quote> => {
      try {
        const request: DataRequest = {
          endpoint: "/v7/finance/quote",
          params: {
            symbols: ticker,
          },
        };

        const response = await this.fetch(request);
        const quote = this.parseQuote(response.data, ticker);

        return quote;
      } catch (error) {
        throw new Error(
          `Failed to fetch quote for ${ticker}: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.quote("dynamic"),
    { ...CACHE_CONFIG.QUOTES }
  );

  /**
   * Fetch sector performance data
   */
  async fetchSectorData(): Promise<SectorData[]> {
    return this.fetchSectorDataCached();
  }

  /**
   * Cached version of fetchSectorData
   * Cache for 24 hours (sector data updates daily)
   */
  private fetchSectorDataCached = createCachedFetcher(
    async (): Promise<SectorData[]> => {
      try {
        // Yahoo Finance sector tickers
        const sectorTickers = [
          "XLK", // Technology
          "XLF", // Financials
          "XLV", // Healthcare
          "XLE", // Energy
          "XLI", // Industrials
          "XLY", // Consumer Discretionary
          "XLP", // Consumer Staples
          "XLU", // Utilities
          "XLRE", // Real Estate
          "XLB", // Materials
          "XLC", // Communication Services
        ];

        const sectorDataPromises = sectorTickers.map((ticker) =>
          this.fetchSectorPerformance(ticker)
        );

        const sectorData = await Promise.all(sectorDataPromises);

        return sectorData.filter((data) => data !== null) as SectorData[];
      } catch (error) {
        throw new Error(
          `Failed to fetch sector data: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.sectorData(),
    { ...CACHE_CONFIG.SECTOR_DATA }
  );

  /**
   * Fetch company profile information
   */
  async fetchCompanyProfile(ticker: string): Promise<CompanyProfile> {
    return this.fetchCompanyProfileCached(ticker);
  }

  /**
   * Cached version of fetchCompanyProfile
   * Cache for 7 days (company profiles rarely change)
   * Uses query1.finance.yahoo.com which doesn't require authentication
   */
  private fetchCompanyProfileCached = createCachedFetcher(
    async (ticker: string): Promise<CompanyProfile> => {
      try {
        // Use query1 endpoint which is more reliable and doesn't require auth
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=assetProfile,summaryProfile`;
        
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const profile = this.parseCompanyProfile(data, ticker);

        return profile;
      } catch (error) {
        throw new Error(
          `Failed to fetch company profile for ${ticker}: ${(error as Error).message}`
        );
      }
    },
    CacheKeys.companyProfile("dynamic"),
    CACHE_CONFIG.COMPANY_PROFILES
  );

  /**
   * Fetch financial data including fundamentals
   * Uses Yahoo Finance quoteSummary with financial modules
   */
  async fetchFinancialData(ticker: string): Promise<FinancialData> {
    return this.fetchFinancialDataCached(ticker);
  }

  /**
   * Cached version of fetchFinancialData
   * Cache for 24 hours (financial data updates quarterly)
   * Uses query1.finance.yahoo.com which doesn't require authentication
   */
  private fetchFinancialDataCached = createCachedFetcher(
    async (ticker: string): Promise<FinancialData> => {
      try {
        // Use query1 endpoint which is more reliable and doesn't require auth
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=financialData,defaultKeyStatistics,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory`;
        
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const financialData = this.parseFinancialData(data, ticker);

        return financialData;
      } catch (error) {
        throw new Error(
          `Failed to fetch financial data for ${ticker}: ${(error as Error).message}`
        );
      }
    },
    "yahoo-financial-data",
    { ...CACHE_CONFIG.FINANCIAL_STATEMENTS }
  );

  /**
   * Perform the actual HTTP fetch
   */
  protected async performFetch(request: DataRequest): Promise<DataResponse> {
    const url = this.buildUrl(request.endpoint, request.params);

    const response = await fetch(url, {
      headers: {
        ...request.headers,
        "User-Agent": "Mozilla/5.0",
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
   * Fetch sector performance for a specific ETF ticker
   */
  private async fetchSectorPerformance(ticker: string): Promise<SectorData | null> {
    try {
      const request: DataRequest = {
        endpoint: "/v8/finance/chart/" + ticker,
        params: {
          range: "1y",
          interval: "1d",
        },
      };

      const response = await this.fetch(request);
      return this.parseSectorPerformance(response.data, ticker);
    } catch {
      return null;
    }
  }

  /**
   * Parse quote data from Yahoo Finance response
   */
  private parseQuote(data: any, ticker: string): Quote {
    const result = data.quoteResponse?.result?.[0];

    if (!result) {
      throw new Error(`No quote data found for ${ticker}`);
    }

    return {
      ticker: result.symbol,
      price: result.regularMarketPrice || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      volume: result.regularMarketVolume || 0,
      marketCap: result.marketCap,
      peRatio: result.trailingPE,
      dividendYield: result.dividendYield ? result.dividendYield * 100 : undefined,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
      timestamp: new Date(),
    };
  }

  /**
   * Parse sector performance from chart data
   */
  private parseSectorPerformance(data: any, ticker: string): SectorData | null {
    const result = data.chart?.result?.[0];

    if (!result || !result.indicators?.quote?.[0]) {
      return null;
    }

    const closes = result.indicators.quote[0].close;

    if (!closes || closes.length === 0) {
      return null;
    }

    const sectorNames: Record<string, string> = {
      XLK: "Technology",
      XLF: "Financials",
      XLV: "Healthcare",
      XLE: "Energy",
      XLI: "Industrials",
      XLY: "Consumer Discretionary",
      XLP: "Consumer Staples",
      XLU: "Utilities",
      XLRE: "Real Estate",
      XLB: "Materials",
      XLC: "Communication Services",
    };

    // Calculate performance metrics
    const performance1Day = this.calculateReturn(closes, 1);
    const performance1Week = this.calculateReturn(closes, 5);
    const performance1Month = this.calculateReturn(closes, 21);
    const performance3Month = this.calculateReturn(closes, 63);
    const performance1Year = this.calculateReturn(closes, 252);

    return {
      sectorName: sectorNames[ticker] || ticker,
      performance1Day,
      performance1Week,
      performance1Month,
      performance3Month,
      performance1Year,
      marketCap: 0, // Not available from chart data
    };
  }

  /**
   * Parse company profile from Yahoo Finance response
   */
  private parseCompanyProfile(data: any, ticker: string): CompanyProfile {
    const profile = data.quoteSummary?.result?.[0]?.assetProfile;
    const summary = data.quoteSummary?.result?.[0]?.summaryProfile;

    if (!profile && !summary) {
      throw new Error(`No profile data found for ${ticker}`);
    }

    return {
      ticker,
      name: profile?.longName || summary?.longName || ticker,
      sector: profile?.sector || summary?.sector || "Unknown",
      industry: profile?.industry || summary?.industry || "Unknown",
      description: profile?.longBusinessSummary || summary?.longBusinessSummary || "",
      website: profile?.website || summary?.website,
      employees: profile?.fullTimeEmployees,
      headquarters: profile?.city && profile?.state
        ? `${profile.city}, ${profile.state}, ${profile.country}`
        : undefined,
      founded: profile?.founded,
    };
  }

  /**
   * Calculate return over a period
   */
  private calculateReturn(closes: number[], periods: number): number {
    if (closes.length < periods + 1) {
      return 0;
    }

    const currentPrice = closes[closes.length - 1];
    const pastPrice = closes[closes.length - 1 - periods];

    if (!currentPrice || !pastPrice || pastPrice === 0) {
      return 0;
    }

    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  /**
   * Parse financial data from Yahoo Finance quoteSummary response
   */
  private parseFinancialData(data: any, ticker: string): FinancialData {
    const result = data.quoteSummary?.result?.[0];

    if (!result) {
      throw new Error(`No financial data found for ${ticker}`);
    }

    const financialData = result.financialData || {};
    const keyStats = result.defaultKeyStatistics || {};
    const incomeHistory = result.incomeStatementHistory?.incomeStatementHistory || [];
    const balanceHistory = result.balanceSheetHistory?.balanceSheetStatements || [];
    const cashflowHistory = result.cashflowStatementHistory?.cashflowStatements || [];

    // Extract raw values from Yahoo's nested structure
    const getRawValue = (obj: any): number => {
      if (!obj) return 0;
      return obj.raw || obj.value || (typeof obj === 'number' ? obj : 0);
    };

    // Calculate 5-year revenue growth from income history
    let revenueGrowth5y = 0;
    if (incomeHistory.length >= 2) {
      const revenues = incomeHistory.map((stmt: any) => getRawValue(stmt.totalRevenue)).filter((v: number) => v > 0);
      if (revenues.length >= 2) {
        const latest = revenues[0];
        const oldest = revenues[revenues.length - 1];
        const years = revenues.length - 1;
        revenueGrowth5y = oldest > 0 ? (Math.pow(latest / oldest, 1 / years) - 1) * 100 : 0;
      }
    }

    // Calculate 5-year earnings growth from income history
    let earningsGrowth5y = 0;
    if (incomeHistory.length >= 2) {
      const earnings = incomeHistory.map((stmt: any) => getRawValue(stmt.netIncome)).filter((v: number) => v > 0);
      if (earnings.length >= 2) {
        const latest = earnings[0];
        const oldest = earnings[earnings.length - 1];
        const years = earnings.length - 1;
        earningsGrowth5y = oldest > 0 ? (Math.pow(latest / oldest, 1 / years) - 1) * 100 : 0;
      }
    }

    // Get latest values
    const latestIncome = incomeHistory[0] || {};
    const latestBalance = balanceHistory[0] || {};
    const latestCashflow = cashflowHistory[0] || {};

    const totalRevenue = getRawValue(latestIncome.totalRevenue);
    const netIncome = getRawValue(latestIncome.netIncome);
    const totalDebt = getRawValue(financialData.totalDebt) || getRawValue(latestBalance.longTermDebt);
    const totalCash = getRawValue(financialData.totalCash) || getRawValue(latestBalance.cash);
    const totalEquity = getRawValue(latestBalance.totalStockholderEquity);
    const operatingCashFlow = getRawValue(latestCashflow.totalCashFromOperatingActivities);

    // Calculate ratios
    const profitMargin = getRawValue(financialData.profitMargins) * 100 || 
      (totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0);
    
    const debtToEquity = getRawValue(financialData.debtToEquity) / 100 || 
      (totalEquity > 0 ? totalDebt / totalEquity : 0);
    
    const returnOnEquity = getRawValue(financialData.returnOnEquity) * 100 || 
      getRawValue(keyStats.returnOnEquity) * 100 || 0;

    // Free cash flow = Operating cash flow - Capital expenditures
    const capex = Math.abs(getRawValue(latestCashflow.capitalExpenditures));
    const freeCashFlow = operatingCashFlow - capex;

    return {
      ticker: ticker.toUpperCase(),
      revenueGrowth5y,
      earningsGrowth5y,
      profitMargin,
      debtToEquity,
      freeCashFlow,
      returnOnEquity,
      totalRevenue,
      netIncome,
      totalDebt,
      totalCash,
      operatingCashFlow,
      source: this.sourceName,
    };
  }
}
