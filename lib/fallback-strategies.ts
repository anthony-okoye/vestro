/**
 * Fallback strategies for handling missing or unavailable data
 * Requirements: 2.6, 3.4, 4.6, 8.5, 5.5
 */

import { MacroSnapshot, SectorRanking, StockCandidate } from "./types";
import { APIError, ErrorLogger } from "./api-error";

export interface CachedData<T> {
  data: T;
  cachedAt: Date;
  isStale: boolean;
}

export interface FallbackResult<T> {
  data: T;
  usedFallback: boolean;
  fallbackReason?: string;
  warnings: string[];
  source?: string;
}

/**
 * Data adapter interface for fallback chains
 */
export interface DataAdapter {
  sourceName: string;
  isConfigured(): boolean;
  fetch(request: any): Promise<any>;
}

/**
 * Fallback chain configuration for a data type
 */
export interface FallbackChain {
  primary: DataAdapter;
  fallbacks: DataAdapter[];
  cacheKey?: string;
}

/**
 * FallbackStrategies class for handling missing data scenarios
 */
export class FallbackStrategies {
  private macroDataCache: Map<string, CachedData<MacroSnapshot>> = new Map();
  private sectorDataCache: Map<string, CachedData<SectorRanking[]>> = new Map();
  private stockDataCache: Map<string, CachedData<StockCandidate[]>> = new Map();
  private errorLogger = ErrorLogger.getInstance();

  // Cache expiration times (in milliseconds)
  private readonly MACRO_CACHE_TTL = 3600000; // 1 hour
  private readonly SECTOR_CACHE_TTL = 86400000; // 24 hours
  private readonly STOCK_CACHE_TTL = 900000; // 15 minutes

  // Fallback chains for different data types
  private fallbackChains: Map<string, FallbackChain> = new Map();

  /**
   * Fallback for missing macro data
   * Requirement 2.6: Use cached data with staleness warning
   */
  getMacroDataFallback(
    cacheKey: string = "default"
  ): FallbackResult<MacroSnapshot | null> {
    const cached = this.macroDataCache.get(cacheKey);

    if (!cached) {
      return {
        data: null,
        usedFallback: false,
        warnings: ["No macro data available and no cached data found."],
      };
    }

    const warnings: string[] = [];
    if (cached.isStale) {
      warnings.push(
        `Using cached macro data from ${cached.cachedAt.toLocaleString()}. Data may be outdated.`
      );
    }

    return {
      data: cached.data,
      usedFallback: true,
      fallbackReason: "Primary data source unavailable, using cached data",
      warnings,
    };
  }

  /**
   * Cache macro data for future fallback use
   */
  cacheMacroData(data: MacroSnapshot, cacheKey: string = "default"): void {
    this.macroDataCache.set(cacheKey, {
      data,
      cachedAt: new Date(),
      isStale: false,
    });

    // Mark as stale after TTL
    setTimeout(() => {
      const cached = this.macroDataCache.get(cacheKey);
      if (cached) {
        cached.isStale = true;
      }
    }, this.MACRO_CACHE_TTL);
  }

  /**
   * Fallback for sector data unavailable
   * Requirement 3.4: Allow manual sector selection
   */
  getSectorDataFallback(
    manualSectors?: string[]
  ): FallbackResult<SectorRanking[] | null> {
    const warnings: string[] = [];

    // If manual sectors provided, create basic rankings
    if (manualSectors && manualSectors.length > 0) {
      const manualRankings: SectorRanking[] = manualSectors.map((sector, index) => ({
        sectorName: sector,
        score: 50 - index * 5, // Descending scores
        rationale: "Manually selected sector (no automated analysis available)",
        dataPoints: {},
      }));

      warnings.push(
        "Automated sector analysis unavailable. Using manually selected sectors."
      );

      return {
        data: manualRankings,
        usedFallback: true,
        fallbackReason: "Manual sector selection",
        warnings,
      };
    }

    // Try cached data
    const cached = this.sectorDataCache.get("default");
    if (cached) {
      if (cached.isStale) {
        warnings.push(
          `Using cached sector data from ${cached.cachedAt.toLocaleString()}. Data may be outdated.`
        );
      }

      return {
        data: cached.data,
        usedFallback: true,
        fallbackReason: "Using cached sector data",
        warnings,
      };
    }

    return {
      data: null,
      usedFallback: false,
      warnings: [
        "Sector data unavailable. Please provide manual sector selection or try again later.",
      ],
    };
  }

