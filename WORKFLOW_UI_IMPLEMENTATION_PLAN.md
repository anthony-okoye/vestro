# Workflow UI Implementation Plan

## Current Status

### ✅ Completed (Task 6: Analysis Engine)
- **Analysis Engine**: Fully implemented and tested
  - Sector scoring algorithm
  - Valuation calculations (PE/PB ratios, peer comparison)
  - Position sizing algorithm (conservative/balanced/aggressive)
  - Moat analysis (patents, brand, customers, cost leadership)
  - Analyst sentiment aggregation
  - **33 unit tests passing** - all functionality verified

- **Workflow Infrastructure**: Working
  - Database schema and migrations
  - State management with Prisma
  - Workflow orchestrator
  - Step processors (all 12 steps)
  - API routes
  - Progress tracking

- **Basic UI**: Functional
  - Profile form (Step 1)
  - Workflow progress bar
  - Step navigation
  - Error handling

---

## ❌ What Remains

### Issue 1: External API Failures
**Problem**: Data adapters are trying to fetch from real external APIs (Morningstar, SEC EDGAR, etc.) which return 404 errors without valid API keys.

**Current Error**:
```
Failed to fetch fundamentals from Morningstar: HTTP 404
```

**Impact**: Steps 2-9 fail when trying to fetch real market data.

### Issue 2: Missing Interactive UI Forms
**Problem**: Users cannot input data for steps that require it. Currently using hardcoded mock values.

**Missing Forms**:
- Step 4: Stock screening filters
- Step 5-9: Stock selection from screening results
- Step 10: Portfolio size and risk model selection
- Step 11: Broker platform selection
- Step 12: Alert configuration

---

## 🔧 Resolution Plan

### Phase 1: Add Mock Data Fallbacks (Quick Fix - 2-3 hours)

**Goal**: Allow workflow to complete without real API calls by using mock data when APIs fail.

**Implementation**:

1. **Update Data Adapters** - Add fallback mock data
   ```typescript
   // In each adapter (e.g., morningstar-adapter.ts)
   async fetchFinancialSnapshot(ticker: string) {
     try {
       // Try real API call
       return await this.fetchFromAPI(ticker);
     } catch (error) {
       // Fallback to mock data
       console.warn(`Using mock data for ${ticker}`);
       return this.getMockData(ticker);
     }
   }
   
   private getMockData(ticker: string) {
     return {
       ticker,
       revenueGrowth5y: 12.5,
       earningsGrowth5y: 15.2,
       profitMargin: 25.3,
       debtToEquity: 0.8,
       freeCashFlow: 95000000000,
       // ... more mock data
     };
   }
   ```

2. **Files to Update**:
   - `lib/data-adapters/morningstar-adapter.ts`
   - `lib/data-adapters/sec-edgar-adapter.ts`
   - `lib/data-adapters/yahoo-finance-adapter.ts`
   - `lib/data-adapters/finviz-adapter.ts`
   - `lib/data-adapters/tipranks-adapter.ts`
   - `lib/data-adapters/marketbeat-adapter.ts`
   - `lib/data-adapters/federal-reserve-adapter.ts`
   - `lib/data-adapters/cnbc-adapter.ts`
   - `lib/data-adapters/bloomberg-adapter.ts`

3. **Benefits**:
   - Workflow completes end-to-end
   - No API keys required for testing
   - Educational/demo mode works

---

### Phase 2: Implement Interactive UI Forms (Full Solution - 8-12 hours)

**Goal**: Allow users to input data through clickable UI forms instead of hardcoded values.

#### Step 4: Stock Screening Form

**Create**: `components/StockScreeningForm.tsx`

```typescript
'use client';

interface StockScreeningFormProps {
  onSubmit: (filters: ScreeningFilters) => void;
  isLoading: boolean;
}

export default function StockScreeningForm({ onSubmit, isLoading }: StockScreeningFormProps) {
  const [filters, setFilters] = useState({
    marketCap: 'large',
    dividendYieldMin: 2,
    peRatioMax: 25,
    sector: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(filters); }}>
      <div className="space-y-4">
        <div>
          <label>Market Cap</label>
          <select 
            value={filters.marketCap}
            onChange={(e) => setFilters({...filters, marketCap: e.target.value})}
          >
            <option value="large">Large Cap</option>
            <option value="mid">Mid Cap</option>
            <option value="small">Small Cap</option>
          </select>
        </div>
        
        <div>
          <label>Minimum Dividend Yield (%)</label>
          <input 
            type="number" 
            value={filters.dividendYieldMin}
            onChange={(e) => setFilters({...filters, dividendYieldMin: Number(e.target.value)})}
          />
        </div>
        
        <div>
          <label>Maximum P/E Ratio</label>
          <input 
            type="number" 
            value={filters.peRatioMax}
            onChange={(e) => setFilters({...filters, peRatioMax: Number(e.target.value)})}
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Screening...' : 'Screen Stocks'}
        </button>
      </div>
    </form>
  );
}
```

