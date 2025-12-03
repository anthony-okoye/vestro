# Caching and Performance Optimization

This document describes the caching and performance optimizations implemented in the ResurrectionStockPicker application.

## Overview

The application implements a multi-layer caching strategy to improve performance and reduce external API calls:

1. **Next.js Server-Side Caching** - Using `unstable_cache` for automatic request deduplication
2. **Database-Level Caching** - Using Prisma with optimized indexes
3. **Application-Level Caching** - Custom stock analysis cache

## 1. Next.js Caching Configuration

### Cache Durations

Different data types have different cache durations based on their update frequency:

| Data Type | Cache Duration | Rationale |
|-----------|---------------|-----------|
| Macro Economic Data | 1 hour | Updates infrequently (daily/weekly) |
| Sector Data | 24 hours | Daily updates sufficient |
| Stock Quotes | 15 minutes | Frequent updates needed |
| Company Profiles | 7 days | Rarely changes |
| Financial Filings | 1 day | Quarterly updates |
| Analyst Ratings | 1 day | Daily updates |
| Valuation Data | 1 day | Daily updates |

### Implementation

Caching is implemented in `lib/cache-config.ts` using Next.js `unstable_cache`:

```typescript
import { unstable_cache } from "next/cache";

// Example: Cached interest rate fetching
const fetchInterestRateCached = createCachedFetcher(
  async () => {
    // Fetch logic here
  },
  "interest-rate",
  { revalidate: 3600, tags: ["macro-data"] }
);
```

### Cache Invalidation

Caches can be invalidated by tag:

```typescript
import { revalidateTag } from "next/cache";

// Invalidate all macro data caches
revalidateTag("macro-data");
```

## 2. Parallel Data Fetching

### Promise.all() for Multiple Sources

Step processors fetch data from multiple sources in parallel using `Promise.allSettled()`:

```typescript
// Before: Sequential fetching (slow)
const interestRate = await fetchInterestRate();
const inflationRate = await fetchInflationRate();
const unemploymentRate = await fetchUnemploymentRate();

// After: Parallel fetching (fast)
const [interestRateResult, inflationRateResult, unemploymentRateResult] = 
  await Promise.allSettled([
    fetchInterestRate(),
    fetchInflationRate(),
    fetchUnemploymentRate(),
  ]);
```

### Batch Fetching Utility

The `lib/batch-fetcher.ts` module provides utilities for batching requests:

```typescript
import { batchFetch } from "./batch-fetcher";

// Fetch multiple stock quotes with concurrency control
const quotes = await batchFetch(
  tickers,
  (ticker) => fetchQuote(ticker),
  { batchSize: 10 }
);
```

## 3. Database Indexing

### Prisma Schema Indexes

The following indexes have been added to optimize common query patterns:

#### WorkflowSession Indexes
- `userId` - For user-specific queries
- `createdAt` - For chronological sorting
- `userId + createdAt` - Composite index for workflow history
- `updatedAt` - For finding recently updated sessions

#### StepData Indexes
- `sessionId` - For session-specific queries
- `stepId` - For querying specific step types
- `success` - For filtering by success status
- `sessionId + stepId` - Unique constraint and lookup

#### StockAnalysisCache Indexes
- `ticker` - Primary lookup (unique)
- `sector` - For sector-based queries
- `lastFetched` - For cache invalidation
- `hitCount` - For popularity tracking

### Query Optimization Examples

```typescript
// Optimized: Uses userId + createdAt composite index
const sessions = await prisma.workflowSession.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
  take: 10,
});

// Optimized: Uses sessionId + stepId unique index
const stepData = await prisma.stepData.findUnique({
  where: {
    sessionId_stepId: { sessionId, stepId },
  },
});
```

## 4. Stock Analysis Cache

### Purpose

The `StockAnalysisCache` model stores frequently accessed stock data to reduce external API calls.

### Usage

```typescript
import { getCachedStockData, setCachedStockData } from "./stock-cache";

// Try to get from cache first
let data = await getCachedStockData(ticker, 60); // 60 minutes max age

if (!data) {
  // Fetch from external API
  const freshData = await fetchFromAPI(ticker);
  
  // Store in cache
  await setCachedStockData(ticker, freshData, {
    companyName: "Apple Inc.",
    sector: "Technology",
  });
  
  data = freshData;
}
```

### Cache Management

```typescript
// Clean up stale entries (older than 24 hours)
const removed = await cleanStaleCache(24);

// Get most popular stocks
const popular = await getMostPopularStocks(10);

// Get cache statistics
const stats = await getCacheStats();
console.log(`Cache has ${stats.totalEntries} entries with ${stats.totalHits} total hits`);
```

## 5. Performance Monitoring

### Key Metrics to Track

1. **Cache Hit Rate** - Percentage of requests served from cache
2. **API Response Time** - Time to fetch from external sources
3. **Database Query Time** - Time for Prisma queries
4. **Step Execution Time** - Total time for each workflow step

### Recommended Tools

- Next.js built-in analytics
- Prisma query logging
- Custom timing middleware

## 6. Best Practices

### Do's
✅ Use parallel fetching for independent data sources
✅ Set appropriate cache durations based on data freshness needs
✅ Use database indexes for frequently queried fields
✅ Monitor cache hit rates and adjust strategies
✅ Clean up stale cache entries regularly

### Don'ts
❌ Don't cache user-specific sensitive data without encryption
❌ Don't set cache durations too long for time-sensitive data
❌ Don't fetch data sequentially when parallel fetching is possible
❌ Don't add indexes on every field (impacts write performance)
❌ Don't forget to handle cache misses gracefully

## 7. Setup Instructions

### Generate Prisma Client

After updating the schema, regenerate the Prisma client:

```bash
npx prisma generate
```

### Run Migrations

Apply the database migrations:

```bash
npx prisma migrate dev --name add_performance_indexes
```

Or for production:

```bash
npx prisma migrate deploy
```

### Environment Variables

Ensure these are set in `.env`:

```
DATABASE_URL="file:./dev.db"
```

## 8. Future Improvements

- Implement Redis for distributed caching
- Add cache warming for popular stocks
- Implement request coalescing for duplicate requests
- Add cache metrics dashboard
- Implement adaptive cache durations based on usage patterns
