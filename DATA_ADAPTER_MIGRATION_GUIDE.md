# Data Adapter Migration Guide

This guide shows which data adapters need to be updated to use the new API keys you've registered for.

---

## ✅ API Keys You Have

Based on your registrations, you now have:
- ✅ Alpha Vantage API Key
- ✅ Financial Modeling Prep (FMP) API Key  
- ✅ Polygon.io API Key
- ✅ FRED (Federal Reserve) API Key

---

## 🔄 Adapters That Need Updates

### Priority 1: Critical (Currently Failing)

#### 1. **Morningstar Adapter** → Replace with FMP
**File**: `lib/data-adapters/morningstar-adapter.ts`
**Current**: Tries to fetch from Morningstar (expensive, no access)
**Solution**: Replace with Financial Modeling Prep API

**FMP Endpoints to Use**:
- Company Profile: `https://financialmodelingprep.com/api/v3/profile/{ticker}?apikey={FMP_API_KEY}`
- Financial Statements: `https://financialmodelingprep.com/api/v3/income-statement/{ticker}?apikey={FMP_API_KEY}`
- Key Metrics: `https://financialmodelingprep.com/api/v3/key-metrics/{ticker}?apikey={FMP_API_KEY}`

**What to Change**:
```typescript
// OLD (Morningstar - doesn't work)
const url = `${this.baseUrl}/stocks/${ticker}/quote`;

// NEW (FMP - works with your API key)
const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${process.env.FMP_API_KEY}`;
```

---

#### 2. **SEC EDGAR Adapter** → Add User-Agent Header
**File**: `lib/data-adapters/sec-edgar-adapter.ts`
**Current**: Missing required User-Agent header
**Solution**: Add User-Agent header with your email

**What to Change**:
```typescript
// Add to all fetch requests
headers: {
  'User-Agent': process.env.SEC_EDGAR_USER_AGENT || 'ResurrectionStockPicker contact@example.com',
  'Accept': 'application/json'
}
```

---

#### 3. **Federal Reserve Adapter** → Use API Key
**File**: `lib/data-adapters/federal-reserve-adapter.ts`
**Current**: May not be using API key correctly
**Solution**: Ensure API key is included in requests

**FRED API Format**:
```
https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key={FRED_API_KEY}&file_type=json
```

**What to Change**:
```typescript
// Ensure API key is appended to all requests
const url = `${this.baseUrl}/series/observations?series_id=${seriesId}&api_key=${process.env.FEDERAL_RESERVE_API_KEY}&file_type=json`;
```

---

### Priority 2: Enhancements (Currently Using Web Scraping)

#### 4. **Finviz Adapter** → Replace with FMP Stock Screener
**File**: `lib/data-adapters/finviz-adapter.ts`
**Current**: Web scraping (unreliable)
**Solution**: Use FMP stock screener API

**FMP Stock Screener**:
```
https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=1000000000&betaMoreThan=1&volumeMoreThan=10000&sector=Technology&exchange=NASDAQ&dividendMoreThan=0&limit=100&apikey={FMP_API_KEY}
```

---

#### 5. **TipRanks/MarketBeat Adapters** → Replace with FMP Analyst Estimates
**Files**: 
- `lib/data-adapters/tipranks-adapter.ts`
- `lib/data-adapters/marketbeat-adapter.ts`

**Current**: No API access
**Solution**: Use FMP analyst estimates

**FMP Analyst Estimates**:
```
https://financialmodelingprep.com/api/v3/analyst-estimates/{ticker}?apikey={FMP_API_KEY}
https://financialmodelingprep.com/api/v3/price-target/{ticker}?apikey={FMP_API_KEY}
```

---

#### 6. **Yahoo Finance Adapter** → Optionally Replace with Alpha Vantage
**File**: `lib/data-adapters/yahoo-finance-adapter.ts`
**Current**: Using unofficial Yahoo Finance API (works but unofficial)
**Solution**: Optionally replace with Alpha Vantage for more reliability

**Alpha Vantage Endpoints**:
- Quote: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}`
- Company Overview: `https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}`

---

### Priority 3: Optional (Can Keep As-Is)

#### 7. **CNBC/Bloomberg Adapters**
**Files**: 
- `lib/data-adapters/cnbc-adapter.ts`
- `lib/data-adapters/bloomberg-adapter.ts`

**Current**: Web scraping for news/trends
**Solution**: Can keep as-is or replace with Alpha Vantage news API

**Alpha Vantage News**:
```
https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={ticker}&apikey={ALPHA_VANTAGE_API_KEY}
```

---

## 📝 Implementation Checklist

### Immediate (To Fix Current Errors)
- [ ] Update Morningstar Adapter to use FMP API
- [ ] Add User-Agent header to SEC EDGAR Adapter
- [ ] Verify FRED Adapter uses API key correctly