  /**
   * Cache sector data for future fallback use
   */
  cacheSectorData(data: SectorRanking[], cacheKey: string = "default"): void {
    this.sectorDataCache.set(cacheKey, {
      data,
      cachedAt: new Date(),
      isStale: false,
    });

    // Mark as stale after TTL
    setTimeout(() => {
      const cached = this.sectorDataCache.get(cacheKey);
      if (cached) {
        cached.isStale = true;
      }
    }, this.SECTOR_CACHE_TTL);
  }

  /**
   * Fallback for stock screening timeout
   * Requirement 4.6: Return partial results with continuation option
   */
  getStockScreeningFallback(
    partialResults?: StockCandidate[],
    totalExpected?: number
  ): FallbackResult<StockCandidate[] | null> {
    const warnings: string[] = [];

    // If partial results available, return them
    if (partialResults && partialResults.length > 0) {
      if (totalExpected && partialResults.length < totalExpected) {
        warnings.push(
          `Stock screening timed out. Returning ${partialResults.length} of ${totalExpected} expected results. You may continue with these results or retry for complete data.`
        );
      } else {
        warnings.push(
          `Stock screening completed with ${partialResults.length} results (partial data).`
        );
      }

      return {
        data: partialResults,
        usedFallback: true,
        fallbackReason: "Partial results due to timeout",
        warnings,
      };
    }

    // Try cached data
    const cached = this.stockDataCache.get("default");
    if (cached) {
      warnings.push(
        `Using cached stock screening results from ${cached.cachedAt.toLocaleString()}.`
      );

      return {
        data: cached.data,
        usedFallback: true,
        fallbackReason: "Using cached screening results",
        warnings,
      };
    }

    return {
      data: null,
      usedFallback: false,
      warnings: ["Stock screening failed with no partial results available."],
    };
  }

  /**
   * Cache stock screening data for future fallback use
   */
  cacheStockData(data: StockCandidate[], cacheKey: string = "default"): void {
    this.stockDataCache.set(cacheKey, {
      data,
      cachedAt: new Date(),
      isStale: false,
    });

    // Mark as stale after TTL
    setTimeout(() => {
      const cached = this.stockDataCache.get(cacheKey);
      if (cached) {
        cached.isStale = true;
      }
    }, this.STOCK_CACHE_TTL);
  }

  /**
   * Fallback for analyst data missing
   * Requirement: Proceed without sentiment analysis
   */
  getAnalystDataFallback(): FallbackResult<null> {
    return {
      data: null,
      usedFallback: true,
      fallbackReason: "Analyst data unavailable",
      warnings: [
        "Analyst sentiment data is unavailable. Proceeding without analyst ratings. You may continue with fundamental and technical analysis.",
      ],
    };
  }

