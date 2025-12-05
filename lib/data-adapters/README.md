# Data Source Adapters

This directory contains adapters for all external data sources used by the Resurrection Stock Picker application. Each adapter provides a consistent interface for fetching financial data while handling provider-specific API details, rate limiting, caching, and error handling.

## Table of Contents

- [Overview](#overview)
- [API Adapters](#api-adapters)
  - [Alpha Vantage](#alpha-vantage-adapter)
  - [Financial Modeling Prep](#financial-modeling-prep-adapter)
  - [Polygon.io](#polygonio-adapter)
  - [Federal Reserve (FRED)](#federal-reserve-fred-adapter)
- [Web Scraping Adapters](#web-scraping-adapters)
- [Rate Limits and Limitations](#rate-limits-and-limitations)
- [Error Handling](#error-handling)
- [Caching Strategy](#caching-strategy)
- [Fallback Mechanisms](#fallback-mechanisms)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

All API adapters follow these design principles:

- **Consistent Interface**: All adapters implement common methods for data fetching
- **Rate Limiting**: Built-in rate limiters respect provider limits
- **Error Handling**: Standardized error types with retry logic
- **Caching**: Automatic caching to minimize API calls
- **Type Safety**: Full TypeScript typing for all responses
- **Fallback Support**: Automatic fallback to alternative sources on failure

## API Adapters

### Alpha Vantage Adapter

**Purpose**: Primary source for real-time stock quotes and company fundamental data.

**Capabilities:**
- Real-time stock quotes with price, change, change percent, and volume
- Company overview including market cap, PE ratio, dividend yield, beta
- Sector and industry classification
- 52-week high/low data
- Earnings per share (EPS) and book value

**API Endpoints Used:**
- `GLOBAL_QUOTE`: Real-time stock quotes
- `OVERVIEW`: Company fundamentals and metrics

**Rate Limits:**
- Free tier: 5 requests/minute, 500 requests/day
- Premium tier: 75 requests/minute, no daily limit

**Limitations:**
- Free tier has strict rate limits
- Some data may be delayed by 15 minutes on free tier
- Limited historical data depth on free tier

**Setup:**
1. Register at https://www.alphavantage.co/support/#api-key
2. Add `ALPHA_VANTAGE_API_KEY=your_key_here` to `.env` file
3. Adapter automatically loads key on initialization

**Example Usage:**
```typescript
import { AlphaVantageAdapter } from './data-adapters';

// Initialize adapter (loads API key from environment)
const adapter = new AlphaVantageAdapter();

// Check if adapter is properly configured
if (!adapter.isConfigured()) {
  throw new Error('Alpha Vantage API key not configured');
}

// Fetch real-time stock quote
const quote = await adapter.getQuote('AAPL');
console.log(`${quote.symbol}: $${quote.price} (${quote.changePercent}%)`);

// Fetch company overview and fundamentals
const profile = await adapter.getCompanyOverview('AAPL');
console.log(`Market Cap: $${profile.marketCap}`);
console.log(`PE Ratio: ${profile.peRatio}`);
console.log(`Dividend Yield: ${profile.dividendYield}%`);

// Response includes source attribution
console.log(`Data source: ${quote.source}`); // "Alpha Vantage"
```

**Response Types:**
```typescript
interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: string;
}

interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  beta: number | null;
  source: string;
}
```

---

### Financial Modeling Prep Adapter

**Purpose**: Primary source for comprehensive financial statements and valuation metrics.

**Capabilities:**
- Income statements (revenue, net income, EPS, margins)
- Balance sheets (assets, liabilities, equity)
- Cash flow statements (operating, investing, financing)
- Company profiles with detailed business information
- Key financial metrics and valuation ratios
- Multi-period historical data (annual and quarterly)
- Growth rates and financial health indicators

**API Endpoints Used:**
- `/income-statement/{symbol}`: Income statement data
- `/balance-sheet-statement/{symbol}`: Balance sheet data
- `/cash-flow-statement/{symbol}`: Cash flow data
- `/profile/{symbol}`: Company profile and description
- `/key-metrics/{symbol}`: Financial ratios and valuation metrics

**Rate Limits:**
- Free tier: 250 requests/day
- Starter tier: 750 requests/day
- Professional tier: 3,000 requests/day

**Limitations:**
- Daily request limits (not per-minute)
- Free tier limited to 5 years of historical data
- Some advanced metrics require paid tier
- Real-time data requires higher tier plans

**Setup:**
1. Register at https://financialmodelingprep.com/developer/docs/
2. Add `FMP_API_KEY=your_key_here` to `.env` file
3. Adapter automatically loads key on initialization

**Example Usage:**
```typescript
import { FinancialModelingPrepAdapter } from './data-adapters';

// Initialize adapter
const adapter = new FinancialModelingPrepAdapter();

// Fetch annual income statements (last 5 years)
const incomeStatements = await adapter.getIncomeStatement('AAPL', 'annual', 5);
incomeStatements.forEach(stmt => {
  console.log(`${stmt.date}: Revenue $${stmt.revenue}, Net Income $${stmt.netIncome}`);
});

// Fetch quarterly balance sheets (last 4 quarters)
const balanceSheets = await adapter.getBalanceSheet('AAPL', 'quarter', 4);
console.log(`Total Assets: $${balanceSheets[0].totalAssets}`);

// Fetch cash flow statements
const cashFlows = await adapter.getCashFlowStatement('AAPL', 'annual', 3);
console.log(`Operating Cash Flow: $${cashFlows[0].operatingCashFlow}`);

// Fetch company profile
const profile = await adapter.getCompanyProfile('AAPL');
console.log(`${profile.companyName} - ${profile.industry}`);
console.log(`Description: ${profile.description}`);

// Fetch key valuation metrics
const metrics = await adapter.getKeyMetrics('AAPL');
console.log(`P/E Ratio: ${metrics.peRatio}`);
console.log(`Price to Book: ${metrics.priceToBook}`);
console.log(`ROE: ${metrics.roe}%`);
```

**Response Types:**
```typescript
interface IncomeStatement {
  date: string;
  symbol: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  period: 'annual' | 'quarter';
}

interface BalanceSheet {
  date: string;
  symbol: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cashAndEquivalents: number;
  totalDebt: number;
}

interface CashFlowStatement {
  date: string;
  symbol: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  freeCashFlow: number;
}
```

---


### Polygon.io Adapter

**Purpose**: Primary source for real-time quotes and historical price data with high-quality OHLCV bars.

**Capabilities:**
- Real-time stock quotes (bid, ask, last price)
- Previous day's close price
- Historical OHLCV (Open, High, Low, Close, Volume) bars
- Multiple timeframes: daily, weekly, monthly
- Aggregated price data over custom date ranges
- High-precision timestamps for intraday data

**API Endpoints Used:**
- `/v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from}/{to}`: Aggregated bars
- `/v2/last/trade/{symbol}`: Last trade price
- `/v2/aggs/ticker/{symbol}/prev`: Previous close

**Rate Limits:**
- Free tier: 5 requests/minute
- Basic tier: 100 requests/minute
- Advanced tier: 1,000 requests/minute

**Limitations:**
- Free tier has very strict rate limits
- Real-time data requires paid subscription
- Free tier may have delayed data (15 minutes)
- Historical data depth varies by tier

**Setup:**
1. Register at https://polygon.io/
2. Add `POLYGON_API_KEY=your_key_here` to `.env` file
3. Adapter automatically loads key and configures rate limiter

**Example Usage:**
```typescript
import { PolygonAdapter } from './data-adapters';

// Initialize adapter
const adapter = new PolygonAdapter();

// Fetch current quote
const quote = await adapter.getCurrentQuote('AAPL');
console.log(`Current Price: $${quote.price}`);
console.log(`Volume: ${quote.volume}`);

// Fetch previous day's close
const prevClose = await adapter.getPreviousClose('AAPL');
console.log(`Previous Close: $${prevClose.close}`);

// Fetch daily prices for last 30 days
const dailyPrices = await adapter.getDailyPrices('AAPL', 30);
dailyPrices.forEach(bar => {
  console.log(`${bar.date}: O:${bar.open} H:${bar.high} L:${bar.low} C:${bar.close} V:${bar.volume}`);
});

// Fetch aggregated bars with custom date range
const fromDate = new Date('2024-01-01');
const toDate = new Date('2024-12-31');
const aggregates = await adapter.getAggregates('AAPL', 'day', fromDate, toDate);
console.log(`Fetched ${aggregates.length} daily bars`);

// Calculate simple moving average
const prices = dailyPrices.map(bar => bar.close);
const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
console.log(`30-day SMA: $${sma.toFixed(2)}`);
```

**Response Types:**
```typescript
interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: string;
}

interface OHLCVBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
}
```

---

### Federal Reserve (FRED) Adapter

**Purpose**: Primary source for macroeconomic indicators and Federal Reserve data.

**Capabilities:**
- Federal funds interest rate
- GDP (Gross Domestic Product) data
- Unemployment rate
- Inflation rate (CPI)
- Treasury yields (10-year, 2-year)
- Custom economic time series by series ID
- Batch fetching of multiple series
- Historical economic data with flexible date ranges

**API Endpoints Used:**
- `/series/observations`: Time series data for economic indicators
- `/series`: Series metadata and information

**Common Series IDs:**
- `FEDFUNDS`: Federal Funds Rate
- `GDP`: Gross Domestic Product
- `UNRATE`: Unemployment Rate
- `CPIAUCSL`: Consumer Price Index (Inflation)
- `DGS10`: 10-Year Treasury Constant Maturity Rate
- `DGS2`: 2-Year Treasury Constant Maturity Rate

**Rate Limits:**
- All tiers: 120 requests/minute
- No daily limit

**Limitations:**
- Data frequency varies by series (daily, monthly, quarterly)
- Some series have reporting delays
- Historical data availability varies by series
- No real-time intraday data

**Setup:**
1. Register at https://fred.stlouisfed.org/docs/api/api_key.html
2. Add `FRED_API_KEY=your_key_here` to `.env` file
3. Adapter automatically loads key on initialization

**Example Usage:**
```typescript
import { FederalReserveAdapter } from './data-adapters';

// Initialize adapter
const adapter = new FederalReserveAdapter();

// Fetch current interest rate
const interestRate = await adapter.fetchInterestRate();
console.log(`Federal Funds Rate: ${interestRate}%`);

// Fetch GDP data
const gdpData = await adapter.fetchGDP();
console.log(`Current GDP: $${gdpData} trillion`);

// Fetch unemployment rate
const unemployment = await adapter.fetchUnemploymentRate();
console.log(`Unemployment Rate: ${unemployment}%`);

// Fetch inflation rate
const inflation = await adapter.fetchInflationRate();
console.log(`Inflation Rate: ${inflation}%`);

// Fetch custom series with date range
const startDate = new Date('2020-01-01');
const endDate = new Date('2024-12-31');
const series = await adapter.getSeries('DGS10', startDate, endDate);
series.forEach(point => {
  console.log(`${point.date}: ${point.value}%`);
});

// Fetch multiple series at once
const seriesIds = ['FEDFUNDS', 'UNRATE', 'CPIAUCSL'];
const multipleSeries = await adapter.getMultipleSeries(seriesIds);
multipleSeries.forEach(series => {
  console.log(`${series.seriesId}: ${series.latestValue}`);
});

// Get latest value for a series
const latestGDP = await adapter.getLatestValue('GDP');
console.log(`Latest GDP: $${latestGDP} trillion`);
```

**Response Types:**
```typescript
interface EconomicIndicator {
  seriesId: string;
  date: Date;
  value: number;
  source: string;
}

interface SeriesData {
  seriesId: string;
  observations: Array<{
    date: Date;
    value: number;
  }>;
  latestValue: number;
  latestDate: Date;
}
```

---

## Web Scraping Adapters

| Adapter | Description |
|---------|-------------|
| SECEdgarAdapter | SEC EDGAR filings |
| YahooFinanceAdapter | Yahoo Finance data |
| FinvizAdapter | Finviz stock screener |
| TipRanksAdapter | TipRanks analyst ratings |
| MarketBeatAdapter | MarketBeat ratings |

---

## Rate Limits and Limitations

### Rate Limit Summary

| Provider | Free Tier | Paid Tier | Daily Limit |
|----------|-----------|-----------|-------------|
| Alpha Vantage | 5/min | 75/min | 500/day (free) |
| FMP | N/A | N/A | 250/day (free), 750-3000/day (paid) |
| Polygon.io | 5/min | 100-1,000/min | No daily limit |
| FRED | 120/min | 120/min | No daily limit |

### Rate Limiting Implementation

All adapters implement automatic rate limiting using a token bucket algorithm:

- **Request Queueing**: Requests exceeding rate limits are automatically queued
- **Exponential Backoff**: Failed requests retry with increasing delays (1s, 2s, 4s)
- **Rate Limit Headers**: Adapters respect `X-RateLimit-*` headers when available
- **Graceful Degradation**: Falls back to alternative sources when rate limited

### Data Limitations by Provider

**Alpha Vantage:**
- Free tier: 15-minute delayed data for some endpoints
- Limited to 500 API calls per day on free tier
- Historical data limited to 20 years
- Intraday data limited to last 1-2 months

**Financial Modeling Prep:**
- Free tier: 5 years of historical financial data
- Daily request limits (not per-minute)
- Some metrics require paid subscription
- Real-time data requires higher tier

**Polygon.io:**
- Free tier: 15-minute delayed data
- Limited historical data depth on free tier
- Intraday data requires paid subscription
- Options and forex data require higher tiers

**FRED:**
- No tier restrictions (all data is free)
- Data frequency varies by series
- Some series have reporting delays
- No real-time intraday economic data

---

## Error Handling

All adapters use consistent error types from `lib/api-error.ts` for standardized error handling across the application.

### Error Types

| Error Type | Description | Retryable | Retry Strategy |
|------------|-------------|-----------|----------------|
| ConfigurationError | Missing or invalid API key | No | Throw immediately |
| RateLimitError | Rate limit exceeded | Yes | Wait for reset, then retry |
| NetworkError | Connection failures, timeouts | Yes | Exponential backoff (1s, 2s, 4s) |
| ValidationError | Invalid API responses | No | Throw immediately |
| NotFoundError | Symbol or data not found | No | Throw immediately |

### Retry Behavior

**Network Errors:**
- Automatically retry up to 3 times
- Exponential backoff: 1 second, 2 seconds, 4 seconds
- Total maximum retry time: ~7 seconds

**Rate Limit Errors:**
- Wait for rate limit window to reset
- Retry once after waiting
- If still rate limited, throw error

**Non-Retryable Errors:**
- Configuration errors (missing API keys)
- Validation errors (malformed responses)
- Not found errors (invalid symbols)

### Error Handling Example

```typescript
import { AlphaVantageAdapter } from './data-adapters';
import { APIError, ConfigurationError, RateLimitError, NetworkError } from '../api-error';

const adapter = new AlphaVantageAdapter();

try {
  const quote = await adapter.getQuote('AAPL');
  console.log(`Price: $${quote.price}`);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('API key not configured. Please set ALPHA_VANTAGE_API_KEY in .env');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded. Please wait before making more requests.');
  } else if (error instanceof NetworkError) {
    console.error('Network error. Please check your connection and try again.');
  } else if (error instanceof APIError) {
    console.error(`API Error: ${error.message} (${error.code})`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Logging

All errors are automatically logged with:
- Timestamp
- Provider name
- Request details (endpoint, parameters)
- Error type and message
- Stack trace (for debugging)

Logs are written to the console and can be configured to write to external logging services.

---

## Caching Strategy

All adapters integrate with the application's caching layer to minimize API calls and improve performance.

### Cache Duration by Data Type

| Data Type | Cache Duration | Rationale |
|-----------|----------------|-----------|
| Stock Quotes | 15 minutes | Balance freshness with API limits |
| Company Profiles | 7 days | Fundamental data changes infrequently |
| Financial Statements | 24 hours | Updated quarterly, daily cache sufficient |
| Economic Indicators | 1 hour | FRED data updates daily/monthly |
| Historical Prices | 24 hours | Historical data doesn't change |

### Cache Behavior

**Cache Hit:**
- Data returned immediately without API call
- Source attribution includes "(cached)" suffix
- No rate limit consumption

**Cache Miss:**
- API request made to fetch fresh data
- Response cached with appropriate TTL
- Subsequent requests use cached data

**Cache Invalidation:**
- Automatic expiration based on TTL
- Manual invalidation via cache management tools
- Failed requests don't update cache

### Example with Caching

```typescript
import { AlphaVantageAdapter } from './data-adapters';

const adapter = new AlphaVantageAdapter();

// First call: fetches from API and caches
const quote1 = await adapter.getQuote('AAPL');
console.log(quote1.source); // "Alpha Vantage"

// Second call within 15 minutes: returns cached data
const quote2 = await adapter.getQuote('AAPL');
console.log(quote2.source); // "Alpha Vantage (cached)"

// No API call made, no rate limit consumed
```

---

## Fallback Mechanisms

The application implements automatic fallback to alternative data sources when primary sources fail.

### Fallback Chains

**Stock Quotes:**
1. Alpha Vantage (primary)
2. Polygon.io (secondary)
3. Yahoo Finance scraper (fallback)

**Financial Statements:**
1. Financial Modeling Prep (primary)
2. SEC EDGAR scraper (fallback)

**Historical Prices:**
1. Polygon.io (primary)
2. Alpha Vantage (secondary)
3. Yahoo Finance scraper (fallback)

**Economic Data:**
1. FRED API (primary)
2. No fallback (FRED is authoritative source)

### Fallback Behavior

**Automatic Fallback:**
- Triggered after all retry attempts exhausted
- Logs fallback activation for monitoring
- Returns data from first successful source

**Fallback Priority:**
- API sources prioritized over web scraping
- Paid APIs prioritized over free APIs
- More reliable sources prioritized

**Example:**
```typescript
// If Alpha Vantage fails, automatically tries Polygon.io
const quote = await adapter.getQuote('AAPL');
console.log(quote.source); // May be "Polygon.io" if Alpha Vantage failed
```

---

## Testing

### Unit Tests

Run unit tests for individual adapters:

```bash
# Test all adapters
npm test -- lib/data-adapters/__tests__

# Test specific adapter
npm test -- lib/data-adapters/__tests__/alpha-vantage-adapter.test.ts
npm test -- lib/data-adapters/__tests__/fmp-adapter.test.ts
npm test -- lib/data-adapters/__tests__/polygon-adapter.test.ts
npm test -- lib/data-adapters/__tests__/federal-reserve-adapter.test.ts
```

### Integration Tests

Integration tests require valid API keys in `.env` file:

```bash
# Test Alpha Vantage integration
npm test -- lib/data-adapters/__tests__/alpha-vantage-adapter.integration.test.ts

# Test FMP integration
npm test -- lib/data-adapters/__tests__/fmp-adapter.integration.test.ts

# Test Polygon integration
npm test -- lib/data-adapters/__tests__/polygon-adapter.integration.test.ts

# Test FRED integration
npm test -- lib/data-adapters/__tests__/federal-reserve-adapter.integration.test.ts

# Test error handling
npm test -- lib/data-adapters/__tests__/error-handling.integration.test.ts
```

### Property-Based Tests

Property-based tests verify universal properties across all adapters:

```bash
# Test cache integration
npm test -- lib/data-adapters/__tests__/cache-integration.property.test.ts

# Test data source attribution
npm test -- lib/data-adapters/__tests__/data-source-attribution.property.test.ts

# Test fallback activation
npm test -- lib/data-adapters/__tests__/fallback-activation.property.test.ts

# Test response validation
npm test -- lib/data-adapters/__tests__/response-validation.property.test.ts
```

### Manual Testing

Test adapters manually using Node.js REPL:

```bash
node
```

```javascript
const { AlphaVantageAdapter } = require('./lib/data-adapters');

const adapter = new AlphaVantageAdapter();
adapter.getQuote('AAPL').then(console.log);
```

---

## Troubleshooting

### Common Issues and Solutions

#### "API key is required" or ConfigurationError

**Problem:** Adapter throws configuration error on initialization.

**Solutions:**
1. Verify API key is set in `.env` file:
   ```bash
   # Check if .env file exists
   cat .env | grep API_KEY
   ```

2. Ensure correct environment variable name:
   - Alpha Vantage: `ALPHA_VANTAGE_API_KEY`
   - FMP: `FMP_API_KEY`
   - Polygon: `POLYGON_API_KEY`
   - FRED: `FRED_API_KEY`

3. Restart the application after adding API keys

4. Verify API key is valid by testing in browser:
   ```
   https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY
   ```

#### Rate Limit Errors (RateLimitError)

**Problem:** "Rate limit exceeded" errors when making requests.

**Solutions:**
1. Wait for rate limit window to reset (typically 1 minute)

2. Enable caching to reduce API calls:
   ```typescript
   // Caching is enabled by default
   // Check cache configuration in lib/cache-config.ts
   ```

3. Upgrade to paid tier for higher rate limits

4. Implement request batching for multiple symbols:
   ```typescript
   // Instead of multiple individual requests
   const quotes = await Promise.all([
     adapter.getQuote('AAPL'),
     adapter.getQuote('GOOGL'),
     adapter.getQuote('MSFT')
   ]);
   ```

5. Use fallback sources when primary source is rate limited

#### "No data found" or NotFoundError

**Problem:** Symbol not found or no data returned.

**Solutions:**
1. Verify stock symbol is correct (use uppercase):
   ```typescript
   // Correct
   await adapter.getQuote('AAPL');
   
   // Incorrect
   await adapter.getQuote('aapl'); // May fail on some APIs
   ```

2. Check if symbol is supported by the API:
   - Some APIs don't support OTC stocks
   - International symbols may require different format
   - Delisted stocks may not be available

3. Try alternative adapter:
   ```typescript
   // If Alpha Vantage fails, try Polygon
   const polygonAdapter = new PolygonAdapter();
   const quote = await polygonAdapter.getCurrentQuote('AAPL');
   ```

#### Network Errors or Timeouts

**Problem:** Connection failures or timeout errors.

**Solutions:**
1. Check internet connection

2. Verify API provider is not experiencing outages:
   - Alpha Vantage: https://www.alphavantage.co/
   - FMP: https://financialmodelingprep.com/
   - Polygon: https://polygon.io/
   - FRED: https://fred.stlouisfed.org/

3. Increase timeout in adapter configuration (if needed)

4. Check firewall or proxy settings

5. Retry the request (automatic retry is built-in)

#### Invalid Response or ValidationError

**Problem:** API returns unexpected or malformed data.

**Solutions:**
1. Check API provider status page for known issues

2. Verify API key has correct permissions

3. Update to latest version of adapter code

4. Report issue with example request/response

#### Stale or Incorrect Data

**Problem:** Data appears outdated or incorrect.

**Solutions:**
1. Clear cache to force fresh data fetch:
   ```typescript
   // Clear cache for specific symbol
   await cache.delete(`quote:AAPL`);
   ```

2. Check data timestamp in response:
   ```typescript
   const quote = await adapter.getQuote('AAPL');
   console.log('Data timestamp:', quote.timestamp);
   ```

3. Verify you're not on free tier with delayed data

4. Compare with multiple sources to verify accuracy

#### Integration Test Failures

**Problem:** Integration tests fail in CI/CD or local environment.

**Solutions:**
1. Ensure API keys are set in test environment:
   ```bash
   # For CI/CD, set as secrets
   # For local, ensure .env file exists
   ```

2. Skip integration tests if API keys not available:
   ```bash
   # Run only unit tests
   npm test -- --testPathIgnorePatterns=integration
   ```

3. Check rate limits haven't been exceeded during test runs

4. Use test API keys if provider offers them

### Debugging Tips

**Enable Debug Logging:**
```typescript
// Set environment variable for verbose logging
process.env.DEBUG = 'adapters:*';
```

**Check Adapter Configuration:**
```typescript
const adapter = new AlphaVantageAdapter();
console.log('Configured:', adapter.isConfigured());
console.log('Rate limit:', adapter.getRateLimit());
```

**Monitor API Usage:**
```typescript
// Check remaining API calls (if supported by provider)
const usage = await adapter.getUsageStats();
console.log('Remaining calls:', usage.remaining);
```

**Test with curl:**
```bash
# Test Alpha Vantage directly
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY"

# Test FMP directly
curl "https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=YOUR_KEY"

# Test Polygon directly
curl "https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apikey=YOUR_KEY"

# Test FRED directly
curl "https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=YOUR_KEY&file_type=json"
```

### Getting Help

**Documentation:**
- Alpha Vantage: https://www.alphavantage.co/documentation/
- FMP: https://financialmodelingprep.com/developer/docs/
- Polygon: https://polygon.io/docs/
- FRED: https://fred.stlouisfed.org/docs/api/

**Support:**
- Check provider support pages for API issues
- Review application logs for detailed error messages
- Open GitHub issue with reproduction steps

**Best Practices:**
- Always check `isConfigured()` before making requests
- Implement proper error handling in production code
- Monitor API usage to avoid rate limits
- Use caching to minimize API calls
- Test with multiple symbols to verify functionality
