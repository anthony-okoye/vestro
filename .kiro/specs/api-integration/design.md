# Design Document

## Overview

This design outlines the implementation of four financial data API integrations (Alpha Vantage, Financial Modeling Prep, Polygon.io, and FRED) into the Resurrection Stock Picker application. The design follows the existing adapter pattern, implements consistent error handling and rate limiting, and integrates seamlessly with existing workflow processors.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Processors                       │
│  (market-conditions, fundamental-analysis, technical-trends) │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Adapter Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Alpha Vantage│  │     FMP      │  │   Polygon    │      │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │    FRED      │  │   Fallback   │                        │
│  │   Adapter    │  │   Strategy   │                        │
│  └──────────────┘  └──────────────┘                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              External API Providers                          │
│  Alpha Vantage │ FMP │ Polygon.io │ FRED                    │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Adapter Pattern**: Each API is wrapped in an adapter that implements a consistent interface
2. **Rate Limiting**: All adapters respect provider rate limits using configurable limiters
3. **Error Handling**: Consistent error handling with retries, exponential backoff, and fallbacks
4. **Caching**: Leverage existing cache infrastructure to minimize API calls
5. **Type Safety**: Full TypeScript typing for all API responses and adapter methods

## Components and Interfaces

### Base Adapter Interface

```typescript
interface DataAdapter {
  name: string;
  isConfigured(): boolean;
  getQuote(symbol: string): Promise<StockQuote>;
  getCompanyProfile(symbol: string): Promise<CompanyProfile>;
}
```

### Alpha Vantage Adapter

**Purpose**: Fetch stock quotes and company fundamentals

**Key Methods**:
- `getQuote(symbol: string)`: Fetch current stock quote
- `getCompanyOverview(symbol: string)`: Fetch company fundamentals
- `getGlobalQuote(symbol: string)`: Fetch real-time quote data

**API Endpoints Used**:
- `GLOBAL_QUOTE`: Real-time stock quotes
- `OVERVIEW`: Company fundamentals and metrics

**Rate Limiting**: 5 requests per minute (free tier), 75 per minute (premium)

### Financial Modeling Prep Adapter

**Purpose**: Fetch financial statements and comprehensive company data

**Key Methods**:
- `getIncomeStatement(symbol: string, period: 'annual' | 'quarter')`: Fetch income statements
- `getBalanceSheet(symbol: string, period: 'annual' | 'quarter')`: Fetch balance sheets
- `getCashFlowStatement(symbol: string, period: 'annual' | 'quarter')`: Fetch cash flows
- `getCompanyProfile(symbol: string)`: Fetch company profile and metrics
- `getKeyMetrics(symbol: string)`: Fetch valuation and financial ratios

**API Endpoints Used**:
- `/income-statement/{symbol}`: Income statement data
- `/balance-sheet-statement/{symbol}`: Balance sheet data
- `/cash-flow-statement/{symbol}`: Cash flow data
- `/profile/{symbol}`: Company profile
- `/key-metrics/{symbol}`: Financial ratios and metrics

**Rate Limiting**: 250 requests per day (free tier), 750 per day (starter)

### Polygon.io Adapter

**Purpose**: Fetch real-time and historical price data

**Key Methods**:
- `getCurrentQuote(symbol: string)`: Fetch current bid/ask/last
- `getAggregates(symbol: string, timespan: string, from: Date, to: Date)`: Fetch OHLCV bars
- `getDailyPrices(symbol: string, days: number)`: Fetch daily historical prices
- `getPreviousClose(symbol: string)`: Fetch previous day's close

**API Endpoints Used**:
- `/v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from}/{to}`: Aggregated bars
- `/v2/last/trade/{symbol}`: Last trade
- `/v2/aggs/ticker/{symbol}/prev`: Previous close

**Rate Limiting**: 5 requests per minute (free tier), unlimited (paid)

### FRED Adapter (Updated)

**Purpose**: Fetch macroeconomic indicators

**Key Methods**:
- `getSeries(seriesId: string, startDate?: Date, endDate?: Date)`: Fetch time series data
- `getMultipleSeries(seriesIds: string[])`: Batch fetch multiple series
- `getLatestValue(seriesId: string)`: Fetch most recent value

**API Endpoints Used**:
- `/series/observations`: Time series data
- `/series`: Series metadata

**Rate Limiting**: 120 requests per minute

## Data Models

### StockQuote

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
```

### CompanyProfile

```typescript
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

### FinancialStatement

```typescript
interface FinancialStatement {
  symbol: string;
  date: Date;
  period: 'annual' | 'quarter';
  revenue: number;
  netIncome: number;
  eps: number;
  assets: number;
  liabilities: number;
  equity: number;
  operatingCashFlow: number;
  source: string;
}
```

### EconomicIndicator