  /**
   * Fallback for technical analysis unavailable
   * Requirement 8.5: Skip optional step automatically
   */
  getTechnicalAnalysisFallback(): FallbackResult<null> {
    return {
      data: null,
      usedFallback: true,
      fallbackReason: "Technical analysis is optional and unavailable",
      warnings: [
        "Technical analysis is unavailable. This is an optional step and has been automatically skipped. You may proceed with the workflow.",
      ],
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.macroDataCache.clear();
    this.sectorDataCache.clear();
    this.stockDataCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    macroDataCached: number;
    sectorDataCached: number;
    stockDataCached: number;
  } {
    return {
      macroDataCached: this.macroDataCache.size,
      sectorDataCached: this.sectorDataCache.size,
      stockDataCached: this.stockDataCache.size,
    };
  }

  /**
   * Register a fallback chain for a data type
   * Requirement 5.5: Configure fallback chains for each data type
   * @param dataType - Type of data (e.g., "stock-quote", "company-profile")
   * @param chain - Fallback chain configuration
   */
  registerFallbackChain(dataType: string, chain: FallbackChain): void {
    this.fallbackChains.set(dataType, chain);
  }

  /**
   * Fetch data with automatic fallback
   * Requirement 5.5: Attempt fallback after primary source failures
   * @param dataType - Type of data being fetched
   * @param fetchFn - Function to fetch data from an adapter
   * @returns Data with fallback information
   */
  async fetchWithFallback<T>(
    dataType: string,
    fetchFn: (adapter: DataAdapter) => Promise<T>
  ): Promise<FallbackResult<T | null>> {
    const chain = this.fallbackChains.get(dataType);
    
    if (!chain) {
      return {
        data: null,
        usedFallback: false,
        warnings: [`No fallback chain configured for ${dataType}`],
      };
    }

    const warnings: string[] = [];
    const adapters = [chain.primary, ...chain.fallbacks];

    // Try each adapter in the chain
    for (let i = 0; i < adapters.length; i++) {
      const adapter = adapters[i];
      const isPrimary = i === 0;

      // Skip if adapter is not configured
      if (!adapter.isConfigured()) {
        warnings.push(`${adapter.sourceName} is not configured, skipping`);
        continue;
      }

      try {
        const data = await fetchFn(adapter);
        
        return {
          data,
          usedFallback: !isPrimary,
          fallbackReason: isPrimary 
            ? undefined 
            : `Primary source failed, using ${adapter.sourceName}`,
          warnings,
          source: adapter.sourceName,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        warnings.push(`${adapter.sourceName} failed: ${errorMessage}`);

        // Log the error
        if (error instanceof APIError) {
          this.errorLogger.log(error, { dataType, adapterIndex: i });
        }

        // If this is not the last adapter and the error is retryable, continue to next
        if (i < adapters.length - 1) {
          if (error instanceof APIError && error.retryable) {
            continue;
          }
          // For non-retryable errors, still try fallbacks
          continue;
        }
      }
    }

    // All adapters failed
    return {
      data: null,
      usedFallback: false,
      warnings: [
        ...warnings,
        `All data sources failed for ${dataType}`,
      ],
    };
  }

  /**
   * Get configured fallback chains
   */
  getFallbackChains(): Map<string, FallbackChain> {
    return new Map(this.fallbackChains);
  }

  /**
   * Clear a specific fallback chain
   */
  clearFallbackChain(dataType: string): void {
    this.fallbackChains.delete(dataType);
  }

  /**
   * Clear all fallback chains
   */
  clearAllFallbackChains(): void {
    this.fallbackChains.clear();
  }

  /**
   * Configure default adapter priorities for API integration
   * Requirement 6.5: Set API adapters as primary, web scraping as fallback
   * 
   * Priority order:
   * 1. API adapters (Alpha Vantage, FMP, Polygon, FRED)
   * 2. Web scraping adapters (as fallback)
   * 
   * @param adapters - Object containing all available adapters
   */
  configureAPIAdapterPriority(adapters: {
    alphaVantage?: DataAdapter;
    fmp?: DataAdapter;
    polygon?: DataAdapter;
    fred?: DataAdapter;
    morningstar?: DataAdapter;
    simplyWallSt?: DataAdapter;
    tradingView?: DataAdapter;
    secEdgar?: DataAdapter;
    yahoo?: DataAdapter;
    finviz?: DataAdapter;
  }): void {
    // Stock quotes: Polygon -> Alpha Vantage -> Yahoo Finance
    if (adapters.polygon || adapters.alphaVantage || adapters.yahoo) {
      const quoteAdapters: DataAdapter[] = [];
      if (adapters.polygon) quoteAdapters.push(adapters.polygon);
      if (adapters.alphaVantage) quoteAdapters.push(adapters.alphaVantage);
      if (adapters.yahoo) quoteAdapters.push(adapters.yahoo);

      if (quoteAdapters.length > 0) {
        this.registerFallbackChain("stock-quote", {
          primary: quoteAdapters[0],
          fallbacks: quoteAdapters.slice(1),
        });
      }
    }

    // Company profiles: Alpha Vantage -> FMP -> Morningstar
    if (adapters.alphaVantage || adapters.fmp || adapters.morningstar) {
      const profileAdapters: DataAdapter[] = [];
      if (adapters.alphaVantage) profileAdapters.push(adapters.alphaVantage);
      if (adapters.fmp) profileAdapters.push(adapters.fmp);
      if (adapters.morningstar) profileAdapters.push(adapters.morningstar);

      if (profileAdapters.length > 0) {
        this.registerFallbackChain("company-profile", {
          primary: profileAdapters[0],
          fallbacks: profileAdapters.slice(1),
        });
      }
    }

    // Financial statements: FMP -> Morningstar -> SEC Edgar
    if (adapters.fmp || adapters.morningstar || adapters.secEdgar) {
      const financialAdapters: DataAdapter[] = [];
      if (adapters.fmp) financialAdapters.push(adapters.fmp);
      if (adapters.morningstar) financialAdapters.push(adapters.morningstar);
      if (adapters.secEdgar) financialAdapters.push(adapters.secEdgar);

      if (financialAdapters.length > 0) {
        this.registerFallbackChain("financial-statements", {
          primary: financialAdapters[0],
          fallbacks: financialAdapters.slice(1),
        });
      }
    }

    // Historical price data: Polygon -> Alpha Vantage -> TradingView
    if (adapters.polygon || adapters.alphaVantage || adapters.tradingView) {
      const historicalAdapters: DataAdapter[] = [];
      if (adapters.polygon) historicalAdapters.push(adapters.polygon);
      if (adapters.alphaVantage) historicalAdapters.push(adapters.alphaVantage);
      if (adapters.tradingView) historicalAdapters.push(adapters.tradingView);

      if (historicalAdapters.length > 0) {
        this.registerFallbackChain("historical-data", {
          primary: historicalAdapters[0],
          fallbacks: historicalAdapters.slice(1),
        });
      }
    }

    // Valuation metrics: FMP -> Alpha Vantage -> Simply Wall St
    if (adapters.fmp || adapters.alphaVantage || adapters.simplyWallSt) {
      const valuationAdapters: DataAdapter[] = [];
      if (adapters.fmp) valuationAdapters.push(adapters.fmp);
      if (adapters.alphaVantage) valuationAdapters.push(adapters.alphaVantage);
      if (adapters.simplyWallSt) valuationAdapters.push(adapters.simplyWallSt);

      if (valuationAdapters.length > 0) {
        this.registerFallbackChain("valuation-metrics", {
          primary: valuationAdapters[0],
          fallbacks: valuationAdapters.slice(1),
        });
      }
    }

    // Economic indicators: FRED (API only, no fallback)
    if (adapters.fred) {
      this.registerFallbackChain("economic-indicators", {
        primary: adapters.fred,
        fallbacks: [],
      });
    }

    // Sector data: Finviz -> Yahoo Finance
    if (adapters.finviz || adapters.yahoo) {
      const sectorAdapters: DataAdapter[] = [];
      if (adapters.finviz) sectorAdapters.push(adapters.finviz);
      if (adapters.yahoo) sectorAdapters.push(adapters.yahoo);

      if (sectorAdapters.length > 0) {
        this.registerFallbackChain("sector-data", {
          primary: sectorAdapters[0],
          fallbacks: sectorAdapters.slice(1),
        });
      }
    }
  }
}
