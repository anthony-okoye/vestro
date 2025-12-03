# Implementation Plan

- [x] 1. Set up Next.js project structure and core workflow infrastructure





  - Initialize Next.js 14+ project with TypeScript and App Router
  - Set up directory structure: app/ (routes), lib/ (workflow orchestrator, step processors, data adapters, analysis engine, state manager), components/ (UI)
  - Configure TypeScript with strict type checking
  - Install dependencies: Prisma, axios/fetch for HTTP, date-fns, zod for validation
  - Create base interfaces for StepProcessor, DataSourceAdapter, and WorkflowOrchestrator in lib/types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement data models and validation





  - [x] 2.1 Create TypeScript interfaces for all 12 workflow step data models

    - Define InvestmentProfile, MacroSnapshot, SectorRanking, StockCandidate, Fundamentals, MoatAnalysis, ValuationMetrics, TechnicalSignals, AnalystSummary, BuyRecommendation, TradeConfirmation, and MonitoringPlan interfaces
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 2.2 Implement validation functions for user inputs


    - Write validation for risk tolerance, investment horizon, capital, and goals
    - Create validation for screening filters (market cap, dividend yield, PE ratio)
    - Implement validation for risk model and review frequency
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 10.1, 10.2, 12.2_
  - [x] 2.3 Write unit tests for data models and validation






    - Test validation edge cases (negative values, invalid enums, missing required fields)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Build state management and persistence layer with Prisma




  - [x] 3.1 Set up Prisma ORM with PostgreSQL


    - Initialize Prisma and create schema for workflow sessions, step data, and user profiles
    - Define models: User, InvestmentProfile, WorkflowSession, StepData
    - Generate Prisma client
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 3.2 Implement StateManager using Prisma


    - Create lib/state-manager.ts with methods for createSession, updateSession, getSession, saveStepData, getStepData
    - Implement saveUserProfile and getUserProfile methods
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 3.3 Write integration tests for state persistence






    - Test session lifecycle, data retrieval, and concurrent access
    - _Requirements: 1.5, 2.6_

- [x] 4. Implement workflow orchestrator





  - [x] 4.1 Create WorkflowOrchestrator class


    - Implement startWorkflow, executeStep, getWorkflowStatus methods
    - Add skipOptionalStep and resetWorkflow functionality
    - Create step dependency validation logic
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_

  - [x] 4.2 Implement workflow state machine

    - Define step transitions and validation rules
    - Handle optional step (Step 8) logic
    - Add workflow progress calculation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 4.3 Write unit tests for orchestrator logic







    - Test step progression, optional step skipping, and error handling
    - _Requirements: 1.5, 8.5_

- [x] 5. Build data source adapters






  - [x] 5.1 Implement base DataSourceAdapter with retry and rate limiting

    - Create abstract base class with fetch, isAvailable, and getRateLimit methods
    - Add exponential backoff retry logic (up to 3 attempts)
    - Implement rate limiting with configurable thresholds
    - _Requirements: 2.1, 3.1, 3.2, 4.5, 5.1, 5.2, 6.1, 6.2, 7.1, 9.1, 9.2_
  - [x] 5.2 Create SECEdgarAdapter for financial filings


    - Implement fetchFilings method to query SEC EDGAR API
    - Parse filing data and extract relevant financial metrics
    - _Requirements: 5.1_
  - [x] 5.3 Create YahooFinanceAdapter for quotes and sector data


    - Implement fetchQuote, fetchSectorData, and fetchCompanyProfile methods
    - Handle Yahoo Finance API responses and transform to internal format
    - _Requirements: 3.1, 4.5, 6.2_
  - [x] 5.4 Create FinvizAdapter for stock screening


    - Implement screenStocks method with filter parameters
    - Parse Finviz screener results
    - _Requirements: 4.5_
  - [x] 5.5 Create adapters for macro economic data


    - Implement FederalReserveAdapter for interest rate data
    - Implement CNBCAdapter and BloombergAdapter for market trend data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


  - [x] 5.6 Create adapters for analyst ratings











    - Implement TipRanksAdapter and MarketBeatAdapter


    - Parse analyst ratings and calculate consensus
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  - [x] 5.7 Create remaining adapters (Morningstar, Reuters, SimplyWallSt, TradingView)





    - Implement MorningstarAdapter for financial snapshots
    - Implement ReutersAdapter for company profiles
    - Implement SimplyWallStAdapter for valuations
    - Implement TradingViewAdapter for optional technical analysis
    - _Requirements: 5.2, 6.1, 7.1, 8.1, 8.2, 8.3, 8.4_
  - [x] 5.8 Write integration tests for data adapters






    - Test with mock responses and error scenarios
    - _Requirements: 2.1, 3.1, 4.5, 5.1, 5.2_

