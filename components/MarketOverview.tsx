import MarketTrendIndicator from './MarketTrendIndicator';
import DataSourceAttribution from './DataSourceAttribution';

interface MacroSnapshot {
  interestRate: number;
  inflationRate: number;
  unemploymentRate: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  fetchedAt: Date | string;
}

interface MarketOverviewProps {
  data: MacroSnapshot;
}

export default function MarketOverview({ data }: MarketOverviewProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Trend Indicator */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Market Conditions
          </h3>
          <p className="text-xs text-gray-600 font-mono">
            Updated: {formatDate(data.fetchedAt)}
          </p>
        </div>
        <MarketTrendIndicator trend={data.marketTrend} size="lg" />
      </div>

      {/* Economic Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Interest Rate */}
        <div className="metric-card">
          <div className="metric-label">Interest Rate</div>
          <div className="metric-value">{formatPercentage(data.interestRate)}</div>
          <div className="text-xs text-gray-600 mt-2">
            Federal Reserve Rate
          </div>
        </div>

        {/* Inflation Rate */}
        <div className="metric-card">
          <div className="metric-label">Inflation Rate</div>
          <div className="metric-value">{formatPercentage(data.inflationRate)}</div>
          <div className="text-xs text-gray-600 mt-2">
            Consumer Price Index
          </div>
        </div>

        {/* Unemployment Rate */}
        <div className="metric-card">
          <div className="metric-label">Unemployment Rate</div>
          <div className="metric-value">{formatPercentage(data.unemploymentRate)}</div>
          <div className="text-xs text-gray-600 mt-2">
            Labor Market Health
          </div>
        </div>
      </div>

      {/* Summary Analysis */}
      <div className="bg-blue-50 border-2 border-blue-600 p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">
          Market Summary
        </h4>
        <p className="text-sm text-blue-800 leading-relaxed">
          {data.summary}
        </p>
      </div>

      {/* Data Source Attribution */}
      <DataSourceAttribution
        sources={[
          {
            name: 'Federal Reserve Economic Data (FRED)',
            url: 'https://fred.stlouisfed.org/',
            timestamp: data.fetchedAt,
            description: 'Interest rate and economic indicators'
          },
          {
            name: 'CNBC Economy',
            url: 'https://www.cnbc.com/economy/',
            timestamp: data.fetchedAt,
            description: 'Market trends and economic news'
          },
          {
            name: 'Bloomberg Markets',
            url: 'https://www.bloomberg.com/markets',
            timestamp: data.fetchedAt,
            description: 'Global market data and analysis'
          }
        ]}
        compact={true}
      />
    </div>
  );
}
