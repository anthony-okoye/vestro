# API Providers and Setup Guide

This document lists all external APIs used in the ResurrectionStockPicker application, their access requirements, and setup instructions.

---

## 📊 APIs by Workflow Step

### Step 2: Market Conditions

#### 1. **Federal Reserve Economic Data (FRED)**
- **Website**: https://fred.stlouisfed.org/
- **Purpose**: Interest rates, inflation, unemployment data
- **API Docs**: https://fred.stlouisfed.org/docs/api/fred/
- **Cost**: FREE
- **Requires Account**: YES
- **API Key**: YES

**Setup Steps**:
1. Go to https://fred.stlouisfed.org/
2. Click "My Account" → "Register"
3. After registration, go to https://fred.stlouisfed.org/docs/api/api_key.html
4. Request an API key
5. Add to `.env`: `FEDERAL_RESERVE_API_KEY=your_key_here`

**Current Status**: ❌ No API key configured

---

#### 2. **CNBC**
- **Website**: https://www.cnbc.com
- **Purpose**: Market trends and economic news
- **API Docs**: No official public API
- **Cost**: N/A
- **Requires Account**: NO
- **API Key**: NO

**Setup Steps**:
- Uses web scraping (no API key needed)
- May require User-Agent headers
- Rate limiting recommended

**Current Status**: ⚠️ Web scraping (may be unreliable)

---

#### 3. **Bloomberg**
- **Website**: https://www.bloomberg.com
- **Purpose**: Market data and trends
- **API Docs**: https://www.bloomberg.com/professional/support/api-library/
- **Cost**: EXPENSIVE (Enterprise only, $20,000+/year)
- **Requires Account**: YES (Enterprise)
- **API Key**: YES

**Setup Steps**:
- Bloomberg Terminal subscription required
- Contact Bloomberg sales
- **NOT RECOMMENDED** for individual developers

**Current Status**: ❌ No access (too expensive)
**Alternative**: Use Yahoo Finance or Alpha Vantage instead

---

### Step 3: Sector Identification

#### 4. **Yahoo Finance**
- **Website**: https://finance.yahoo.com
- **Purpose**: Sector data, stock quotes, company profiles
- **API Docs**: No official API (discontinued)
- **Cost**: FREE
- **Requires Account**: NO
- **API Key**: NO

**Setup Steps**:
- Uses unofficial Yahoo Finance API
- Library: `yahoo-finance2` (npm package)
- No API key required
- Rate limiting: ~2000 requests/hour

**Current Status**: ✅ Should work (no API key needed)
**Note**: Unofficial API, may break if Yahoo changes their endpoints

---

### Step 4: Stock Screening

#### 5. **Finviz**
- **Website**: https://finviz.com
- **Purpose**: Stock screening
- **API Docs**: No official API
- **Cost**: FREE (basic), $39.50/month (Elite)
- **Requires Account**: NO (for basic scraping)
- **API Key**: NO

**Setup Steps**:
- Uses web scraping
- No API key required
- Rate limiting recommended (1 request/second)

**Current Status**: ⚠️ Web scraping (may be unreliable)
**Alternative**: Use Alpha Vantage or Financial Modeling Prep

---

### Step 5: Fundamental Analysis

#### 6. **SEC EDGAR**
- **Website**: https://www.sec.gov/edgar
- **Purpose**: Company filings (10-K, 10-Q)
- **API Docs**: https://www.sec.gov/edgar/sec-api-documentation
- **Cost**: FREE
- **Requires Account**: NO
- **API Key**: NO (but requires User-Agent header)

**Setup Steps**:
1. No registration required
2. MUST include User-Agent header with your email
3. Rate limit: 10 requests/second
4. Add to requests: `User-Agent: YourCompanyName your@email.com`

**Current Status**: ⚠️ Needs proper User-Agent header

**Example**:
```typescript
headers: {
  'User-Agent': 'ResurrectionStockPicker your@email.com'
}
```

---