- [x] 6. Implement analysis engine









  - [x] 6.1 Create AnalysisEngine class with sector scoring



    - Implement scoreSectors method to rank sectors based on growth indicators
    - Calculate sector scores using weighted metrics
    - Generate rationale text for each sector ranking
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 6.2 Add valuation calculation methods


    - Implement calculateValuations to compute PE and PB ratios
    - Add peer comparison logic

    - _Requirements: 7.3, 7.4, 7.5, 7.6_
  - [x] 6.3 Implement position sizing algorithm


    - Create determinePositionSize method based on risk model
    - Calculate appropriate share quantities and portfolio percentages

    - Apply conservative, balanced, or aggressive allocation rules
    - _Requirements: 10.3, 10.4, 10.5, 10.6_
  - [x] 6.4 Add moat analysis logic


    - Implement analyzeMoat to assess competitive advantages

    - Score patents, brand strength, customer base, and cost leadership
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 6.5 Create analyst sentiment aggregation



    - Implement aggregateAnalystSentiment to summarize ratings
    - Calculate consensus recommendation
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_
  - [x] 6.6 Write unit tests for analysis calculations






    - Test scoring algorithms, position sizing edge cases, and aggregation logic
    - _Requirements: 3.4, 7.6, 10.6_

- [x] 7. Build step processors for workflow steps 1-4








  - [x] 7.1 Implement ProfileDefinitionProcessor (Step 1)


    - Create processor to accept and validate investment profile inputs
    - Store profile in state manager
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 7.2 Implement MarketConditionsProcessor (Step 2)


    - Fetch macro data from Federal Reserve, CNBC, and Bloomberg adapters
    - Extract interest rate, inflation, unemployment, and market trend
    - Generate macro snapshot with summary
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 7.3 Implement SectorIdentificationProcessor (Step 3)


    - Fetch sector data from Yahoo Finance and industry reports
    - Use analysis engine to score and rank sectors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 7.4 Implement StockScreeningProcessor (Step 4)


    - Accept screening filters from user
    - Query Finviz adapter with filters
    - Return stock shortlist with ticker, company name, sector, dividend yield, and PE ratio
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 8. Build step processors for workflow steps 5-8



  - [x] 8.1 Implement FundamentalAnalysisProcessor (Step 5)


    - Fetch filings from SEC EDGAR adapter
    - Fetch snapshots from Morningstar adapter
    - Extract revenue growth, earnings growth, profit margin, debt-to-equity, and free cash flow
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  - [x] 8.2 Implement CompetitivePositionProcessor (Step 6)


    - Fetch company profiles from Reuters and Yahoo Finance adapters
    - Use analysis engine to generate moat analysis
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 8.3 Implement ValuationEvaluationProcessor (Step 7)


    - Fetch valuation data from Simply Wall St adapter
    - Use analysis engine to calculate PE, PB ratios and peer comparison
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 8.4 Implement TechnicalTrendsProcessor (Step 8) - Optional








    - Fetch chart data from TradingView adapter
    - Determine trend direction and moving average crossover
    - Mark as optional step in workflow
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Build step processors for workflow steps 9-12








  - [x] 9.1 Implement AnalystSentimentProcessor (Step 9)


    - Fetch ratings from TipRanks and MarketBeat adapters
    - Use analysis engine to aggregate sentiment
    - Count buy, hold, sell recommendations and calculate average target
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  - [x] 9.2 Implement PositionSizingProcessor (Step 10)


    - Accept portfolio size and risk model inputs
    - Use analysis engine to calculate position sizes
    - Generate buy recommendations with ticker, shares, entry price, and order type
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  - [x] 9.3 Implement MockTradeProcessor (Step 11)


    - Accept broker platform name
    - Simulate trade execution with confirmation ID
    - Generate trade confirmation with mock flag set to true
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [x] 9.4 Implement MonitoringSetupProcessor (Step 12)








    - Accept alert app and review frequency inputs
    - Configure price alerts and earnings review schedule
    - Generate monitoring plan with next review date
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 10. Implement error handling and logging



  - [x] 10.1 Create ErrorHandler class


    - Implement handleError method with error categorization
    - Add retry logic for data source failures
    - Generate user-friendly error messages
    - _Requirements: 2.1, 3.1, 4.5, 5.1, 5.2, 6.1, 6.2, 7.1, 9.1, 9.2_
  - [x] 10.2 Add fallback strategies for missing data


    - Implement cached data fallback for macro conditions
    - Add manual sector selection fallback
    - Handle partial results for stock screening
    - Auto-skip technical analysis if unavailable
    - _Requirements: 2.6, 3.4, 4.6, 8.5_
  - [x] 10.3 Implement audit logging


    - Log all workflow executions with timestamps
    - Track data source access and errors
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_

