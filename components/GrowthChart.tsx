'use client';

import DataSourceAttribution from './DataSourceAttribution';

interface GrowthChartProps {
  revenueGrowth: number;
  earningsGrowth: number;
  ticker: string;
  timestamp?: Date | string;
}

export default function GrowthChart({
  revenueGrowth,
  earningsGrowth,
  ticker,
  timestamp
}: GrowthChartProps) {
  const maxValue = Math.max(Math.abs(revenueGrowth), Math.abs(earningsGrowth), 20);
  const scale = 100 / maxValue;

  const getBarWidth = (value: number) => {
    return Math.abs(value) * scale;
  };

  const getBarColor = (value: number) => {
    if (value >= 15) return 'bg-green-600';
    if (value >= 5) return 'bg-blue-600';
    if (value >= 0) return 'bg-gray-600';
    return 'bg-red-600';
  };

  return (
    <div className="bg-white border-2 border-gray-800 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Growth Comparison: {ticker}
      </h3>

      <div className="space-y-6">
        {/* Revenue Growth Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">
              Revenue Growth (5Y)
            </span>
            <span className="text-sm font-mono font-bold text-gray-900">
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(2)}%
            </span>
          </div>
          <div className="relative h-8 bg-gray-200 border-2 border-gray-800">
            <div
              className={`h-full ${getBarColor(revenueGrowth)} transition-all duration-500`}
              style={{ width: `${getBarWidth(revenueGrowth)}%` }}
            />
          </div>
        </div>

        {/* Earnings Growth Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">
              Earnings Growth (5Y)
            </span>
            <span className="text-sm font-mono font-bold text-gray-900">
              {earningsGrowth >= 0 ? '+' : ''}{earningsGrowth.toFixed(2)}%
            </span>
          </div>
          <div className="relative h-8 bg-gray-200 border-2 border-gray-800">
            <div
              className={`h-full ${getBarColor(earningsGrowth)} transition-all duration-500`}
              style={{ width: `${getBarWidth(earningsGrowth)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t-2 border-gray-300">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 border border-gray-800" />
            <span className="text-gray-700">Excellent (&gt;15%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 border border-gray-800" />
            <span className="text-gray-700">Good (5-15%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 border border-gray-800" />
            <span className="text-gray-700">Modest (0-5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 border border-gray-800" />
            <span className="text-gray-700">Negative (&lt;0%)</span>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-600">
        <p className="text-sm text-blue-900">
          <strong>Analysis:</strong>{' '}
          {revenueGrowth > earningsGrowth + 5
            ? 'Revenue is growing faster than earnings, which may indicate margin compression or increased investment.'
            : earningsGrowth > revenueGrowth + 5
            ? 'Earnings are growing faster than revenue, indicating improving operational efficiency and margin expansion.'
            : 'Revenue and earnings are growing at similar rates, showing consistent operational performance.'}
        </p>
      </div>

      {/* Data Source Attribution */}
      {timestamp && (
        <div className="mt-4">
          <DataSourceAttribution
            sources={[
              {
                name: 'SEC EDGAR',
                url: 'https://www.sec.gov/edgar',
                timestamp: timestamp,
                description: 'Financial filings and historical data'
              },
              {
                name: 'Morningstar',
                url: 'https://www.morningstar.com/',
                timestamp: timestamp,
                description: 'Financial metrics and analysis'
              }
            ]}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}