#### Step 5-9: Stock Selection UI

**Create**: `components/StockSelector.tsx`

```typescript
'use client';

interface StockSelectorProps {
  stocks: StockCandidate[];
  onSelect: (ticker: string) => void;
  selectedTicker?: string;
}

export default function StockSelector({ stocks, onSelect, selectedTicker }: StockSelectorProps) {
  return (
    <div className="space-y-2">
      <h3>Select a stock to analyze:</h3>
      {stocks.map((stock) => (
        <button
          key={stock.ticker}
          onClick={() => onSelect(stock.ticker)}
          className={`
            w-full p-4 border-2 text-left
            ${selectedTicker === stock.ticker ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <div className="font-bold">{stock.ticker} - {stock.companyName}</div>
          <div className="text-sm text-gray-600">
            Sector: {stock.sector} | Dividend: {stock.dividendYield}% | P/E: {stock.peRatio}
          </div>
        </button>
      ))}
    </div>
  );
}
```

#### Step 10: Position Sizing Form

**Create**: `components/PositionSizingForm.tsx`

```typescript
'use client';

interface PositionSizingFormProps {
  ticker: string;
  currentPrice: number;
  onSubmit: (data: PositionSizingInputs) => void;
}

export default function PositionSizingForm({ ticker, currentPrice, onSubmit }: PositionSizingFormProps) {
  const [portfolioSize, setPortfolioSize] = useState(100000);
  const [riskModel, setRiskModel] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  return (
    <form onSubmit={(e) => { 
      e.preventDefault(); 
      onSubmit({ portfolioSize, riskModel, ticker, entryPrice: currentPrice });
    }}>
      <div className="space-y-4">
        <div>
          <label>Portfolio Size ($)</label>
          <input 
            type="number" 
            value={portfolioSize}
            onChange={(e) => setPortfolioSize(Number(e.target.value))}
            min="1000"
            step="1000"
          />
        </div>
        
        <div>
          <label>Risk Model</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input 
                type="radio" 
                value="conservative"
                checked={riskModel === 'conservative'}
                onChange={(e) => setRiskModel(e.target.value as any)}
              />
              <span className="ml-2">Conservative (5% max per position)</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                value="balanced"
                checked={riskModel === 'balanced'}
                onChange={(e) => setRiskModel(e.target.value as any)}
              />
              <span className="ml-2">Balanced (10% max per position)</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                value="aggressive"
                checked={riskModel === 'aggressive'}
                onChange={(e) => setRiskModel(e.target.value as any)}
              />
              <span className="ml-2">Aggressive (15% max per position)</span>
            </label>
          </div>
        </div>
        
        <button type="submit">Calculate Position Size</button>
      </div>
    </form>
  );
}
```

#### Step 11: Mock Trade Form

**Create**: `components/MockTradeForm.tsx`

```typescript
'use client';

interface MockTradeFormProps {
  recommendation: BuyRecommendation;
  onSubmit: (brokerPlatform: string) => void;
}

export default function MockTradeForm({ recommendation, onSubmit }: MockTradeFormProps) {
  const [broker, setBroker] = useState('');
  const brokerOptions = ['E*TRADE', 'TD Ameritrade', 'Fidelity', 'Charles Schwab', 'Robinhood'];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-2 border-blue-600 p-4">
        <h3 className="font-bold">Recommended Trade:</h3>
        <p>Buy {recommendation.sharesToBuy} shares of {recommendation.ticker}</p>
        <p>Entry Price: ${recommendation.entryPrice}</p>
        <p>Total Investment: ${recommendation.totalInvestment}</p>
        <p>Order Type: {recommendation.orderType}</p>
      </div>
      
      <div>
        <label>Select Broker Platform</label>
        <select 
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
        >
          <option value="">-- Select Broker --</option>
          {brokerOptions.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      
      <button 
        onClick={() => onSubmit(broker)}
        disabled={!broker}
      >
        Execute Mock Trade
      </button>
    </div>
  );
}
```

#### Step 12: Monitoring Setup Form

**Create**: `components/MonitoringSetupForm.tsx`

```typescript
'use client';

interface MonitoringSetupFormProps {
  ticker: string;
  onSubmit: (config: MonitoringConfig) => void;
}

