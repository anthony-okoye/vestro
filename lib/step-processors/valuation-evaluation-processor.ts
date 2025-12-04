import {
  StepProcessor,
  StepInputs,
  StepOutputs,
  ValidationResult,
  InputSchema,
  OutputSchema,
  WorkflowContext,
  ValuationMetrics,
} from "../types";
import { SimplyWallStAdapter } from "../data-adapters/simplywallst-adapter";
import { AnalysisEngine } from "../analysis-engine";
import { FinancialModelingPrepAdapter } from "../data-adapters/fmp-adapter";
import { AlphaVantageAdapter } from "../data-adapters/alpha-vantage-adapter";

/**
 * ValuationEvaluationProcessor (Step 7)
 * Evaluates stock valuation and peer comparisons using API adapters
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 * API Integration: Uses FMP for valuation metrics, Alpha Vantage for PE ratio and dividend yield (Requirement 6.4)
 */
export class ValuationEvaluationProcessor implements StepProcessor {
  stepId = 7;
  stepName = "Valuation Evaluation";
  isOptional = false;

  private simplyWallStAdapter: SimplyWallStAdapter;
  private analysisEngine: AnalysisEngine;
  private fmpAdapter: FinancialModelingPrepAdapter | null;
  private alphaVantageAdapter: AlphaVantageAdapter | null;

  constructor(
    simplyWallStAdapter?: SimplyWallStAdapter,
    analysisEngine?: AnalysisEngine,
    fmpAdapter?: FinancialModelingPrepAdapter,
    alphaVantageAdapter?: AlphaVantageAdapter
  ) {
    this.simplyWallStAdapter = simplyWallStAdapter || new SimplyWallStAdapter();
    this.analysisEngine = analysisEngine || new AnalysisEngine();
    
    // Initialize API adapters with fallback to null if not configured
    // Requirement 6.4: Use FMP adapter for valuation metrics
    try {
      this.fmpAdapter = fmpAdapter || new FinancialModelingPrepAdapter();
    } catch (error) {
      console.warn("FMP adapter not configured, will use fallback sources");
      this.fmpAdapter = null;
    }
    
    // Requirement 6.4: Use Alpha Vantage for PE ratio and dividend yield
    try {
      this.alphaVantageAdapter = alphaVantageAdapter || new AlphaVantageAdapter();
    } catch (error) {
      console.warn("Alpha Vantage adapter not configured, will use fallback sources");
      this.alphaVantageAdapter = null;
    }
  }

