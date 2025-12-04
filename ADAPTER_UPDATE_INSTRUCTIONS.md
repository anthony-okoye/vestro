# Adapter Update Instructions

This document provides the exact code changes needed to fix the failing adapters.

---

## 🎯 Critical Updates (Fix Current Errors)

### 1. Update Morningstar Adapter to Use FMP

**File**: `lib/data-adapters/morningstar-adapter.ts`

**Current Issue**: Morningstar API returns 404 (no access)

**Solution**: Replace with Financial Modeling Prep API

**Code Changes Needed**:

```typescript
// At the top of the file, update the base URL
private baseUrl = 'https://financialmodelingprep.com/api/v3';
private apiKey = process.env.FMP_API_KEY;

// Update fetchFinancialSnapshot method
async fetchFinancialSnapshot(ticker: string): Promise<any> {
  try {
    // Fetch company profile
    const profileUrl = `${this.baseUrl}/profile/${ticker}?apikey=${this.apiKey}`;
    const profileResponse = await this.fetchWithRetry(profileUrl);
    const profile = profileResponse[0]; // FMP returns array

    // Fetch key metrics
    const metricsUrl = `${this.baseUrl}/key-metrics/${ticker}?limit=1&apikey=${this.apiKey}`;
    const metricsResponse = await this.fetchWithRetry(metricsUrl);
    const metrics = metricsResponse[0];

    // Fetch financial ratios
    const ratiosUrl = `${this.baseUrl}/ratios/${ticker}?limit=1&apikey=${this.apiKey}`;
    const ratiosResponse = await this.fetchWithRetry(ratiosUrl);
    const ratios = ratiosResponse[0];

    // Transform to expected format
    return {
      ticker: profile.symbol,
      revenueGrowth5y: metrics?.revenueGrowth || 0,
      earningsGrowth5y: metrics?.netIncomeGrowth || 0,
      profitMargin: ratios?.netProfitMargin || 0,
      debtToEquity: ratios?.debtEquityRatio || 0,
      freeCashFlow: metrics?.freeCashFlow || 0,
      price: profile.price,
      marketCap: profile.mktCap,
    };
  } catch (error) {
    throw new Error(`Failed to fetch financial snapshot for ${ticker}: ${error.message}`);
  }
}
```

---

### 2. Update SEC EDGAR Adapter to Add User-Agent

**File**: `lib/data-adapters/sec-edgar-adapter.ts`

**Current Issue**: Missing required User-Agent header

**Solution**: Add User-Agent header to all requests

**Code Changes Needed**:

```typescript
// Update the fetch method to include User-Agent
private async fetchWithRetry(url: string, options: RequestInit = {}): Promise<any> {
  const userAgent = process.env.SEC_EDGAR_USER_AGENT || 'ResurrectionStockPicker contact@example.com';
  
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'application/json',
    ...options.headers,
  };

  // Rest of retry logic...
  return fetch(url, { ...options, headers });
}
```

---

### 3. Verify FRED Adapter Uses API Key

**File**: `lib/data-adapters/federal-reserve-adapter.ts`

**Current Issue**: May not be using API key correctly

**Solution**: Ensure API key is in all requests

**Code Changes Needed**:

```typescript
// Verify the fetch method includes API key
async fetchSeries(seriesId: string): Promise<any> {
  const apiKey = process.env.FEDERAL_RESERVE_API_KEY;
  
  if (!apiKey) {
    throw new Error('FEDERAL_RESERVE_API_KEY is not configured');
  }

  const url = `${this.baseUrl}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;
  
  return this.fetchWithRetry(url);
}
```

---

## 🔄 Optional Updates (Improve Reliability)

### 4. Replace Finviz with FMP Stock Screener

**File**: `lib/data-adapters/finviz-adapter.ts`

**FMP Stock Screener Endpoint**:
```typescript
async screenStocks(filters: ScreeningFilters): Promise<StockScreenResult[]> {
  const params = new URLSearchParams();
  params.append('apikey', process.env.FMP_API_KEY!);
  
  if (filters.marketCap === 'large') {
    params.append('marketCapMoreThan', '10000000000');
  } else if (filters.marketCap === 'mid') {
    params.append('marketCapMoreThan', '2000000000');
    params.append('marketCapLowerThan', '10000000000');
  } else if (filters.marketCap === 'small') {
    params.append('marketCapLowerThan', '2000000000');
  }
  
  if (filters.dividendYieldMin) {
    params.append('dividendMoreThan', (filters.dividendYieldMin / 100).toString());
  }
  
  if (filters.sector) {
    params.append('sector', filters.sector);
  }
  
  params.append('limit', '100');
  
  const url = `https://financialmodelingprep.com/api/v3/stock-screener?${params.toString()}`;
  const response = await this.fetchWithRetry(url);
  
  return response.map((stock: any) => ({
    ticker: stock.symbol,
    companyName: stock.companyName,
    sector: stock.sector,
    marketCap: stock.marketCap,
    price: stock.price,
    dividendYield: stock.lastAnnualDividend / stock.price * 100,
    peRatio: stock.price / stock.eps,
  }));
}
```

---

### 5. Replace TipRanks/MarketBeat with FMP Analyst Data

**Files**: 
- `lib/data-adapters/tipranks-adapter.ts`
- `lib/data-adapters/marketbeat-adapter.ts`

**FMP Analyst Endpoints**:
```typescript
// Get analyst estimates
async fetchAnalystRatings(ticker: string): Promise<any[]> {
  const apiKey = process.env.FMP_API_KEY;
  
  // Fetch price targets
  const targetUrl = `https://financialmodelingprep.com/api/v3/price-target/${ticker}?apikey=${apiKey}`;
  const targets = await this.fetchWithRetry(targetUrl);
  
  // Fetch analyst estimates
  const estimatesUrl = `https://financialmodelingprep.com/api/v3/analyst-estimates/${ticker}?apikey=${apiKey}`;
  const estimates = await this.fetchWithRetry(estimatesUrl);
  
  // Transform to expected format
  return targets.map((target: any) => ({
    analyst: target.analystName,
    rating: target.adjPriceTarget > target.priceWhenPosted ? 'Buy' : 'Hold',
    priceTarget: target.adjPriceTarget,
    date: target.publishedDate,
  }));
}
```

---

### 6. Replace Simply Wall St with FMP Ratios

**File**: `lib/data-adapters/simplywallst-adapter.ts`

**FMP Ratios Endpoint**:
```typescript
async fetchValuationData(ticker: string): Promise<any> {
  const apiKey = process.env.FMP_API_KEY;
  
  // Fetch financial ratios
  const url = `https://financialmodelingprep.com/api/v3/ratios/${ticker}?limit=1&apikey=${apiKey}`;
  const response = await this.fetchWithRetry(url);
  const ratios = response[0];
  
  return {
    ticker,
    peRatio: ratios.priceEarningsRatio,
    pbRatio: ratios.priceToBookRatio,
    debtToEquity: ratios.debtEquityRatio,
    currentRatio: ratios.currentRatio,
    returnOnEquity: ratios.returnOnEquity,
  };
}
```

---

## 📦 Required npm Packages

You may need to install these packages:

```bash
npm install axios
```

All the APIs use standard HTTP requests, so `axios` or native `fetch` will work.

---

## 🧪 Testing Your Updates

After updating each adapter, test it individually:

```typescript
// Create a test file: lib/data-adapters/__tests__/adapter-test.ts
import { MorningstarAdapter } from '../morningstar-adapter';

async function testAdapter() {
  const adapter = new MorningstarAdapter();
  const data = await adapter.fetchFinancialSnapshot('AAPL');
  console.log('Data:', data);
}

testAdapter();
```

Run with:
```bash
npx tsx lib/data-adapters/__tests__/adapter-test.ts
```

---

## ⚠️ Important Notes

### Rate Limits
- **FMP Free**: 250 calls/day - Monitor usage carefully
- **Alpha Vantage Free**: 5 calls/minute - Add delays between calls
- **Polygon Free**: 5 calls/minute - Add delays between calls
- **FRED**: Unlimited - No concerns

### Caching
The app already has caching configured in `lib/stock-cache.ts`. Make sure it's being used to avoid hitting rate limits.

### Error Handling
All adapters should have retry logic with exponential backoff (already implemented in base adapter).

---

## 🎯 Priority Order

1. **First**: Update Morningstar → FMP (fixes Step 5 error)
2. **Second**: Add SEC EDGAR User-Agent (fixes SEC data)
3. **Third**: Verify FRED API key (fixes economic data)
4. **Fourth**: Replace Finviz → FMP (improves screening)
5. **Fifth**: Replace TipRanks/MarketBeat → FMP (fixes analyst data)

---

## ✅ Success Checklist

After updates, verify:
- [ ] Step 2 (Market Conditions) completes successfully
- [ ] Step 3 (Sector Identification) completes successfully
- [ ] Step 4 (Stock Screening) returns results
- [ ] Step 5 (Fundamental Analysis) fetches data for AAPL
- [ ] Step 6-7 complete successfully
- [ ] Step 9 (Analyst Sentiment) fetches ratings
- [ ] No 404 errors in console
- [ ] Workflow progresses to Step 12

---

## 📞 API Documentation Links

- **FMP Docs**: https://site.financialmodelingprep.com/developer/docs
- **Alpha Vantage Docs**: https://www.alphavantage.co/documentation/
- **Polygon Docs**: https://polygon.io/docs/stocks/getting-started
- **FRED Docs**: https://fred.stlouisfed.org/docs/api/fred/
- **SEC EDGAR Docs**: https://www.sec.gov/edgar/sec-api-documentation
