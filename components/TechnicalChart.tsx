'use client';

import DataSourceAttribution from './DataSourceAttribution';

interface TechnicalSignals {
  ticker: string;
  trend: 'upward' | 'downward' | 'sideways';
  maCross: boolean;
  rsi?: number;
  analyzedAt: Date | string;
}

interface TechnicalChartProps {
  data: TechnicalSignals;
}

export default function TechnicalChart({ data }: TechnicalChartProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTrendConfig = (trend: string) => {
    const configs = {
      upward: {
        color: 'green',
        icon: '📈',
        label: 'Upward Trend',
        description: 'Price is in an uptrend with higher highs and higher lows',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-600',
        textColor: 'text-green-900'
      },
      downward: {
        color: 'red',
        icon: '📉',
        label: 'Downward Trend',
        description: 'Price is in a downtrend with lower highs and lower lows',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-600',
        textColor: 'text-red-900'
      },
      sideways: {
        color: 'gray',
        icon: '↔️',
        label: 'Sideways Trend',
        description: 'Price is consolidating without a clear directional trend',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-600',
        textColor: 'text-gray-900'
      }
    };
    return configs[trend as keyof typeof configs] || configs.sideways;
  };

  const getRSIRating = (rsi?: number) => {
    if (!rsi) return null;
    if (rsi >= 70) return { label: 'Overbought', color: 'red', desc: 'May be due for pullback' };
    if (rsi >= 50) return { label: 'Bullish', color: 'green', desc: 'Positive momentum' };
    if (rsi >= 30) return { label: 'Bearish', color: 'yellow', desc: 'Negative momentum' };
    return { label: 'Oversold', color: 'green', desc: 'May be due for bounce' };
  };

  const trendConfig = getTrendConfig(data.trend);
  const rsiRating = getRSIRating(data.rsi);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Technical Analysis: {data.ticker}
          </h3>
          <p className="text-xs text-gray-600 font-mono mt-1">
            Analyzed: {formatDate(data.analyzedAt)}
          </p>
        </div>
        <div className="px-3 py-1 bg-yellow-50 border-2 border-yellow-600">
          <span className="text-xs text-yellow-900 font-bold">OPTIONAL STEP</span>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className={`${trendConfig.bgColor} border-2 ${trendConfig.borderColor} p-6`}>
        <div className="flex items-start gap-4">
          <span className="text-5xl">{trendConfig.icon}</span>
          <div className="flex-1">
            <h4 className={`text-2xl font-bold ${trendConfig.textColor} mb-2`}>
              {trendConfig.label}
            </h4>
            <p className="text-sm text-gray-800">
              {trendConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Moving Average Crossover */}
        <div className="bg-white border-2 border-gray-800 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-3">
            Moving Average Signal
          </h4>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-16 h-16 border-2 flex items-center justify-center text-3xl ${
              data.maCross ? 'bg-green-50 border-green-600' : 'bg-gray-50 border-gray-600'
            }`}>
              {data.maCross ? '✓' : '○'}
            </div>
            <div>
              <div className={`text-lg font-bold ${
                data.maCross ? 'text-green-900' : 'text-gray-900'
              }`}>
                {data.maCross ? 'Bullish Crossover' : 'No Crossover'}
              </div>
              <div className="text-sm text-gray-600">
                {data.maCross 
                  ? 'Short-term MA crossed above long-term MA'
                  : 'No recent moving average crossover'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 border-t border-gray-300 pt-3">
            A bullish crossover occurs when the short-term moving average crosses above the 
            long-term moving average, potentially signaling upward momentum.
          </p>
        </div>

        {/* RSI Indicator */}
        {data.rsi !== undefined && rsiRating && (
          <div className="bg-white border-2 border-gray-800 p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-3">
              Relative Strength Index (RSI)
            </h4>
            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-bold text-gray-900 font-mono">
                  {data.rsi.toFixed(1)}
                </span>
                <span className={`px-2 py-1 border-2 text-sm font-bold ${
                  rsiRating.color === 'green' ? 'bg-green-50 border-green-600 text-green-900' :
                  rsiRating.color === 'red' ? 'bg-red-50 border-red-600 text-red-900' :
                  'bg-yellow-50 border-yellow-600 text-yellow-900'
                }`}>
                  {rsiRating.label}
                </span>
              </div>
              <div className="relative h-4 bg-gray-200 border-2 border-gray-800">
                <div
                  className={`h-full ${
                    data.rsi >= 70 ? 'bg-red-600' :
                    data.rsi >= 50 ? 'bg-green-600' :
                    data.rsi >= 30 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${data.rsi}%` }}
                />
                <div className="absolute top-0 left-[30%] w-0.5 h-full bg-gray-900" />
                <div className="absolute top-0 left-[70%] w-0.5 h-full bg-gray-900" />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0</span>
                <span>30</span>
                <span>70</span>
                <span>100</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              {rsiRating.desc}
            </p>
          </div>
        )}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white border-2 border-gray-800 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Price Chart
        </h4>
        <div className="bg-gray-100 border-2 border-gray-300 h-64 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <p className="text-lg font-bold mb-2">📊 Chart Visualization</p>
            <p className="text-sm">
              Interactive price chart would be displayed here
            </p>
            <p className="text-xs mt-2">
              Integration with TradingView or similar charting library
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border-2 border-yellow-600 p-4">
        <h4 className="text-sm font-bold text-yellow-900 mb-2">
          ⚠️ Technical Analysis Disclaimer
        </h4>
        <p className="text-xs text-yellow-800">
          Technical analysis is one tool among many for investment research. It should be used 
          in conjunction with fundamental analysis and not as the sole basis for investment decisions. 
          Past price patterns do not guarantee future performance.
        </p>
      </div>

      {/* Data Source Attribution */}
      <DataSourceAttribution
        sources={[
          {
            name: 'TradingView',
            url: 'https://www.tradingview.com/',
            timestamp: data.analyzedAt,
            description: 'Technical analysis and charting data'
          }
        ]}
        compact={true}
      />
    </div>
  );
}
