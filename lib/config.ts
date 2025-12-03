/**
 * Centralized configuration for the ResurrectionStockPicker application
 * Loads and validates environment variables
 */

export const config = {
  // Application
  app: {
    nodeEnv: process.env.NODE_ENV || "development",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || "",
  },

  // Data Source URLs
  dataSources: {
    secEdgar: {
      baseUrl: process.env.SEC_EDGAR_BASE_URL || "https://www.sec.gov/cgi-bin/browse-edgar",
      apiUrl: process.env.SEC_EDGAR_API_URL || "https://data.sec.gov",
    },
    yahooFinance: {
      baseUrl: process.env.YAHOO_FINANCE_BASE_URL || "https://finance.yahoo.com",
      queryUrl: process.env.YAHOO_FINANCE_QUERY_URL || "https://query2.finance.yahoo.com",
    },
    finviz: {
      baseUrl: process.env.FINVIZ_BASE_URL || "https://finviz.com",
      screenerUrl: process.env.FINVIZ_SCREENER_URL || "https://finviz.com/screener.ashx",
    },
    federalReserve: {
      apiUrl: process.env.FEDERAL_RESERVE_API_URL || "https://api.stlouisfed.org/fred",
      apiKey: process.env.FEDERAL_RESERVE_API_KEY || "",
    },
    cnbc: {
      baseUrl: process.env.CNBC_BASE_URL || "https://www.cnbc.com",
      apiUrl: process.env.CNBC_API_URL || "https://api.cnbc.com",
    },
    bloomberg: {
      baseUrl: process.env.BLOOMBERG_BASE_URL || "https://www.bloomberg.com",
    },
    morningstar: {
      baseUrl: process.env.MORNINGSTAR_BASE_URL || "https://www.morningstar.com",
      apiKey: process.env.MORNINGSTAR_API_KEY || "",
    },
    reuters: {
      baseUrl: process.env.REUTERS_BASE_URL || "https://www.reuters.com",
    },
    simplyWallSt: {
      apiUrl: process.env.SIMPLY_WALL_ST_API_URL || "https://api.simplywall.st",
      apiKey: process.env.SIMPLY_WALL_ST_API_KEY || "",
    },
    tradingView: {
      baseUrl: process.env.TRADINGVIEW_BASE_URL || "https://www.tradingview.com",
    },
    tipRanks: {
      apiUrl: process.env.TIPRANKS_API_URL || "https://www.tipranks.com/api",
      apiKey: process.env.TIPRANKS_API_KEY || "",
    },
    marketBeat: {
      baseUrl: process.env.MARKETBEAT_BASE_URL || "https://www.marketbeat.com",
    },
  },

  // Rate Limits (requests per minute)
  rateLimits: {
    secEdgar: parseInt(process.env.RATE_LIMIT_SEC_EDGAR || "10", 10),
    yahooFinance: parseInt(process.env.RATE_LIMIT_YAHOO_FINANCE || "60", 10),
    finviz: parseInt(process.env.RATE_LIMIT_FINVIZ || "30", 10),
    federalReserve: parseInt(process.env.RATE_LIMIT_FEDERAL_RESERVE || "120", 10),
    cnbc: parseInt(process.env.RATE_LIMIT_CNBC || "60", 10),
    bloomberg: parseInt(process.env.RATE_LIMIT_BLOOMBERG || "30", 10),
    morningstar: parseInt(process.env.RATE_LIMIT_MORNINGSTAR || "30", 10),
    reuters: parseInt(process.env.RATE_LIMIT_REUTERS || "60", 10),
    simplyWallSt: parseInt(process.env.RATE_LIMIT_SIMPLY_WALL_ST || "30", 10),
    tradingView: parseInt(process.env.RATE_LIMIT_TRADINGVIEW || "30", 10),
    tipRanks: parseInt(process.env.RATE_LIMIT_TIPRANKS || "30", 10),
    marketBeat: parseInt(process.env.RATE_LIMIT_MARKETBEAT || "30", 10),
  },

  // Cache Configuration (in seconds)
  cache: {
    macroData: parseInt(process.env.CACHE_MACRO_DATA || "3600", 10),
    sectorData: parseInt(process.env.CACHE_SECTOR_DATA || "86400", 10),
    quotes: parseInt(process.env.CACHE_QUOTES || "900", 10),
    companyProfiles: parseInt(process.env.CACHE_COMPANY_PROFILES || "604800", 10),
    financialFilings: parseInt(process.env.CACHE_FINANCIAL_FILINGS || "86400", 10),
    analystRatings: parseInt(process.env.CACHE_ANALYST_RATINGS || "86400", 10),
    valuationData: parseInt(process.env.CACHE_VALUATION_DATA || "86400", 10),
  },

  // Request Configuration
  request: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.REQUEST_RETRY_ATTEMPTS || "3", 10),
    retryDelay: parseInt(process.env.REQUEST_RETRY_DELAY || "1000", 10),
  },
} as const;

/**
 * Validate required environment variables
 * Throws an error if critical configuration is missing
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.database.url) {
    errors.push("DATABASE_URL is required");
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }
}

/**
 * Check if optional API keys are configured
 */
export function getConfigStatus() {
  return {
    database: !!config.database.url,
    federalReserveApiKey: !!config.dataSources.federalReserve.apiKey,
    morningstarApiKey: !!config.dataSources.morningstar.apiKey,
    simplyWallStApiKey: !!config.dataSources.simplyWallSt.apiKey,
    tipRanksApiKey: !!config.dataSources.tipRanks.apiKey,
  };
}