```typescript
interface EconomicIndicator {
  seriesId: string;
  date: Date;
  value: number;
  source: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Key Validation

*For any* adapter initialization, if the required API key is missing or empty, the adapter should throw a configuration error before making any API requests.

**Validates: Requirements 1.5, 2.1, 3.1, 4.4**

### Property 2: Rate Limit Compliance

*For any* sequence of API requests to a single provider, the adapter should never exceed the configured rate limit within the specified time window.

**Validates: Requirements 1.4, 3.5**

### Property 3: Retry with Exponential Backoff

*For any* failed API request due to network errors, the adapter should retry up to 3 times with exponentially increasing delays (1s, 2s, 4s).

**Validates: Requirements 2.6, 5.2**

### Property 4: Error Logging

*For any* API request failure, the adapter should log the error with request details including endpoint, parameters, and error message.

**Validates: Requirements 5.1**

### Property 5: Response Validation

*For any* successful API response, the adapter should validate that required fields are present and of the correct type before returning data.

**Validates: Requirements 5.4**

### Property 6: Fallback Activation

*For any* primary data source failure after all retries, if a fallback source is configured, the system should attempt to fetch from the fallback source.

**Validates: Requirements 5.5, 6.5**

### Property 7: Cache Integration

*For any* data fetch request, if valid cached data exists and is not expired, the adapter should return cached data without making an API call.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 8: Data Source Attribution

*For any* data returned by an adapter, the response should include a source field identifying which API provider supplied the data.

**Validates: Requirements 1.2, 1.3, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 4.2**

## Error Handling

### Error Types

1. **ConfigurationError**: Missing or invalid API keys
2. **RateLimitError**: Rate limit exceeded
3. **NetworkError**: Connection failures, timeouts
4. **ValidationError**: Invalid API responses
5. **NotFoundError**: Symbol or data not found

### Error Handling Strategy

```typescript
class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public retryable: boolean
  ) {
    super(message);
  }
}
```

### Retry Logic

- Network errors: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Rate limit errors: Wait for rate limit reset, then retry once
- Validation errors: No retry, throw immediately
- Configuration errors: No retry, throw immediately

### Fallback Chain

1. Primary API (e.g., Alpha Vantage)
2. Secondary API (e.g., FMP)
3. Cached data (if available and not too stale)
4. Web scraping adapter (last resort)

## Testing Strategy

### Unit Tests

- Test each adapter method with mocked API responses
- Test error handling for various failure scenarios
- Test rate limiting logic
- Test retry and exponential backoff behavior
- Test API key validation

### Integration Tests

- Test actual API calls with real API keys (in CI/CD with secrets)
- Test end-to-end data fetching for each adapter
- Test fallback strategies with simulated failures
- Test cache integration

### Property-Based Tests

Property-based tests will use the `fast-check` library for TypeScript. Each test should run a minimum of 100 iterations. Each property-based test must include a comment tag in the format: `**Feature: api-integration, Property {number}: {property_text}**`

**Test Framework**: fast-check (TypeScript property-based testing library)

**Key Test Scenarios**:
- Generate random symbols and verify adapters handle them gracefully
- Generate random date ranges and verify historical data fetching
- Simulate various API error responses and verify error handling
- Test rate limiting with rapid request sequences

### End-to-End Tests

- Run complete workflow with API data sources
- Verify data flows correctly through processors
- Test user-facing features with API-backed data

## Integration Points

### Workflow Processors

**market-conditions-processor.ts**:
- Replace FRED scraping with FRED API adapter
- Fetch GDP, unemployment, inflation data via API

**fundamental-analysis-processor.ts**:
- Use FMP adapter for financial statements
- Use Alpha Vantage for company overview

**technical-trends-processor.ts**:
- Use Polygon adapter for historical price data
- Use Alpha Vantage as fallback

**valuation-evaluation-processor.ts**:
- Use FMP adapter for valuation metrics
- Use Alpha Vantage for PE ratio, dividend yield

### Configuration Updates

**lib/config.ts**:
- Add API key configuration loading
- Add rate limit configuration
- Add adapter priority configuration

**.env.example**:
- Document all required API keys
- Include registration links for each provider

## Performance Considerations

### Caching Strategy

- Stock quotes: Cache for 15 minutes (900 seconds)
- Company profiles: Cache for 7 days (604800 seconds)
- Financial statements: Cache for 24 hours (86400 seconds)
- Economic indicators: Cache for 1 hour (3600 seconds)

### Rate Limiting

- Implement token bucket algorithm for rate limiting
- Queue requests when rate limit is reached
- Prioritize critical requests over background fetches

### Batch Operations

- Batch multiple symbol requests where API supports it
- Use Promise.all for parallel requests within rate limits
- Implement request deduplication for concurrent identical requests

## Security Considerations

- Store API keys in environment variables, never in code
- Validate and sanitize all user inputs before API calls
- Implement request signing where required by provider
- Log API usage for monitoring and debugging (without exposing keys)
- Rotate API keys periodically in production

## Documentation Requirements

- JSDoc comments for all public methods
- README for each adapter explaining capabilities and limitations
- API provider documentation links
- Rate limit documentation
- Example usage for each adapter
- Troubleshooting guide for common errors
