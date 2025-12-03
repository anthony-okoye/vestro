import DataSourceAttribution from './DataSourceAttribution';

interface ValuationMetrics {
  ticker: string;
  peRatio: number;
  pbRatio: number;
  vsPeers: string;
  fairValueEstimate?: number;
}

interface ValuationMetricsProps {
  data: ValuationMetrics;
  currentPrice?: number;
}

export default function ValuationMetrics({ data, currentPrice }: ValuationMetricsProps) {
  const getPERating = (pe: number) => {
    if (pe < 0) return { label: 'Negative', color: 'red', desc: 'Company is unprofitable' };
    if (pe < 15) return { label: 'Undervalued', color: 'green', desc: 'Below market average' };
    if (pe < 25) return { label: 'Fair Value', color: 'blue', desc: 'Near market average' };
    if (pe < 40) return { label: 'Expensive', color: 'yellow', desc: 'Above market average' };
    return { label: 'Very Expensive', color: 'red', desc: 'Significantly overvalued' };
  };

  const getPBRating = (pb: number) => {
    if (pb < 1) return { label: 'Undervalued', color: 'green', desc: 'Trading below book value' };
    if (pb < 3) return { label: 'Fair Value', color: 'blue', desc: 'Reasonable valuation' };
    if (pb < 5) return { label: 'Expensive', color: 'yellow', desc: 'Premium valuation' };
    return { label: 'Very Expensive', color: 'red', desc: 'High premium to book' };
  };

  const peRating = getPERating(data.peRatio);
  const pbRating = getPBRating(data.pbRatio);

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-50 border-green-600 text-green-900',
      blue: 'bg-blue-50 border-blue-600 text-blue-900',
      yellow: 'bg-yellow-50 border-yellow-600 text-yellow-900',
      red: 'bg-red-50 border-red-600 text-red-900'
    };
    return colors[color] || colors.blue;
  };

  const calculateUpside = () => {
    if (!data.fairValueEstimate || !currentPrice) return null;
    const upside = ((data.fairValueEstimate - currentPrice) / currentPrice) * 100;
    return upside;
  };

  const upside = calculateUpside();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Valuation Analysis: {data.ticker}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Price multiples and peer comparison
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* P/E Ratio */}
        <div className="bg-white border-2 border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
                Price-to-Earnings Ratio
              </div>
              <div className="text-4xl font-bold text-gray-900 font-mono">
                {data.peRatio.toFixed(2)}x
              </div>
            </div>
            <div className={`px-3 py-1 border-2 text-sm font-bold ${getColorClasses(peRating.color)}`}>
              {peRating.label}
            </div>
          </div>
          <p className="text-sm text-gray-700">
            {peRating.desc}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600">
            P/E Ratio = Stock Price ÷ Earnings Per Share
          </div>
        </div>

        {/* P/B Ratio */}
        <div className="bg-white border-2 border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
                Price-to-Book Ratio
              </div>
              <div className="text-4xl font-bold text-gray-900 font-mono">
                {data.pbRatio.toFixed(2)}x
              </div>
            </div>
            <div className={`px-3 py-1 border-2 text-sm font-bold ${getColorClasses(pbRating.color)}`}>
              {pbRating.label}
            </div>
          </div>
          <p className="text-sm text-gray-700">
            {pbRating.desc}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600">
            P/B Ratio = Stock Price ÷ Book Value Per Share
          </div>
        </div>
      </div>

      {/* Fair Value Estimate */}
      {data.fairValueEstimate && currentPrice && (
        <div className="bg-white border-2 border-gray-800 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            Fair Value Estimate
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600 uppercase mb-1">Current Price</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 uppercase mb-1">Fair Value</div>
              <div className="text-2xl font-bold text-blue-900 font-mono">
                ${data.fairValueEstimate.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 uppercase mb-1">Upside/Downside</div>
              <div className={`text-2xl font-bold font-mono ${
                upside && upside > 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {upside && upside > 0 ? '+' : ''}{upside?.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Peer Comparison */}
      <div className="bg-blue-50 border-2 border-blue-600 p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">
          Peer Comparison
        </h4>
        <p className="text-sm text-blue-800 leading-relaxed">
          {data.vsPeers}
        </p>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-white border-2 border-gray-800 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">
          Valuation Interpretation Guide
        </h4>
        <div className="space-y-2 text-xs text-gray-700">
          <p>
            <strong>P/E Ratio:</strong> Lower ratios may indicate undervaluation or slower growth expectations. 
            Higher ratios suggest premium valuations or strong growth prospects.
          </p>
          <p>
            <strong>P/B Ratio:</strong> Ratios below 1.0 suggest the stock trades below its book value. 
            Higher ratios are common for asset-light businesses with strong intangibles.
          </p>
          <p>
            <strong>Context Matters:</strong> Compare these metrics to industry peers and historical averages 
            for meaningful insights.
          </p>
        </div>
      </div>

      {/* Data Source Attribution */}
      <DataSourceAttribution
        sources={[
          {
            name: 'Simply Wall St',
            url: 'https://simplywall.st/',
            timestamp: new Date(),
            description: 'Valuation metrics and peer comparison data'
          }
        ]}
        compact={true}
      />
    </div>
  );
}
