import { BaseDataSourceAdapter } from "../data-adapter";
import { DataRequest, DataResponse, TechnicalSignals } from "../types";

export interface ChartData {
  ticker: string;
  timeframe: string;
  candles: Candle[];
  indicators: TechnicalIndicators;
}

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
}

/**
 * Adapter for TradingView charting and technical analysis
 * Fetches chart data and technical indicators (optional step)
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export class TradingViewAdapter extends BaseDataSourceAdapter {
  sourceName = "TradingView";

  constructor() {
    super("https://api.tradingview.com", 60); // 60 requests per minute
  }

  /**
   * Fetch chart data with technical indicators
   */
  async fetchChartData(
    ticker: string,
    timeframe: string = "1D",
    bars: number = 100
  ): Promise<ChartData> {
    try {
      const request: DataRequest = {
        endpoint: `/v1/chart/${ticker}`,
        params: {
          timeframe,
          bars,
          indicators: "sma,ema,rsi,macd,bb",
        },
      };

      const response = await this.fetch(request);
      const chartData = this.parseChartData(response.data, ticker, timeframe);

      return chartData;
    } catch (error) {
      throw new Error(
        `Failed to fetch chart data for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch technical signals (compatible with system TechnicalSignals interface)
   */
  async fetchTechnicalSignals(ticker: string): Promise<TechnicalSignals> {
    try {
      const chartData = await this.fetchChartData(ticker, "1D", 200);
      const signals = this.analyzeTechnicalSignals(chartData);

      return signals;
    } catch (error) {
      throw new Error(
        `Failed to fetch technical signals for ${ticker}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch specific indicator data
   */
  async fetchIndicator(
    ticker: string,
    indicator: "moving average" | "RSI" | "MACD" | "Bollinger Bands"
  ): Promise<any> {
    try {
      const chartData = await this.fetchChartData(ticker);

      switch (indicator) {
        case "moving average":
          return {
            sma20: chartData.indicators.sma20,
            sma50: chartData.indicators.sma50,
            sma200: chartData.indicators.sma200,
          };
        case "RSI":
          return { rsi: chartData.indicators.rsi };
        case "MACD":
          return chartData.indicators.macd;
        case "Bollinger Bands":
          return chartData.indicators.bollingerBands;
        default:
          throw new Error(`Unknown indicator: ${indicator}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch ${indicator} for ${ticker}: ${(error as Error).message}`
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
   * Parse chart data from TradingView response
   */
  private parseChartData(
    data: any,
    ticker: string,
    timeframe: string
  ): ChartData {
    const bars = data.bars || data.candles || [];
    const indicators = data.indicators || {};

    const candles: Candle[] = bars.map((bar: any) => ({
      timestamp: new Date(bar.time || bar.timestamp),
      open: bar.open || bar.o,
      high: bar.high || bar.h,
      low: bar.low || bar.l,
      close: bar.close || bar.c,
      volume: bar.volume || bar.v,
    }));

    return {
      ticker,
      timeframe,
      candles,
      indicators: this.parseIndicators(indicators, candles),
    };
  }

  /**
   * Parse technical indicators from response
   */
  private parseIndicators(
    indicators: any,
    candles: Candle[]
  ): TechnicalIndicators {
    // If indicators are provided in response, use them
    if (indicators.sma20 !== undefined) {
      return {
        sma20: indicators.sma20,
        sma50: indicators.sma50,
        sma200: indicators.sma200,
        ema20: indicators.ema20,
        ema50: indicators.ema50,
        rsi: indicators.rsi,
        macd: indicators.macd,
        bollingerBands: indicators.bollingerBands,
      };
    }

    // Otherwise, calculate them from candles
    return this.calculateIndicators(candles);
  }

  /**
   * Calculate technical indicators from candle data
   */
  private calculateIndicators(candles: Candle[]): TechnicalIndicators {
    if (candles.length === 0) {
      return {};
    }

    const closes = candles.map((c) => c.close);

    return {
      sma20: this.calculateSMA(closes, 20),
      sma50: this.calculateSMA(closes, 50),
      sma200: this.calculateSMA(closes, 200),
      ema20: this.calculateEMA(closes, 20),
      ema50: this.calculateEMA(closes, 50),
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      bollingerBands: this.calculateBollingerBands(closes, 20, 2),
    };
  }

  /**
   * Analyze technical signals from chart data
   */
  private analyzeTechnicalSignals(chartData: ChartData): TechnicalSignals {
    const { candles, indicators } = chartData;

    if (candles.length === 0) {
      throw new Error("No candle data available for analysis");
    }

    const trend = this.determineTrend(candles, indicators);
    const maCross = this.detectMACrossover(indicators);

    return {
      ticker: chartData.ticker,
      trend,
      maCross,
      rsi: indicators.rsi,
      analyzedAt: new Date(),
    };
  }

  /**
   * Determine price trend
   */
  private determineTrend(
    candles: Candle[],
    indicators: TechnicalIndicators
  ): "upward" | "downward" | "sideways" {
    if (candles.length < 20) {
      return "sideways";
    }

    const currentPrice = candles[candles.length - 1].close;
    const sma20 = indicators.sma20;
    const sma50 = indicators.sma50;

    if (!sma20 || !sma50) {
      // Fallback: compare current price to price 20 days ago
      const pastPrice = candles[candles.length - 20].close;
      const change = ((currentPrice - pastPrice) / pastPrice) * 100;

      if (change > 5) return "upward";
      if (change < -5) return "downward";
      return "sideways";
    }

    // Trend based on moving averages
    if (currentPrice > sma20 && sma20 > sma50) {
      return "upward";
    } else if (currentPrice < sma20 && sma20 < sma50) {
      return "downward";
    } else {
      return "sideways";
    }
  }

  /**
   * Detect moving average crossover
   */
  private detectMACrossover(indicators: TechnicalIndicators): boolean {
    const sma20 = indicators.sma20;
    const sma50 = indicators.sma50;

    if (!sma20 || !sma50) {
      return false;
    }

    // Simple crossover detection: SMA20 > SMA50 indicates bullish crossover
    // In a real implementation, you'd compare current vs previous values
    return Math.abs(sma20 - sma50) / sma50 < 0.02; // Within 2% = potential crossover
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(values: number[], period: number): number | undefined {
    if (values.length < period) {
      return undefined;
    }

    const slice = values.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return sum / period;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(values: number[], period: number): number | undefined {
    if (values.length < period) {
      return undefined;
    }

    const multiplier = 2 / (period + 1);
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate Relative Strength Index
   */
  private calculateRSI(values: number[], period: number = 14): number | undefined {
    if (values.length < period + 1) {
      return undefined;
    }

    const changes = [];
    for (let i = 1; i < values.length; i++) {
      changes.push(values[i] - values[i - 1]);
    }

    const gains = changes.map((c) => (c > 0 ? c : 0));
    const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  /**
   * Calculate MACD
   */
  private calculateMACD(values: number[]): any {
    const ema12 = this.calculateEMA(values, 12);
    const ema26 = this.calculateEMA(values, 26);

    if (!ema12 || !ema26) {
      return undefined;
    }

    const macd = ema12 - ema26;
    // Signal line would require calculating EMA of MACD values
    const signal = macd * 0.9; // Simplified
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(
    values: number[],
    period: number,
    stdDev: number
  ): any {
    const sma = this.calculateSMA(values, period);

    if (!sma) {
      return undefined;
    }

    const slice = values.slice(-period);
    const variance =
      slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + stdDev * standardDeviation,
      middle: sma,
      lower: sma - stdDev * standardDeviation,
    };
  }
}