  /**
   * Validate inputs - requires ticker and optionally peer tickers
   */
  validateInputs(inputs: StepInputs): ValidationResult {
    const errors: string[] = [];

    if (!inputs.ticker || typeof inputs.ticker !== "string") {
      errors.push("Ticker symbol is required");
    }

    if (inputs.ticker && inputs.ticker.length > 10) {
      errors.push("Ticker symbol must be 10 characters or less");
    }

    if (inputs.peerTickers) {
      if (!Array.isArray(inputs.peerTickers)) {
        errors.push("Peer tickers must be an array");
      } else {
        for (const peer of inputs.peerTickers) {
          if (typeof peer !== "string" || peer.length > 10) {
            errors.push(`Invalid peer ticker: ${peer}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute valuation evaluation using API adapters with fallback
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
   * API Integration: Requirement 6.4
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
      const peerTickers = (inputs.peerTickers as string[]) || [];

      // Requirement 6.4: Try to fetch valuation data from API adapters first
      let valuationData: any = null;
      
      // Try FMP adapter first for valuation metrics
      if (this.fmpAdapter && this.fmpAdapter.isConfigured()) {
        try {
          valuationData = await this.fetchValuationFromFMP(ticker);
          warnings.push(`Using Financial Modeling Prep API for ${ticker} valuation`);
        } catch (error) {
          warnings.push(
            `FMP API failed: ${(error as Error).message}. Trying Alpha Vantage...`
          );
        }
      }

      // Try Alpha Vantage if FMP failed or not configured
      if (!valuationData && this.alphaVantageAdapter && this.alphaVantageAdapter.isConfigured()) {
        try {
          valuationData = await this.fetchValuationFromAlphaVantage(ticker);
          warnings.push(`Using Alpha Vantage API for ${ticker} valuation`);
        } catch (error) {
          warnings.push(
            `Alpha Vantage API failed: ${(error as Error).message}. Trying fallback sources...`
          );
        }
      }

      // Fallback to Simply Wall St if both API sources failed
      if (!valuationData) {
        try {
          valuationData = await this.simplyWallStAdapter.fetchValuationData(ticker);
          warnings.push(`Using Simply Wall St (web scraping) for ${ticker}`);
        } catch (error) {
          errors.push(
            `Failed to fetch valuation data from all sources: ${(error as Error).message}`
          );
          return {
            success: false,
            errors,
          };
        }
      }

      // Requirement 7.2: Accept comparison ticker symbols (from inputs)
      // Fetch peer data if peer tickers provided
      let peerData: any[] = [];
      if (peerTickers.length > 0) {
        for (const peerTicker of peerTickers) {
          try {
            let peerValuation: any = null;
            
            // Try API adapters first for peer data
            if (this.fmpAdapter && this.fmpAdapter.isConfigured()) {
              try {
                peerValuation = await this.fetchValuationFromFMP(peerTicker);
              } catch (error) {
                // Silently fall through to next source
              }
            }
            
            if (!peerValuation && this.alphaVantageAdapter && this.alphaVantageAdapter.isConfigured()) {
              try {
                peerValuation = await this.fetchValuationFromAlphaVantage(peerTicker);
              } catch (error) {
                // Silently fall through to next source
              }
            }
            
            if (!peerValuation) {
              peerValuation = await this.simplyWallStAdapter.fetchValuationData(peerTicker);
            }
            
            peerData.push({
              ticker: peerTicker,
              peRatio: peerValuation.peRatio,
              pbRatio: peerValuation.pbRatio,
              earningsPerShare: peerValuation.currentPrice / (peerValuation.peRatio || 1),
              bookValuePerShare: peerValuation.currentPrice / (peerValuation.pbRatio || 1),
            });
          } catch (error) {
            warnings.push(
              `Failed to fetch peer data for ${peerTicker}: ${(error as Error).message}`
            );
          }
        }
      }

      // Prepare fundamentals data for analysis engine
      const fundamentals = {
        ticker,
        peRatio: valuationData.peRatio,
        pbRatio: valuationData.pbRatio,
        price: valuationData.currentPrice,
        earningsPerShare: valuationData.currentPrice / (valuationData.peRatio || 1),
        bookValuePerShare: valuationData.currentPrice / (valuationData.pbRatio || 1),
      };

      // Requirements 7.3, 7.4, 7.5: Use analysis engine to calculate PE, PB ratios and peer comparison
      const valuationMetrics = this.analysisEngine.calculateValuations(
        fundamentals,
        peerData
      );

      // Requirement 7.6: Generate Valuations data
      return {
        success: true,
        valuationMetrics,
        additionalMetrics: {
          psRatio: valuationData.psRatio,
          pegRatio: valuationData.pegRatio,
          evToEbitda: valuationData.evToEbitda,
          priceToFreeCashFlow: valuationData.priceToFreeCashFlow,
          currentPrice: valuationData.currentPrice,
          upside: valuationData.upside,
          valuationScore: valuationData.valuationScore,
          dividendYield: valuationData.dividendYield,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to execute valuation evaluation: ${(error as Error).message}`
      );
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Fetch valuation data from FMP API
   * Requirement 6.4: Use FMP adapter for valuation metrics
   * Requirements 7.3, 7.4: Calculate PE and PB ratios
   */
  private async fetchValuationFromFMP(ticker: string): Promise<any> {
    if (!this.fmpAdapter) {
      throw new Error("FMP adapter not configured");
    }

    // Fetch key metrics and company profile
    const [keyMetrics, profile, quote] = await Promise.all([
      this.fmpAdapter.getKeyMetrics(ticker, 'annual', 1),
      this.fmpAdapter.getCompanyProfile(ticker),
      this.fmpAdapter.getIncomeStatement(ticker, 'annual', 1), // For EPS calculation
    ]);

    if (keyMetrics.length === 0) {
      throw new Error(`No valuation metrics available for ${ticker}`);
    }

    const latestMetrics = keyMetrics[0];
    const latestIncome = quote.length > 0 ? quote[0] : null;

    return {
      peRatio: latestMetrics.peRatio || null,
      pbRatio: latestMetrics.pbRatio || null,
      currentPrice: profile.marketCap && latestIncome ? 
        profile.marketCap / (latestIncome.revenue / latestIncome.eps) : 0,
      psRatio: null, // Not directly available from FMP key metrics
      pegRatio: null, // Would need growth rate calculation
      evToEbitda: null, // Not directly available
      priceToFreeCashFlow: null, // Would need calculation
      upside: null,
      valuationScore: null,
      dividendYield: latestMetrics.dividendYield || null,
    };
  }

  /**
   * Fetch valuation data from Alpha Vantage API
   * Requirement 6.4: Use Alpha Vantage for PE ratio and dividend yield
   * Requirements 7.3, 7.4: Calculate PE and PB ratios
   */
  private async fetchValuationFromAlphaVantage(ticker: string): Promise<any> {
    if (!this.alphaVantageAdapter) {
      throw new Error("Alpha Vantage adapter not configured");
    }

    // Fetch company overview which includes PE ratio and dividend yield
    const [overview, quote] = await Promise.all([
      this.alphaVantageAdapter.getCompanyOverview(ticker),
      this.alphaVantageAdapter.getQuote(ticker),
    ]);

    return {
      peRatio: overview.peRatio || null,
      pbRatio: null, // Alpha Vantage overview includes PB ratio in some cases
      currentPrice: quote.price,
      psRatio: null,
      pegRatio: null,
      evToEbitda: null,
      priceToFreeCashFlow: null,
      upside: null,
      valuationScore: null,
      dividendYield: overview.dividendYield || null,
    };
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
        name: "peerTickers",
        type: "array",
        required: false,
        description: "Array of peer ticker symbols for comparison",
      },
    ];
  }

  /**
   * Get output schema
   */
  getOutputSchema(): OutputSchema {
    return {
      valuationMetrics: {
        type: "ValuationMetrics",
        description: "PE and PB ratios with peer comparison analysis",
      },
      additionalMetrics: {
        type: "object",
        description: "Additional valuation metrics (PS, PEG, EV/EBITDA, etc.)",
      },
    };
  }
}
