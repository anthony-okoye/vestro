/**
 * Adapter Factory and Fallback Chain Configuration
 * 
 * This module provides:
 * - Adapter initialization with graceful error handling
 * - Fallback chain configuration for different data types
 * - DataAdapter wrappers for use with FallbackStrategies
 * 
 * Requirements: 5.5 - Configure fallback chains for each data type
 */

import { AlphaVantageAdapter } from "./alpha-vantage-adapter";
import { FinancialModelingPrepAdapter } from "./fmp-adapter";
import { PolygonAdapter } from "./polygon-adapter";
import { FederalReserveAdapter } from "./federal-reserve-adapter";
import { YahooFinanceAdapter } from "./yahoo-finance-adapter";
import { FallbackStrategies, DataAdapter } from "../fallback-strategies";
import { ConfigurationError } from "../api-error";

/**
 * Adapter instances (lazily initialized)
 */
let alphaVantageAdapter: AlphaVantageAdapter | null = null;
let fmpAdapter: FinancialModelingPrepAdapter | null = null;
let polygonAdapter: PolygonAdapter | null = null;
let fredAdapter: FederalReserveAdapter | null = null;
let yahooFinanceAdapter: YahooFinanceAdapter | null = null;

/**
 * Configured fallback strategies instance
 */
let fallbackStrategies: FallbackStrategies | null = null;

/**
 * Initialize an adapter with graceful error handling
 * Returns null if the adapter cannot be configured (e.g., missing API key)
 */