export default function MonitoringSetupForm({ ticker, onSubmit }: MonitoringSetupFormProps) {
  const [alertApp, setAlertApp] = useState('');
  const [reviewFrequency, setReviewFrequency] = useState<'quarterly' | 'yearly'>('quarterly');
  const [priceDropPercent, setPriceDropPercent] = useState(10);
  const [priceGainPercent, setPriceGainPercent] = useState(20);

  const alertApps = ['Yahoo Finance', 'Robinhood', 'E*TRADE', 'Google Finance'];

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ alertApp, reviewFrequency, ticker, priceDropPercent, priceGainPercent });
    }}>
      <div className="space-y-4">
        <div>
          <label>Alert Application</label>
          <select value={alertApp} onChange={(e) => setAlertApp(e.target.value)}>
            <option value="">-- Select App --</option>
            {alertApps.map(app => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Review Frequency</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input 
                type="radio" 
                value="quarterly"
                checked={reviewFrequency === 'quarterly'}
                onChange={(e) => setReviewFrequency(e.target.value as any)}
              />
              <span className="ml-2">Quarterly</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                value="yearly"
                checked={reviewFrequency === 'yearly'}
                onChange={(e) => setReviewFrequency(e.target.value as any)}
              />
              <span className="ml-2">Yearly</span>
            </label>
          </div>
        </div>
        
        <div>
          <label>Price Drop Alert (%)</label>
          <input 
            type="number" 
            value={priceDropPercent}
            onChange={(e) => setPriceDropPercent(Number(e.target.value))}
            min="1"
            max="50"
          />
        </div>
        
        <div>
          <label>Price Gain Alert (%)</label>
          <input 
            type="number" 
            value={priceGainPercent}
            onChange={(e) => setPriceGainPercent(Number(e.target.value))}
            min="1"
            max="500"
          />
        </div>
        
        <button type="submit" disabled={!alertApp}>
          Set Up Monitoring
        </button>
      </div>
    </form>
  );
}
```

#### Update Workflow Page

**Modify**: `app/workflow/[sessionId]/page.tsx`

Add step-specific rendering logic:

```typescript
// In the workflow page component
function renderStepContent() {
  if (!status) return null;

  switch (status.currentStep) {
    case 4:
      return <StockScreeningForm onSubmit={handleStockScreening} isLoading={executing} />;
    
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
      // Show stock selector if we have screening results
      const screeningResults = stepData[4]?.stockShortlist;
      if (screeningResults) {
        return <StockSelector stocks={screeningResults} onSelect={handleStockSelect} />;
      }
      break;
    
    case 10:
      return <PositionSizingForm ticker={selectedTicker} currentPrice={150} onSubmit={handlePositionSizing} />;
    
    case 11:
      const recommendation = stepData[10]?.buyRecommendation;
      if (recommendation) {
        return <MockTradeForm recommendation={recommendation} onSubmit={handleMockTrade} />;
      }
      break;
    
    case 12:
      return <MonitoringSetupForm ticker={selectedTicker} onSubmit={handleMonitoringSetup} />;
    
    default:
      return <div>Step {status.currentStep} - Auto-executing...</div>;
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Mock Data Fallbacks
- [ ] Add mock data to MorningstarAdapter
- [ ] Add mock data to SECEdgarAdapter
- [ ] Add mock data to YahooFinanceAdapter
- [ ] Add mock data to FinvizAdapter
- [ ] Add mock data to TipRanksAdapter
- [ ] Add mock data to MarketBeatAdapter
- [ ] Add mock data to FederalReserveAdapter
- [ ] Add mock data to CNBCAdapter
- [ ] Add mock data to BloombergAdapter
- [ ] Test workflow completion with mock data

### Phase 2: Interactive UI Forms
- [ ] Create StockScreeningForm component
- [ ] Create StockSelector component
- [ ] Create PositionSizingForm component
- [ ] Create MockTradeForm component
- [ ] Create MonitoringSetupForm component
- [ ] Update workflow page to render step-specific forms
- [ ] Add state management for selected stock
- [ ] Add form validation
- [ ] Add loading states
- [ ] Test complete user flow

---

## 🎯 Priority Recommendation

**Start with Phase 1** (Mock Data Fallbacks):
- Quick to implement (2-3 hours)
- Unblocks workflow testing
- Allows end-to-end validation
- No UI changes required

**Then Phase 2** (Interactive Forms):
- Better user experience
- Production-ready
- Requires more time (8-12 hours)

---

## 📝 Notes

- Task 6 (Analysis Engine) is **complete and working**
- The analysis engine has **33 passing tests**
- Current issues are **UI and data fetching**, not analysis logic
- Mock data allows testing without real API keys
- Interactive forms provide better UX but require significant development time