- [x] 11. Build Next.js API routes




  - [x] 11.1 Create API routes for workflow management


    - app/api/workflows/route.ts - POST to start new workflow
    - app/api/workflows/[sessionId]/route.ts - GET workflow status, DELETE to reset
    - app/api/workflows/[sessionId]/steps/[stepId]/route.ts - POST to execute step
    - app/api/workflows/[sessionId]/skip/[stepId]/route.ts - POST to skip optional step
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 11.2 Add API routes for user profile management


    - app/api/profiles/route.ts - POST to create/update profile
    - app/api/profiles/[userId]/route.ts - GET profile
    - _Requirements: 1.5_
  - [x] 11.3 Create API routes for workflow history


    - app/api/workflows/history/[userId]/route.ts - GET user's workflow sessions
    - app/api/workflows/[sessionId]/data/route.ts - GET all step data for session
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 11.4 Write API integration tests





    - Test complete workflow execution via API routes
    - _Requirements: 1.5, 2.6_

- [x] 12. Build Next.js pages and React components





  - [x] 12.1 Create main workflow page and layout

    - app/workflow/[sessionId]/page.tsx - Main workflow page with step navigation
    - components/WorkflowProgress.tsx - 12-step progress indicator component
    - Set up Tailwind CSS for legacy-style dashboard aesthetics
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 12.2 Build profile setup page and form


    - app/workflow/new/page.tsx - Initial profile setup page
    - components/ProfileForm.tsx - Form with risk tolerance, horizon, capital, goals inputs
    - Add client-side validation with zod
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 12.3 Create market overview components


    - components/MarketOverview.tsx - Display macro snapshot with economic indicators
    - components/MarketTrendIndicator.tsx - Visual market trend indicator
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 12.4 Build sector analysis components


    - components/SectorRankings.tsx - Ranked sectors table with sorting
    - components/SectorCard.tsx - Individual sector display with score and rationale
    - _Requirements: 3.4, 3.5_
  - [x] 12.5 Create stock screener components


    - components/StockScreener.tsx - Filter form and results table
    - components/ScreeningFilters.tsx - Market cap, dividend yield, PE ratio, sector filters
    - components/StockTable.tsx - Sortable stock shortlist table
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 12.6 Build fundamentals display components


    - components/FundamentalsTable.tsx - Financial metrics table
    - components/GrowthChart.tsx - Revenue and earnings growth visualization
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  - [x] 12.7 Create moat analysis components


    - components/MoatAnalysis.tsx - Competitive advantages breakdown
    - Display patents, brand strength, customer base, cost leadership sections
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 12.8 Build valuation comparison components


    - components/ValuationMetrics.tsx - PE and PB ratios display
    - components/PeerComparison.tsx - Peer comparison chart
    - _Requirements: 7.3, 7.4, 7.5, 7.6_
  - [x] 12.9 Create optional technical charts components


    - components/TechnicalChart.tsx - Price chart with trend indicators
    - Integrate lightweight-charts or similar library
    - _Requirements: 8.3, 8.4, 8.5_
  - [x] 12.10 Build analyst consensus components


    - components/AnalystRatings.tsx - Rating distribution visualization
    - components/PriceTarget.tsx - Average target price display
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_
  - [x] 12.11 Create position sizing components


    - components/PositionSizing.tsx - Recommended allocations table
    - components/PortfolioBreakdown.tsx - Portfolio percentage visualization
    - _Requirements: 10.3, 10.4, 10.5, 10.6_
  - [x] 12.12 Build trade confirmation components


    - components/TradeConfirmation.tsx - Mock trade summary with disclaimer
    - Display confirmation ID and execution details
    - _Requirements: 11.2, 11.3, 11.4_
  - [x] 12.13 Create monitoring dashboard components


    - components/MonitoringDashboard.tsx - Alert status and review schedule
    - components/AlertConfig.tsx - Alert configuration interface
    - _Requirements: 12.3, 12.4, 12.5_

