/**
 * Fallback strategies for handling missing or unavailable data
 * Requirements: 2.6, 3.4, 4.6, 8.5
 */

import { MacroSnapshot, SectorRanking, StockCandidate } from "./types";

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
}

/**
 * FallbackStrategies class for handling missing data scenarios
 */
export class FallbackStrategies {
  private macroDataCache: Map<string, CachedData<MacroSnapshot>> = new Map();
  private sectorDataCache: Map<string, CachedData<SectorRanking[]>> = new Map();
  private stockDataCache: Map<string, CachedData<StockCandidate[]>> = new Map();

  // Cache expiration times (in milliseconds)
  private readonly MACRO_CACHE_TTL = 3600000; // 1 hour
  private readonly SECTOR_CACHE_TTL = 86400000; // 24 hours
  private readonly STOCK_CACHE_TTL = 900000; // 15 minutes

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
}
