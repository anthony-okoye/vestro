import DataSourceAttribution from './DataSourceAttribution';

interface Fundamentals {
  ticker: string;
  revenueGrowth5y: number;
  earningsGrowth5y: number;
  profitMargin: number;
  debtToEquity: number;
  freeCashFlow: number;
  analyzedAt: Date | string;
}

interface FundamentalsTableProps {
  data: Fundamentals;
}

export default function FundamentalsTable({ data }: FundamentalsTableProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(2);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const getGrowthColor = (value: number) => {
    if (value >= 15) return 'text-green-700 bg-green-50';
    if (value >= 5) return 'text-blue-700 bg-blue-50';
    if (value >= 0) return 'text-gray-700 bg-gray-50';
    return 'text-red-700 bg-red-50';
  };

  const getDebtColor = (ratio: number) => {
    if (ratio < 0.5) return 'text-green-700 bg-green-50';
    if (ratio < 1.0) return 'text-blue-700 bg-blue-50';
    if (ratio < 2.0) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">
          Fundamental Analysis: {data.ticker}
        </h3>
        <span className="text-xs text-gray-600 font-mono">
          Analyzed: {formatDate(data.analyzedAt)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Revenue Growth */}
        <div className="metric-card">
          <div className="metric-label">5-Year Revenue Growth</div>
          <div className={`metric-value ${getGrowthColor(data.revenueGrowth5y)}`}>
            {formatPercentage(data.revenueGrowth5y)}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Compound Annual Growth Rate
          </div>
        </div>

        {/* Earnings Growth */}
        <div className="metric-card">
          <div className="metric-label">5-Year Earnings Growth</div>
          <div className={`metric-value ${getGrowthColor(data.earningsGrowth5y)}`}>
            {formatPercentage(data.earningsGrowth5y)}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Earnings Per Share Growth
          </div>
        </div>

        {/* Profit Margin */}
        <div className="metric-card">
          <div className="metric-label">Profit Margin</div>
          <div className={`metric-value ${getGrowthColor(data.profitMargin)}`}>
            {data.profitMargin.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Net Income / Revenue
          </div>
        </div>

        {/* Debt to Equity */}
        <div className="metric-card">
          <div className="metric-label">Debt-to-Equity Ratio</div>
          <div className={`metric-value ${getDebtColor(data.debtToEquity)}`}>
            {data.debtToEquity.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Total Debt / Shareholder Equity
          </div>
        </div>

        {/* Free Cash Flow */}
        <div className="metric-card">
          <div className="metric-label">Free Cash Flow</div>
          <div className="metric-value">
            {formatCurrency(data.freeCashFlow)}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Operating Cash - CapEx
          </div>
        </div>

        {/* Health Score */}
        <div className="metric-card bg-blue-50">
          <div className="metric-label">Financial Health</div>
          <div className="text-2xl font-bold text-blue-900 font-mono">
            {data.revenueGrowth5y > 10 && data.debtToEquity < 1.0 ? '✓ Strong' : 
             data.revenueGrowth5y > 5 && data.debtToEquity < 2.0 ? '○ Moderate' : 
             '⚠ Weak'}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Overall Assessment
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border-2 border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 text-left border-b-2 border-gray-900">Metric</th>
              <th className="p-3 text-right border-b-2 border-gray-900">Value</th>
              <th className="p-3 text-left border-b-2 border-gray-900">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300 bg-white">
              <td className="p-3 font-bold">Revenue Growth (5Y)</td>
              <td className="p-3 text-right font-mono">{formatPercentage(data.revenueGrowth5y)}</td>
              <td className="p-3 text-sm">
                {data.revenueGrowth5y >= 15 ? 'Excellent growth trajectory' :
                 data.revenueGrowth5y >= 5 ? 'Solid growth' :
                 data.revenueGrowth5y >= 0 ? 'Modest growth' : 'Declining revenue'}
              </td>
            </tr>
            <tr className="border-b border-gray-300 bg-white">
              <td className="p-3 font-bold">Earnings Growth (5Y)</td>
              <td className="p-3 text-right font-mono">{formatPercentage(data.earningsGrowth5y)}</td>
              <td className="p-3 text-sm">
                {data.earningsGrowth5y >= 15 ? 'Strong earnings expansion' :
                 data.earningsGrowth5y >= 5 ? 'Steady earnings growth' :
                 data.earningsGrowth5y >= 0 ? 'Slow earnings growth' : 'Declining earnings'}
              </td>
            </tr>
            <tr className="border-b border-gray-300 bg-white">
              <td className="p-3 font-bold">Profit Margin</td>
              <td className="p-3 text-right font-mono">{data.profitMargin.toFixed(2)}%</td>
              <td className="p-3 text-sm">
                {data.profitMargin >= 20 ? 'Highly profitable' :
                 data.profitMargin >= 10 ? 'Good profitability' :
                 data.profitMargin >= 5 ? 'Moderate profitability' : 'Low margins'}
              </td>
            </tr>
            <tr className="border-b border-gray-300 bg-white">
              <td className="p-3 font-bold">Debt-to-Equity</td>
              <td className="p-3 text-right font-mono">{data.debtToEquity.toFixed(2)}</td>
              <td className="p-3 text-sm">
                {data.debtToEquity < 0.5 ? 'Conservative leverage' :
                 data.debtToEquity < 1.0 ? 'Moderate leverage' :
                 data.debtToEquity < 2.0 ? 'High leverage' : 'Very high debt'}
              </td>
            </tr>
            <tr className="bg-white">
              <td className="p-3 font-bold">Free Cash Flow</td>
              <td className="p-3 text-right font-mono">{formatCurrency(data.freeCashFlow)}</td>
              <td className="p-3 text-sm">
                {data.freeCashFlow > 0 ? 'Positive cash generation' : 'Negative cash flow'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Data Source Attribution */}
      <DataSourceAttribution
        sources={[
          {
            name: 'SEC EDGAR',
            url: 'https://www.sec.gov/edgar/searchedgar/companysearch.html',
            timestamp: data.analyzedAt,
            description: 'Official financial filings and reports'
          },
          {
            name: 'Morningstar',
            url: 'https://www.morningstar.com/',
            timestamp: data.analyzedAt,
            description: 'Financial snapshots and analysis'
          }
        ]}
        compact={true}
      />
    </div>
  );
}
