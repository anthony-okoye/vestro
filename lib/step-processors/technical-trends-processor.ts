import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  TechnicalSignals,
} from "../types";
import { TradingViewAdapter } from "../data-adapters/tradingview-adapter";
import { PolygonAdapter, HistoricalData } from "../data-adapters/polygon-adapter";
import { AlphaVantageAdapter } from "../data-adapters/alpha-vantage-adapter";

/**
 * TechnicalTrendsProcessor (Step 8) - Optional
 * Analyzes technical trends and chart patterns using API adapters
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * API Integration: Uses Polygon for historical data, Alpha Vantage as fallback (Requirement 6.3)
 */
export class TechnicalTrendsProcessor implements StepProcessor {
  stepId = 8;
  stepName = "Technical Trends";
  isOptional = true; // Requirement 8.5: Mark as optional step

  private tradingViewAdapter: TradingViewAdapter;
  private polygonAdapter: PolygonAdapter | null;
  private alphaVantageAdapter: AlphaVantageAdapter | null;

  constructor(
    tradingViewAdapter?: TradingViewAdapter,
    polygonAdapter?: PolygonAdapter,
    alphaVantageAdapter?: AlphaVantageAdapter
  ) {
    this.tradingViewAdapter = tradingViewAdapter || new TradingViewAdapter();
    
    // Initialize API adapters with fallback to null if not configured
    // Requirement 6.3: Use Polygon adapter for historical price data
    try {
      this.polygonAdapter = polygonAdapter || new PolygonAdapter();
    } catch (error) {
      console.warn("Polygon adapter not configured, will use fallback sources");
      this.polygonAdapter = null;
    }
    
    // Requirement 6.3: Use Alpha Vantage as fallback
    try {
      this.alphaVantageAdapter = alphaVantageAdapter || new AlphaVantageAdapter();
    } catch (error) {
      console.warn("Alpha Vantage adapter not configured, will use fallback sources");
      this.alphaVantageAdapter = null;
    }
  }

  /**
   * Validate inputs - requires ticker and optionally indicator selection
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    if (inputs.ticker && inputs.ticker.length > 10) {
      errors.push("Ticker symbol must be 10 characters or less");
    }

    // Requirement 8.2: Accept indicator selection
    if (inputs.indicator) {
      const validIndicators = ["moving average", "RSI"];
      if (!validIndicators.includes(inputs.indicator)) {
        errors.push(
          `Invalid indicator. Must be one of: ${validIndicators.join(", ")}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute technical trends analysis using API adapters with fallback
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   * API Integration: Requirement 6.3
   */
  async execute(
    inputs: StepInputs,
    _context: WorkflowContext
  ): Promise<StepOutputs> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate inputs first
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      const ticker = inputs.ticker as string;
      const indicator = inputs.indicator as "moving average" | "RSI" | undefined;

      // Requirement 6.3: Try to fetch historical data from API adapters first
      let historicalData: HistoricalData | null = null;
      
      // Try Polygon adapter first for historical price data
      if (this.polygonAdapter && this.polygonAdapter.isConfigured()) {
        try {
          historicalData = await this.polygonAdapter.getDailyPrices(ticker, 60);
          warnings.push(`Using Polygon.io API for ${ticker} historical data`);
        } catch (error) {
          warnings.push(
            `Polygon API failed: ${(error as Error).message}. Trying fallback sources...`
          );
        }
      }

      // Fallback to Alpha Vantage if Polygon failed or not configured
      // Note: Alpha Vantage doesn't have a direct historical data method in our adapter
      // So we'll fall back to TradingView if both API sources fail
      
      // Calculate technical signals from historical data or use TradingView
      let technicalSignals: TechnicalSignals;
      