- [x] 13. Add compliance and educational features

















  - [x] 13.1 Implement disclaimer system


    - Display educational disclaimer on every page
    - Require user acknowledgment before starting workflow
    - Add "mock only" labels to trade execution
    - _Requirements: 11.2, 11.3, 11.4_
  - [x] 13.2 Add data source attribution














    - Display data source names and timestamps
    - Add links to original sources where appropriate
    - Include data freshness indicators
    - _Requirements: 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7_
  - [x] 13.3 Create help and documentation


    - Add tooltips explaining each metric
    - Create glossary of investment terms
    - Add step-by-step guidance for each workflow stage
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_

- [x] 14. Implement caching and performance optimization





  - [x] 14.1 Use Next.js caching for data fetching


    - Configure fetch cache with revalidate times: macro data (1 hour), sector data (24 hours), quotes (15 minutes)
    - Use React Server Components for automatic caching where appropriate
    - Implement unstable_cache for custom caching needs
    - _Requirements: 2.6, 3.4, 4.6_
  - [x] 14.2 Optimize data fetching with parallel requests


    - Use Promise.all() to fetch multiple data sources concurrently in API routes
    - Implement request batching for stock data
    - _Requirements: 2.1, 3.1, 3.2, 4.5, 5.1, 5.2, 6.1, 6.2, 7.1, 9.1, 9.2_
  - [x] 14.3 Add database indexing in Prisma schema


    - Add indexes on sessionId, userId, and ticker fields
    - Optimize query performance for workflow history
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_

- [x] 15. Set up deployment and configuration


















  - [x] 15.1 Create environment configuration


    - Set up .env.local and .env.example with API keys and database URL
    - Add configuration for data source URLs and rate limits
    - Configure Prisma database connection
    - _Requirements: 2.1, 3.1, 4.5, 5.1, 5.2, 6.1, 6.2, 7.1, 9.1, 9.2_
  - [x] 15.2 Run Prisma migrations




    - Execute prisma migrate dev to create database tables
    - Add seed script for test data (optional)
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 15.3 Configure for Vercel deployment




    - Add vercel.json for environment variables and build settings
    - Configure PostgreSQL connection for production (Vercel Postgres or external)
    - Set up Vercel Cron for monitoring alerts (optional)
    - _Requirements: 1.5, 2.6, 3.4, 4.6, 5.8, 6.7, 7.6, 8.5, 9.7, 10.6, 11.4, 12.5_
  - [x] 15.4 Create deployment documentation









    - Write setup instructions for local development
    - Document API key requirements and data source setup
    - Add troubleshooting guide
    - _Requirements: 1.5, 2.6_
