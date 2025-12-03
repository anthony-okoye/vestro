import { prisma } from "./prisma";

/**
 * Stock Analysis Cache Manager
 * Provides methods for caching and retrieving stock analysis data
 */

export interface CachedStockData {
  ticker: string;
  companyName?: string;
  sector?: string;
  data: any;
  lastFetched: Date;
}

/**
 * Get cached stock data if available and not stale
 */
export async function getCachedStockData(
  ticker: string,
  maxAgeMinutes: number = 60
): Promise<CachedStockData | null> {
  try {
    const cached = await prisma.stockAnalysisCache.findUnique({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!cached) {
      return null;
    }

    // Check if cache is stale
    const ageMinutes =
      (Date.now() - cached.lastFetched.getTime()) / (1000 * 60);
    
    if (ageMinutes > maxAgeMinutes) {
      return null;
    }

    // Increment hit count
    await prisma.stockAnalysisCache.update({
      where: { ticker: ticker.toUpperCase() },
      data: { hitCount: { increment: 1 } },
    });

    return {
      ticker: cached.ticker,
      companyName: cached.companyName || undefined,
      sector: cached.sector || undefined,
      data: cached.cacheData,
      lastFetched: cached.lastFetched,
    };
  } catch (error) {
    console.error(`Failed to get cached stock data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Store stock data in cache
 */
export async function setCachedStockData(
  ticker: string,
  data: any,
  metadata?: {
    companyName?: string;
    sector?: string;
  }
): Promise<void> {
  try {
    await prisma.stockAnalysisCache.upsert({
      where: { ticker: ticker.toUpperCase() },
      update: {
        cacheData: data,
        companyName: metadata?.companyName,
        sector: metadata?.sector,
        lastFetched: new Date(),
        updatedAt: new Date(),
      },
      create: {
        ticker: ticker.toUpperCase(),
        cacheData: data,
        companyName: metadata?.companyName,
        sector: metadata?.sector,
        lastFetched: new Date(),
      },
    });
  } catch (error) {
    console.error(`Failed to cache stock data for ${ticker}:`, error);
  }
}

/**
 * Invalidate cached data for a specific ticker
 */
export async function invalidateCachedStock(ticker: string): Promise<void> {
  try {
    await prisma.stockAnalysisCache.delete({
      where: { ticker: ticker.toUpperCase() },
    });
  } catch (error) {
    // Ignore errors if cache entry doesn't exist
    console.debug(`Cache entry not found for ${ticker}`);
  }
}

/**
 * Clean up stale cache entries
 */
export async function cleanStaleCache(maxAgeHours: number = 24): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    const result = await prisma.stockAnalysisCache.deleteMany({
      where: {
        lastFetched: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("Failed to clean stale cache:", error);
    return 0;
  }
}

/**
 * Get most frequently accessed stocks
 */
export async function getMostPopularStocks(limit: number = 10): Promise<string[]> {
  try {
    const popular = await prisma.stockAnalysisCache.findMany({
      orderBy: { hitCount: "desc" },
      take: limit,
      select: { ticker: true },
    });

    return popular.map((entry) => entry.ticker);
  } catch (error) {
    console.error("Failed to get popular stocks:", error);
    return [];
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalHits: number;
  averageAge: number;
}> {
  try {
    const entries = await prisma.stockAnalysisCache.findMany({
      select: {
        hitCount: true,
        lastFetched: true,
      },
    });

    const totalEntries = entries.length;
    const totalHits = entries.reduce(
      (sum: number, entry: { hitCount: number }) => sum + entry.hitCount,
      0
    );
    
    const now = Date.now();
    const totalAge = entries.reduce(
      (sum: number, entry: { lastFetched: Date }) => sum + (now - entry.lastFetched.getTime()),
      0
    );
    const averageAge = totalEntries > 0 ? totalAge / totalEntries / (1000 * 60) : 0;

    return {
      totalEntries,
      totalHits,
      averageAge, // in minutes
    };
  } catch (error) {
    console.error("Failed to get cache stats:", error);
    return {
      totalEntries: 0,
      totalHits: 0,
      averageAge: 0,
    };
  }
}
