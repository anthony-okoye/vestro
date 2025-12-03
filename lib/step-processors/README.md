# Step Processors

This directory contains the implementation of all 12 workflow step processors.

Each processor extends `BaseStepProcessor` and implements the specific logic for its step:

1. ProfileDefinitionProcessor - Step 1
2. MarketConditionsProcessor - Step 2
3. SectorIdentificationProcessor - Step 3
4. StockScreeningProcessor - Step 4
5. FundamentalAnalysisProcessor - Step 5
6. CompetitivePositionProcessor - Step 6
7. ValuationEvaluationProcessor - Step 7
8. TechnicalTrendsProcessor - Step 8 (Optional)
9. AnalystSentimentProcessor - Step 9
10. PositionSizingProcessor - Step 10
11. MockTradeProcessor - Step 11
12. MonitoringSetupProcessor - Step 12

Processors will be implemented in subsequent tasks.