#### 7. **Morningstar**
- **Website**: https://www.morningstar.com
- **Purpose**: Financial snapshots, fundamentals
- **API Docs**: https://developer.morningstar.com/
- **Cost**: EXPENSIVE (starts at $500/month)
- **Requires Account**: YES
- **API Key**: YES

**Setup Steps**:
1. Go to https://developer.morningstar.com/
2. Contact sales for pricing
3. Minimum commitment usually required
4. **NOT RECOMMENDED** for individual developers

**Current Status**: ❌ No access (expensive)
**Alternative**: Use Financial Modeling Prep or Alpha Vantage

---

### Step 6: Competitive Position

#### 8. **Reuters**
- **Website**: https://www.reuters.com
- **Purpose**: Company profiles
- **API Docs**: No public API
- **Cost**: N/A
- **Requires Account**: NO
- **API Key**: NO

**Setup Steps**:
- Uses web scraping
- No API key required

**Current Status**: ⚠️ Web scraping (may be unreliable)

---

### Step 7: Valuation Evaluation

#### 9. **Simply Wall St**
- **Website**: https://simplywall.st
- **Purpose**: Valuation data
- **API Docs**: No public API
- **Cost**: $12/month (Premium)
- **Requires Account**: YES
- **API Key**: NO (no official API)

**Setup Steps**:
- No official API available
- Would require web scraping with authentication

**Current Status**: ❌ No API available
**Alternative**: Use Financial Modeling Prep or Yahoo Finance

---

### Step 8: Technical Trends (Optional)

#### 10. **TradingView**
- **Website**: https://www.tradingview.com
- **Purpose**: Technical charts and indicators
- **API Docs**: No public API
- **Cost**: $14.95/month (Pro)
- **Requires Account**: YES
- **API Key**: NO (no official API)

**Setup Steps**:
- No official API available
- TradingView widgets can be embedded

**Current Status**: ❌ No API available
**Alternative**: Use Alpha Vantage or Yahoo Finance for price data

---

### Step 9: Analyst Sentiment

#### 11. **TipRanks**
- **Website**: https://www.tipranks.com
- **Purpose**: Analyst ratings and price targets
- **API Docs**: https://www.tipranks.com/api
- **Cost**: Contact for pricing (likely expensive)
- **Requires Account**: YES
- **API Key**: YES

**Setup Steps**:
1. Go to https://www.tipranks.com/api
2. Contact sales
3. Pricing not publicly available

**Current Status**: ❌ No access
**Alternative**: Use Financial Modeling Prep or Benzinga

---

#### 12. **MarketBeat**
- **Website**: https://www.marketbeat.com
- **Purpose**: Analyst ratings
- **API Docs**: No public API
- **Cost**: N/A
- **Requires Account**: NO
- **API Key**: NO

**Setup Steps**:
- Uses web scraping
- No API key required

**Current Status**: ⚠️ Web scraping (may be unreliable)

---

## 🎯 Recommended Alternative APIs

### **Alpha Vantage** (RECOMMENDED)
- **Website**: https://www.alphavantage.co/
- **Purpose**: Stock data, fundamentals, technical indicators
- **API Docs**: https://www.alphavantage.co/documentation/
- **Cost**: FREE (5 API calls/minute), $49.99/month (Premium)
- **Requires Account**: YES
- **API Key**: YES (FREE)

**Setup Steps**:
1. Go to https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Get instant free API key
4. Add to `.env`: `ALPHA_VANTAGE_API_KEY=your_key_here`

**Covers**:
- Stock quotes
- Company fundamentals
- Technical indicators
- Sector performance
- Economic indicators

---

### **Financial Modeling Prep** (RECOMMENDED)
- **Website**: https://financialmodelingprep.com/
- **Purpose**: Financial statements, ratios, analyst estimates
- **API Docs**: https://site.financialmodelingprep.com/developer/docs
- **Cost**: FREE (250 calls/day), $14/month (Starter), $29/month (Professional)
- **Requires Account**: YES
- **API Key**: YES (FREE tier available)

**Setup Steps**:
1. Go to https://site.financialmodelingprep.com/register
2. Register for free account
3. Get API key from dashboard
4. Add to `.env`: `FMP_API_KEY=your_key_here`

