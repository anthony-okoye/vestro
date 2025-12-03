# Data Source Adapters

This directory contains adapters for all external data sources.

Each adapter extends `BaseDataSourceAdapter` and implements data fetching for specific sources:

- SECEdgarAdapter - SEC EDGAR filings
- YahooFinanceAdapter - Yahoo Finance data
- FinvizAdapter - Finviz stock screener
- MorningstarAdapter - Morningstar financial data
- ReutersAdapter - Reuters company profiles
- SimplyWallStAdapter - Simply Wall St valuations
- TradingViewAdapter - TradingView charts (optional)
- TipRanksAdapter - TipRanks analyst ratings (✓ Implemented)
- MarketBeatAdapter - MarketBeat ratings (✓ Implemented)
- AnalystAggregator - Utility to combine analyst data from multiple sources (✓ Implemented)
- FederalReserveAdapter - Federal Reserve economic data
- CNBCAdapter - CNBC economic news
- BloombergAdapter - Bloomberg market data

Adapters will be implemented in subsequent tasks.


## Analyst Rating Adapters

### TipRanksAdapter

Fetches analyst ratings and price targets from TipRanks.

```typescript
import { TipRanksAdapter } from './data-adapters';

const tipRanks = new TipRanksAdapter();
const ratings = await tipRanks.fetchAnalystRatings('AAPL');

console.log(ratings.consensusRating); // "strong buy" | "buy" | "hold" | "sell" | "strong sell"
console.log(ratings.buyCount, ratings.holdCount, ratings.sellCount);
console.log(ratings.averageTarget);
```

### MarketBeatAdapter

Fetches brokerage firm ratings from MarketBeat.

```typescript
import { MarketBeatAdapter } from './data-adapters';

const marketBeat = new MarketBeatAdapter();
const ratings = await marketBeat.fetchAnalystRatings('AAPL');

console.log(ratings.consensusRating);
console.log(ratings.buyCount, ratings.holdCount, ratings.sellCount);
console.log(ratings.averageTarget);
```

### AnalystAggregator

Combines analyst data from multiple sources to create a comprehensive summary.

```typescript
import { TipRanksAdapter, MarketBeatAdapter, AnalystAggregator } from './data-adapters';

const tipRanks = new TipRanksAdapter();
const marketBeat = new MarketBeatAdapter();

const tipRanksData = await tipRanks.fetchAnalystRatings('AAPL');
const marketBeatData = await marketBeat.fetchAnalystRatings('AAPL');

// Aggregate data from both sources
const summary = AnalystAggregator.aggregateFromSources(tipRanksData, marketBeatData);

console.log(summary.ticker); // "AAPL"
console.log(summary.buyCount); // Combined buy count from both sources
console.log(summary.holdCount); // Combined hold count
console.log(summary.sellCount); // Combined sell count
console.log(summary.averageTarget); // Weighted average price target
console.log(summary.consensus); // Overall consensus rating
```

## Requirements Satisfied

The analyst rating adapters satisfy the following requirements:

- **Requirement 9.1**: Fetch analyst ratings from TipRanks platform ✓
- **Requirement 9.2**: Fetch analyst ratings from MarketBeat ratings platform ✓
- **Requirement 9.3**: Count buy recommendations as an integer ✓
- **Requirement 9.4**: Count hold recommendations as an integer ✓
- **Requirement 9.5**: Count sell recommendations as an integer ✓
- **Requirement 9.6**: Calculate average price target as a floating-point value ✓
- **Requirement 9.7**: Generate Analyst Ratings containing buy count, hold count, sell count, and average target price ✓