function safeInitializeAdapter<T>(
  name: string,
  factory: () => T
): T | null {
  try {
    return factory();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.warn(`[Adapter Factory] ${name} not configured: ${error.message}`);
      return null;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Initialize all adapters
 * Adapters with missing API keys will be null
 */
export function initializeAdapters(): void {
  // Initialize API-based adapters
  alphaVantageAdapter = safeInitializeAdapter(
    "Alpha Vantage",
    () => new AlphaVantageAdapter()
  );

  fmpAdapter = safeInitializeAdapter(
    "Financial Modeling Prep",
    () => new FinancialModelingPrepAdapter()
  );

  polygonAdapter = safeInitializeAdapter(
    "Polygon.io",
    () => new PolygonAdapter()
  );

  fredAdapter = safeInitializeAdapter(
    "FRED",
    () => new FederalReserveAdapter()
  );

  // Initialize web scraping adapters (always available)
  yahooFinanceAdapter = new YahooFinanceAdapter();

  console.log("[Adapter Factory] Adapters initialized:", {
    alphaVantage: !!alphaVantageAdapter,
    fmp: !!fmpAdapter,
    polygon: !!polygonAdapter,
    fred: !!fredAdapter,
    yahooFinance: !!yahooFinanceAdapter,
  });
}

/**
 * Wrap an adapter method to conform to DataAdapter interface
 */
function createDataAdapter<TRequest, TResponse>(
  sourceName: string,
  isConfigured: () => boolean,
  fetchFn: (request: TRequest) => Promise<TResponse>
): DataAdapter {
  return {
    sourceName,
    isConfigured,
    fetch: fetchFn as (request: any) => Promise<any>,
  };
}

/**
 * Create a stock quote adapter wrapper
 * Supports fetching quotes for a given symbol
 */
export function createStockQuoteAdapter(
  adapter: AlphaVantageAdapter | PolygonAdapter | YahooFinanceAdapter
): DataAdapter {
  if (adapter instanceof AlphaVantageAdapter) {
    return createDataAdapter(
      adapter.sourceName,
      () => adapter.isConfigured(),
      (symbol: string) => adapter.getQuote(symbol)
    );
  } else if (adapter instanceof PolygonAdapter) {
    return createDataAdapter(
      adapter.sourceName,
      () => adapter.isConfigured(),
      (symbol: string) => adapter.getCurrentQuote(symbol)
    );
  } else {
    // YahooFinanceAdapter
    return createDataAdapter(
      adapter.sourceName,
      () => true, // Yahoo Finance doesn't require API key
      (symbol: string) => adapter.fetchQuote(symbol)
    );
  }
}

/**
 * Create a company profile adapter wrapper
 * Supports fetching company profiles for a given symbol
 */
export function createCompanyProfileAdapter(
  adapter: AlphaVantageAdapter | FinancialModelingPrepAdapter | YahooFinanceAdapter
): DataAdapter {
  if (adapter instanceof AlphaVantageAdapter) {
    return createDataAdapter(
      adapter.sourceName,
      () => adapter.isConfigured(),
      (symbol: string) => adapter.getCompanyOverview(symbol)
    );
  } else if (adapter instanceof FinancialModelingPrepAdapter) {
    return createDataAdapter(
      adapter.sourceName,
      () => adapter.isConfigured(),
      (symbol: string) => adapter.getCompanyProfile(symbol)
    );
  } else {
    // YahooFinanceAdapter
    return createDataAdapter(
      adapter.sourceName,
      () => true,
      (symbol: string) => adapter.fetchCompanyProfile(symbol)
    );
  }
}

/**
 * Create a historical data adapter wrapper
 * Supports fetching historical price data for a given symbol
 */
export function createHistoricalDataAdapter(
  adapter: PolygonAdapter | YahooFinanceAdapter
): DataAdapter {
  if (adapter instanceof PolygonAdapter) {
    return createDataAdapter(
      adapter.sourceName,
      () => adapter.isConfigured(),
      ({ symbol, days }: { symbol: string; days: number }) =>
        adapter.getDailyPrices(symbol, days)
    );
  } else {
    // YahooFinanceAdapter - doesn't have historical data method in current implementation
    // This is a placeholder for future implementation
    return createDataAdapter(
      adapter.sourceName,
      () => true,
      async ({ symbol }: { symbol: string }) => {
        // Fallback: return quote data as minimal historical data
        const quote = await adapter.fetchQuote(symbol);
        return {
          symbol: quote.ticker,
          bars: [
            {
              timestamp: quote.timestamp,
              open: quote.price,
              high: quote.price,
              low: quote.price,
              close: quote.price,
              volume: quote.volume,
            },
          ],
          source: adapter.sourceName,
        };
      }
    );
  }
}

/**
 * Create an economic data adapter wrapper
 * Supports fetching economic indicators
 */
export function createEconomicDataAdapter(
  adapter: FederalReserveAdapter
): DataAdapter {
  return createDataAdapter(
    adapter.sourceName,
    () => adapter.isConfigured(),
    (seriesId: string) => adapter.getSeries(seriesId)
  );
}

/**
 * Configure fallback chains for all data types
 * 
 * Fallback priority:
 * - Stock Quotes: Polygon → Alpha Vantage → Yahoo Finance
 * - Company Profiles: Alpha Vantage → FMP → Yahoo Finance
 * - Historical Data: Polygon → Yahoo Finance
 * - Economic Data: FRED (no fallback)
 * 
 * Requirements: 5.5, 6.5
 */
function configureFallbackChains(strategies: FallbackStrategies): void {
  // Ensure adapters are initialized
  if (!yahooFinanceAdapter) {
    throw new Error("Yahoo Finance adapter must be initialized");
  }

  // Stock Quote Fallback Chain: Polygon → Alpha Vantage → Yahoo Finance
  const stockQuoteFallbacks: DataAdapter[] = [];
  let stockQuotePrimary: DataAdapter | null = null;

  if (polygonAdapter) {
    stockQuotePrimary = createStockQuoteAdapter(polygonAdapter);
  }

  if (alphaVantageAdapter) {
    const alphaVantageQuoteAdapter = createStockQuoteAdapter(alphaVantageAdapter);
    if (!stockQuotePrimary) {
      stockQuotePrimary = alphaVantageQuoteAdapter;
    } else {
      stockQuoteFallbacks.push(alphaVantageQuoteAdapter);
    }
  }

  // Yahoo Finance is always available as final fallback
  const yahooQuoteAdapter = createStockQuoteAdapter(yahooFinanceAdapter);
  if (!stockQuotePrimary) {
    stockQuotePrimary = yahooQuoteAdapter;
  } else {
    stockQuoteFallbacks.push(yahooQuoteAdapter);
  }

  if (stockQuotePrimary) {
    strategies.registerFallbackChain("stock-quote", {
      primary: stockQuotePrimary,
      fallbacks: stockQuoteFallbacks,
    });
    console.log(
      `[Fallback] Stock quote chain: ${stockQuotePrimary.sourceName} → ${stockQuoteFallbacks.map((f) => f.sourceName).join(" → ")}`
    );
  }

  // Company Profile Fallback Chain: Alpha Vantage → FMP → Yahoo Finance
  const companyProfileFallbacks: DataAdapter[] = [];
  let companyProfilePrimary: DataAdapter | null = null;

  if (alphaVantageAdapter) {
    companyProfilePrimary = createCompanyProfileAdapter(alphaVantageAdapter);
  }

  if (fmpAdapter) {
    const fmpProfileAdapter = createCompanyProfileAdapter(fmpAdapter);
    if (!companyProfilePrimary) {
      companyProfilePrimary = fmpProfileAdapter;
    } else {
      companyProfileFallbacks.push(fmpProfileAdapter);
    }
  }

  // Yahoo Finance as final fallback
  const yahooProfileAdapter = createCompanyProfileAdapter(yahooFinanceAdapter);
  if (!companyProfilePrimary) {
    companyProfilePrimary = yahooProfileAdapter;
  } else {
    companyProfileFallbacks.push(yahooProfileAdapter);
  }

  if (companyProfilePrimary) {
    strategies.registerFallbackChain("company-profile", {
      primary: companyProfilePrimary,
      fallbacks: companyProfileFallbacks,
    });
    console.log(
      `[Fallback] Company profile chain: ${companyProfilePrimary.sourceName} → ${companyProfileFallbacks.map((f) => f.sourceName).join(" → ")}`
    );
  }

  // Historical Data Fallback Chain: Polygon → Yahoo Finance
  const historicalDataFallbacks: DataAdapter[] = [];
  let historicalDataPrimary: DataAdapter | null = null;

  if (polygonAdapter) {
    historicalDataPrimary = createHistoricalDataAdapter(polygonAdapter);
  }

  // Yahoo Finance as fallback
  const yahooHistoricalAdapter = createHistoricalDataAdapter(yahooFinanceAdapter);
  if (!historicalDataPrimary) {
    historicalDataPrimary = yahooHistoricalAdapter;
  } else {
    historicalDataFallbacks.push(yahooHistoricalAdapter);
  }

  if (historicalDataPrimary) {
    strategies.registerFallbackChain("historical-data", {
      primary: historicalDataPrimary,
      fallbacks: historicalDataFallbacks,
    });
    console.log(
      `[Fallback] Historical data chain: ${historicalDataPrimary.sourceName} → ${historicalDataFallbacks.map((f) => f.sourceName).join(" → ")}`
    );
  }

  // Economic Data: FRED only (no fallback)
  if (fredAdapter) {
    const fredDataAdapter = createEconomicDataAdapter(fredAdapter);
    strategies.registerFallbackChain("economic-data", {
      primary: fredDataAdapter,
      fallbacks: [],
    });
    console.log(`[Fallback] Economic data: ${fredDataAdapter.sourceName} (no fallback)`);
  }
}

/**
 * Get or create the configured FallbackStrategies instance
 * This is a singleton that initializes adapters and configures fallback chains
 * 
 * @returns Configured FallbackStrategies instance
 */
export function getConfiguredFallbackStrategies(): FallbackStrategies {
  if (!fallbackStrategies) {
    // Initialize adapters if not already done
    if (!yahooFinanceAdapter) {
      initializeAdapters();
    }

    // Create and configure fallback strategies
    fallbackStrategies = new FallbackStrategies();
    configureFallbackChains(fallbackStrategies);
  }

  return fallbackStrategies;
}

/**
 * Reset the fallback strategies instance
 * Useful for testing or reconfiguration
 */
export function resetFallbackStrategies(): void {
  fallbackStrategies = null;
  alphaVantageAdapter = null;
  fmpAdapter = null;
  polygonAdapter = null;
  fredAdapter = null;
  yahooFinanceAdapter = null;
}