**Covers**:
- Financial statements
- Company profiles
- Stock screener
- Analyst estimates
- Insider trading
- SEC filings

---

### **Polygon.io** (RECOMMENDED)
- **Website**: https://polygon.io/
- **Purpose**: Real-time and historical market data
- **API Docs**: https://polygon.io/docs/
- **Cost**: FREE (5 API calls/minute), $29/month (Starter)
- **Requires Account**: YES
- **API Key**: YES (FREE tier available)

**Setup Steps**:
1. Go to https://polygon.io/dashboard/signup
2. Register for free account
3. Get API key from dashboard
4. Add to `.env`: `POLYGON_API_KEY=your_key_here`

**Covers**:
- Stock quotes
- Historical data
- Company details
- Market status

---

### **Benzinga** (For News/Ratings)
- **Website**: https://www.benzinga.com/apis
- **Purpose**: News, analyst ratings, earnings
- **API Docs**: https://docs.benzinga.io/
- **Cost**: Contact for pricing (starts around $50/month)
- **Requires Account**: YES
- **API Key**: YES

**Setup Steps**:
1. Go to https://www.benzinga.com/apis
2. Request demo/pricing
3. Get API key after signup

---

## 📋 Quick Setup Checklist

### Free APIs (Start Here)
- [ ] **Alpha Vantage** - Get free API key (5 calls/min)
- [ ] **Financial Modeling Prep** - Get free API key (250 calls/day)
- [ ] **Polygon.io** - Get free API key (5 calls/min)
- [ ] **FRED (Federal Reserve)** - Get free API key
- [ ] **SEC EDGAR** - Add User-Agent header with your email

### Paid APIs (If Budget Allows)
- [ ] **Financial Modeling Prep** - $14/month (Starter plan)
- [ ] **Alpha Vantage** - $49.99/month (Premium)
- [ ] **Polygon.io** - $29/month (Starter)

### Not Recommended (Too Expensive)
- ❌ **Bloomberg** - $20,000+/year
- ❌ **Morningstar** - $500+/month
- ❌ **TipRanks** - Pricing not public (likely expensive)

---

## 🔧 Implementation Priority

### Phase 1: Free APIs (Immediate)
Replace expensive/unavailable APIs with free alternatives:

1. **Replace Morningstar** → Use Financial Modeling Prep
2. **Replace Bloomberg** → Use Alpha Vantage
3. **Replace TipRanks** → Use Financial Modeling Prep analyst estimates
4. **Replace Simply Wall St** → Use Financial Modeling Prep ratios
5. **Keep Yahoo Finance** → Already free (unofficial API)
6. **Keep SEC EDGAR** → Already free (add User-Agent)
7. **Add FRED API key** → Free, just need to register

### Phase 2: Upgrade (Optional)
If free tier limits are hit:
- Upgrade Financial Modeling Prep to $14/month
- Upgrade Alpha Vantage to $49.99/month
- Upgrade Polygon.io to $29/month

---

## 📝 Environment Variables Needed

Add these to your `.env` file:

```bash
# Free APIs (Get these first)
ALPHA_VANTAGE_API_KEY=your_key_here
FMP_API_KEY=your_key_here
POLYGON_API_KEY=your_key_here
FEDERAL_RESERVE_API_KEY=your_key_here

# SEC EDGAR (no key, but add your email)
SEC_EDGAR_USER_AGENT=ResurrectionStockPicker your@email.com

# Optional Paid APIs
BENZINGA_API_KEY=your_key_here
```

---

## 🚀 Next Steps

1. **Sign up for free APIs** (Alpha Vantage, FMP, Polygon, FRED)
2. **Update data adapters** to use new APIs
3. **Test each adapter** with real API keys
4. **Monitor rate limits** and upgrade if needed

---

## 📞 Support Links

- **Alpha Vantage Support**: https://www.alphavantage.co/support/
- **Financial Modeling Prep Support**: https://site.financialmodelingprep.com/contact
- **Polygon.io Support**: https://polygon.io/contact
- **FRED Support**: https://fred.stlouisfed.org/docs/api/fred/
