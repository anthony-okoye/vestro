# UI Components

This directory contains all React components for the ResurrectionStockPicker UI.

Components will be organized by feature and include:

## Workflow Components
- WorkflowProgress - 12-step progress indicator
- ProfileForm - Investment profile setup form

## Market Analysis Components
- MarketOverview - Macro economic indicators
- MarketTrendIndicator - Visual trend indicator
- SectorRankings - Ranked sectors table
- SectorCard - Individual sector display

## Stock Analysis Components
- StockScreener - Filter form and results
- ScreeningFilters - Market cap, dividend, PE filters
- StockTable - Sortable stock shortlist
- FundamentalsTable - Financial metrics
- GrowthChart - Revenue/earnings visualization

## Valuation Components
- MoatAnalysis - Competitive advantages
- ValuationMetrics - PE and PB ratios
- PeerComparison - Peer comparison chart
- TechnicalChart - Price chart with indicators

## Trading Components
- AnalystRatings - Rating distribution
- PriceTarget - Average target display
- PositionSizing - Recommended allocations
- PortfolioBreakdown - Portfolio visualization
- TradeConfirmation - Mock trade summary
- MonitoringDashboard - Alert status and schedule
- AlertConfig - Alert configuration

## Utility Components
- DataSourceAttribution - Display data sources with timestamps and freshness indicators
- DisclaimerBanner - Educational disclaimer display
- DisclaimerModal - Modal disclaimer for user acknowledgment

## Help & Documentation Components
- Tooltip - Contextual help tooltips for metrics and terms
- Glossary - Comprehensive investment terms glossary with search and filtering
- StepGuidance - Detailed guidance for each workflow step
- HelpButton - Quick access help menu with resources and tips

## Implementation Status

✅ All components have been implemented with:
- TypeScript type safety
- Legacy-style dashboard aesthetics
- Client-side interactivity where needed
- Educational disclaimers
- Responsive design
- Proper error handling
- Data source attribution with timestamps and freshness indicators
- Comprehensive help and documentation system
- Tooltips for metric explanations
- Step-by-step guidance for each workflow stage

## Design System

All components follow a consistent design language:
- **Bold borders**: 2px standard, 4px for emphasis
- **Monospace fonts**: For data values and metrics
- **Color coding**: Green (positive), Red (negative), Blue (neutral), Yellow (warnings)
- **Panel structure**: White backgrounds with dark borders
- **Clear hierarchy**: Headers, metrics, and detailed content sections

## Usage

Import components in your Next.js pages:

```tsx
import WorkflowProgress from '@/components/WorkflowProgress';
import ProfileForm from '@/components/ProfileForm';
import MarketOverview from '@/components/MarketOverview';
// etc.
```

All components use types from `lib/types/index.ts` for type safety.
