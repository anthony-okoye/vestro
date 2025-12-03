import { unstable_cache } from "next/cache";

/**
 * Cache configuration for different data types
 * Based on data freshness requirements
 */
export const CACHE_CONFIG = {
  // Macro economic data - updates infrequently (1 hour)
  MACRO_DATA: {
    revalidate: 3600, // 1 hour in seconds
    tags: ["macro-data"],
  },
  // Sector data - daily updates (24 hours)
  SECTOR_DATA: {
    revalidate: 86400, // 24 hours in seconds
    tags: ["sector-data"],
  },
  // Stock quotes - frequent updates (15 minutes)
  QUOTES: {
    revalidate: 900, // 15 minutes in seconds
    tags: ["quotes"],
  },
  // Company profiles - rarely change (7 days)
  COMPANY_PROFILES: {
    revalidate: 604800, // 7 days in seconds
    tags: ["company-profiles"],
  },
  // Financial filings - updates quarterly (1 day)
  FINANCIAL_FILINGS: {
    revalidate: 86400, // 1 day in seconds
    tags: ["financial-filings"],
  },
  // Analyst ratings - daily updates (1 day)
  ANALYST_RATINGS: {
    revalidate: 86400, // 1 day in seconds
    tags: ["analyst-ratings"],
  },
  // Valuation data - daily updates (1 day)
  VALUATION_DATA: {
    revalidate: 86400, // 1 day in seconds
    tags: ["valuation-data"],
  },
} as const;

/**
 * Create a cached version of a data fetching function
 * Uses Next.js unstable_cache for server-side caching
 */
export function createCachedFetcher<T extends (...args: any[]) => Promise<any>>(
  fetcher: T,
  cacheKey: string,
  config: { revalidate: number; tags: string[] }
): T {
  return unstable_cache(
    fetcher,
    [cacheKey],
    {
      revalidate: config.revalidate,
      tags: config.tags,
    }
  ) as T;
}

/**
 * Cache key generators for consistent cache keys
 */
export const CacheKeys = {
  macroData: () => "macro-data",
  interestRate: () => "interest-rate",
  inflationRate: () => "inflation-rate",
  unemploymentRate: () => "unemployment-rate",
  marketTrend: (source: string) => `market-trend-${source}`,
  sectorData: () => "sector-data",
  sectorPerformance: (ticker: string) => `sector-performance-${ticker}`,
  quote: (ticker: string) => `quote-${ticker}`,
  companyProfile: (ticker: string) => `company-profile-${ticker}`,
  stockScreen: (filtersHash: string) => `stock-screen-${filtersHash}`,
  financialFilings: (ticker: string, formType: string) => `filings-${ticker}-${formType}`,
  analystRatings: (ticker: string) => `analyst-ratings-${ticker}`,
  valuationData: (ticker: string) => `valuation-${ticker}`,
} as const;

/**
 * Generate a hash for screening filters to use as cache key
 */
export function hashScreeningFilters(filters: Record<string, any>): string {
  const sortedKeys = Object.keys(filters).sort();
  const filterString = sortedKeys
    .map((key) => `${key}:${filters[key]}`)
    .join("|");
  
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < filterString.length; i++) {
    const char = filterString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}