### Short-term (Improve Reliability)
- [ ] Replace Finviz with FMP stock screener
- [ ] Replace TipRanks/MarketBeat with FMP analyst estimates
- [ ] Test all adapters with real API keys

### Optional (Nice to Have)
- [ ] Replace Yahoo Finance with Alpha Vantage
- [ ] Add Alpha Vantage news for CNBC/Bloomberg
- [ ] Add Polygon.io for real-time quotes

---

## 🔧 Quick Reference: API Endpoints

### Financial Modeling Prep (FMP)
```
Base URL: https://financialmodelingprep.com/api/v3/
API Key: Append ?apikey={FMP_API_KEY} to all requests

Key Endpoints:
- Profile: /profile/{ticker}
- Income Statement: /income-statement/{ticker}
- Balance Sheet: /balance-sheet-statement/{ticker}
- Cash Flow: /cash-flow-statement/{ticker}
- Key Metrics: /key-metrics/{ticker}
- Ratios: /ratios/{ticker}
- Stock Screener: /stock-screener
- Analyst Estimates: /analyst-estimates/{ticker}
- Price Target: /price-target/{ticker}
- Insider Trading: /insider-trading
```

### Alpha Vantage
```
Base URL: https://www.alphavantage.co/query
API Key: Add &apikey={ALPHA_VANTAGE_API_KEY} to all requests

Key Endpoints:
- Quote: ?function=GLOBAL_QUOTE&symbol={ticker}
- Overview: ?function=OVERVIEW&symbol={ticker}
- Income Statement: ?function=INCOME_STATEMENT&symbol={ticker}
- Balance Sheet: ?function=BALANCE_SHEET&symbol={ticker}
- Cash Flow: ?function=CASH_FLOW&symbol={ticker}
- News: ?function=NEWS_SENTIMENT&tickers={ticker}
```

### Polygon.io
```
Base URL: https://api.polygon.io/v2/
API Key: Add ?apiKey={POLYGON_API_KEY} to all requests

Key Endpoints:
- Last Trade: /last/trade/{ticker}
- Ticker Details: /reference/tickers/{ticker}
- Aggregates: /aggs/ticker/{ticker}/range/1/day/{from}/{to}
```

### FRED (Federal Reserve)
```
Base URL: https://api.stlouisfed.org/fred/
API Key: Add &api_key={FRED_API_KEY} to all requests

Key Endpoints:
- Series Observations: /series/observations?series_id={id}&file_type=json
- Series Info: /series?series_id={id}&file_type=json

Common Series IDs:
- FEDFUNDS: Federal Funds Rate
- CPIAUCSL: Consumer Price Index (Inflation)
- UNRATE: Unemployment Rate
- GDP: Gross Domestic Product
```

### SEC EDGAR
```
Base URL: https://data.sec.gov/
Required Header: User-Agent: {your_app_name} {your_email}

Key Endpoints:
- Company CIK Lookup: /submissions/CIK{cik_padded}.json
- Company Facts: /api/xbrl/companyfacts/CIK{cik_padded}.json
```

---

## 🚀 Next Steps

1. **Update the 3 critical adapters** (Morningstar, SEC EDGAR, FRED)
2. **Test the workflow** to see if Step 5 now works
3. **Gradually replace** other adapters as needed
4. **Monitor API rate limits** and upgrade plans if necessary

---

## 📊 Rate Limits to Watch

- **Alpha Vantage Free**: 5 calls/minute, 500 calls/day
- **FMP Free**: 250 calls/day
- **Polygon Free**: 5 calls/minute
- **FRED**: Unlimited (but be reasonable)
- **SEC EDGAR**: 10 requests/second

If you hit rate limits, consider:
- Implementing caching (already set up in `lib/stock-cache.ts`)
- Upgrading to paid tiers
- Batching requests where possible

---

## ✅ Success Criteria

After updating the adapters, you should be able to:
1. ✅ Complete Step 2 (Market Conditions) with FRED data
2. ✅ Complete Step 5 (Fundamental Analysis) with FMP data
3. ✅ Complete Step 9 (Analyst Sentiment) with FMP estimates
4. ✅ Run the entire workflow end-to-end without API errors

---

## 📞 Need Help?

If you encounter issues:
1. Check API key is correctly set in `.env`
2. Verify API endpoint URLs match documentation
3. Check rate limits haven't been exceeded
4. Review API provider documentation for changes
5. Test API calls directly with curl/Postman first

**API Documentation Links**:
- FMP: https://site.financialmodelingprep.com/developer/docs
- Alpha Vantage: https://www.alphavantage.co/documentation/
- Polygon: https://polygon.io/docs/
- FRED: https://fred.stlouisfed.org/docs/api/fred/