      if (historicalData && historicalData.bars.length > 0) {
        // Calculate technical signals from API data
        technicalSignals = this.calculateTechnicalSignals(ticker, historicalData);
      } else {
        // Fallback to TradingView
        try {
          technicalSignals = await this.tradingViewAdapter.fetchTechnicalSignals(ticker);
          warnings.push(`Using TradingView (web scraping) for ${ticker}`);
        } catch (error) {
          errors.push(
            `Failed to fetch technical signals from all sources: ${(error as Error).message}`
          );
          return {
            success: false,
            errors,
          };
        }
      }

      // Fetch specific indicator data if requested (Requirement 8.2)
      let indicatorData: any = null;
      if (indicator) {
        try {
          indicatorData = await this.tradingViewAdapter.fetchIndicator(
            ticker,
            indicator
          );
        } catch (error) {
          warnings.push(
            `Failed to fetch ${indicator} data: ${(error as Error).message}`
          );
        }
      }

      // Requirement 8.5: Generate Technical Signals
      return {
        success: true,
        technicalSignals,
        indicatorData: indicatorData || undefined,
        historicalData: historicalData || undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute technical trends analysis: ${(error as Error).message}`
      );
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Calculate technical signals from historical price data
   * Requirements: 8.3, 8.4
   * @param ticker - Stock ticker symbol
   * @param historicalData - Historical OHLCV data
   * @returns Technical signals with trend and MA crossover
   */
  private calculateTechnicalSignals(
    ticker: string,
    historicalData: HistoricalData
  ): TechnicalSignals {
    const bars = historicalData.bars;
    
    if (bars.length < 50) {
      throw new Error(`Insufficient historical data for ${ticker} (need at least 50 days)`);
    }

    // Requirement 8.3: Determine price trend
    // Calculate 20-day and 50-day moving averages
    const ma20 = this.calculateSMA(bars.slice(-20).map(b => b.close));
    const ma50 = this.calculateSMA(bars.slice(-50).map(b => b.close));
    const prevMa20 = this.calculateSMA(bars.slice(-21, -1).map(b => b.close));
    const prevMa50 = this.calculateSMA(bars.slice(-51, -1).map(b => b.close));

    // Determine trend based on moving averages
    let trend: "upward" | "downward" | "sideways";
    if (ma20 > ma50 && prevMa20 > prevMa50) {
      trend = "upward";
    } else if (ma20 < ma50 && prevMa20 < prevMa50) {
      trend = "downward";
    } else {
      trend = "sideways";
    }

    // Requirement 8.4: Detect moving average crossover
    // Check if MA20 crossed MA50 in the last period
    const maCross = (ma20 > ma50 && prevMa20 <= prevMa50) || 
                    (ma20 < ma50 && prevMa20 >= prevMa50);

    // Calculate RSI if we have enough data
    let rsi: number | undefined;
    if (bars.length >= 14) {
      rsi = this.calculateRSI(bars.slice(-15).map(b => b.close), 14);
    }

    return {
      ticker: ticker.toUpperCase(),
      trend,
      maCross,
      rsi,
      analyzedAt: new Date(),
    };
  }

  /**
   * Calculate Simple Moving Average
   * @param values - Array of price values
   * @returns SMA value
   */
  private calculateSMA(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   * @param prices - Array of closing prices
   * @param period - RSI period (typically 14)
   * @returns RSI value (0-100)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 50; // Return neutral RSI if insufficient data
    }

    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    // Separate gains and losses
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    // Calculate average gain and loss
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      return 100; // No losses means RSI is 100
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Get required input schema
   */
  getRequiredInputs(): InputSchema[] {
    return [
      {
        name: "ticker",
        type: "string",
        required: true,
        description: "Stock ticker symbol to analyze",
      },
      {
        name: "indicator",
        type: "string",
        required: false,
        description: "Technical indicator to fetch: 'moving average' or 'RSI'",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      technicalSignals: {
        type: "TechnicalSignals",
        description: "Technical analysis signals including trend and MA crossover",
      },
      indicatorData: {
        type: "object",
        description: "Specific indicator data if requested",
      },
    };
  }
}
