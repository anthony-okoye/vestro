import DataSourceAttribution from './DataSourceAttribution';

interface AnalystSummary {
  ticker: string;
  buyCount: number;
  holdCount: number;
  sellCount: number;
  averageTarget: number;
  consensus: 'strong buy' | 'buy' | 'hold' | 'sell' | 'strong sell';
}

interface AnalystRatingsProps {
  data: AnalystSummary;
  currentPrice?: number;
}

export default function AnalystRatings({ data, currentPrice }: AnalystRatingsProps) {
  const totalRatings = data.buyCount + data.holdCount + data.sellCount;

  const getPercentage = (count: number) => {
    return totalRatings > 0 ? (count / totalRatings) * 100 : 0;
  };

  const buyPercentage = getPercentage(data.buyCount);
  const holdPercentage = getPercentage(data.holdCount);
  const sellPercentage = getPercentage(data.sellCount);

  const getConsensusConfig = (consensus: string) => {
    const configs = {
      'strong buy': {
        color: 'bg-green-600 border-green-800 text-white',
        icon: '🚀',
        label: 'STRONG BUY'
      },
      'buy': {
        color: 'bg-green-500 border-green-700 text-white',
        icon: '👍',
        label: 'BUY'
      },
      'hold': {
        color: 'bg-yellow-500 border-yellow-700 text-white',
        icon: '✋',
        label: 'HOLD'
      },
      'sell': {
        color: 'bg-red-500 border-red-700 text-white',
        icon: '👎',
        label: 'SELL'
      },
      'strong sell': {
        color: 'bg-red-600 border-red-800 text-white',
        icon: '⚠️',
        label: 'STRONG SELL'
      }
    };
    return configs[consensus as keyof typeof configs] || configs.hold;
  };

  const consensusConfig = getConsensusConfig(data.consensus);

  const calculateUpside = () => {
    if (!currentPrice) return null;
    return ((data.averageTarget - currentPrice) / currentPrice) * 100;
  };

  const upside = calculateUpside();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Analyst Consensus: {data.ticker}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Professional analyst ratings and price targets
          </p>
        </div>
        <div className={`px-4 py-2 border-2 ${consensusConfig.color}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{consensusConfig.icon}</span>
            <div>
              <div className="text-xs opacity-80">Consensus</div>
              <div className="text-lg font-bold">{consensusConfig.label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white border-2 border-gray-800 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Rating Distribution ({totalRatings} Analysts)
        </h4>

        {/* Stacked Bar */}
        <div className="mb-6">
          <div className="flex h-12 border-2 border-gray-800 overflow-hidden">
            {buyPercentage > 0 && (
              <div
                className="bg-green-600 flex items-center justify-center text-white font-bold text-sm"
                style={{ width: `${buyPercentage}%` }}
              >
                {buyPercentage >= 10 && `${buyPercentage.toFixed(0)}%`}
              </div>
            )}
            {holdPercentage > 0 && (
              <div
                className="bg-yellow-500 flex items-center justify-center text-white font-bold text-sm"
                style={{ width: `${holdPercentage}%` }}
              >
                {holdPercentage >= 10 && `${holdPercentage.toFixed(0)}%`}
              </div>
            )}
            {sellPercentage > 0 && (
              <div
                className="bg-red-600 flex items-center justify-center text-white font-bold text-sm"
                style={{ width: `${sellPercentage}%` }}
              >
                {sellPercentage >= 10 && `${sellPercentage.toFixed(0)}%`}
              </div>
            )}
          </div>
        </div>

        {/* Rating Counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 border-2 border-green-600">
            <div className="text-3xl font-bold text-green-900 font-mono">
              {data.buyCount}
            </div>
            <div className="text-sm text-green-800 font-bold mt-1">BUY</div>
            <div className="text-xs text-gray-600 mt-1">
              {buyPercentage.toFixed(1)}%
            </div>
          </div>

          <div className="text-center p-4 bg-yellow-50 border-2 border-yellow-600">
            <div className="text-3xl font-bold text-yellow-900 font-mono">
              {data.holdCount}
            </div>
            <div className="text-sm text-yellow-800 font-bold mt-1">HOLD</div>
            <div className="text-xs text-gray-600 mt-1">
              {holdPercentage.toFixed(1)}%
            </div>
          </div>

          <div className="text-center p-4 bg-red-50 border-2 border-red-600">
            <div className="text-3xl font-bold text-red-900 font-mono">
              {data.sellCount}
            </div>
            <div className="text-sm text-red-800 font-bold mt-1">SELL</div>
            <div className="text-xs text-gray-600 mt-1">
              {sellPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Price Target */}
      <div className="bg-white border-2 border-gray-800 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Average Price Target
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentPrice && (
            <div className="text-center p-4 bg-gray-50 border-2 border-gray-300">
              <div className="text-xs text-gray-600 uppercase mb-1">Current Price</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
          )}

          <div className="text-center p-4 bg-blue-50 border-2 border-blue-600">
            <div className="text-xs text-gray-600 uppercase mb-1">Analyst Target</div>
            <div className="text-2xl font-bold text-blue-900 font-mono">
              ${data.averageTarget.toFixed(2)}
            </div>
          </div>

          {upside !== null && (
            <div className={`text-center p-4 border-2 ${
              upside > 0 ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'
            }`}>
              <div className="text-xs text-gray-600 uppercase mb-1">Implied Upside</div>
              <div className={`text-2xl font-bold font-mono ${
                upside > 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-blue-50 border-2 border-blue-600 p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">
          Understanding Analyst Ratings
        </h4>
        <div className="space-y-2 text-xs text-blue-800">
          <p>
            <strong>Consensus Rating:</strong> The overall recommendation based on the distribution 
            of buy, hold, and sell ratings from professional analysts.
          </p>
          <p>
            <strong>Price Target:</strong> The average 12-month price target set by analysts. 
            This represents where analysts expect the stock to trade in one year.
          </p>
          <p>
            <strong>Important Note:</strong> Analyst ratings are opinions and should be considered 
            alongside your own research and investment criteria.
          </p>
        </div>
      </div>

      {/* Data Source Attribution */}
      <DataSourceAttribution
        sources={[
          {
            name: 'TipRanks',
            url: 'https://www.tipranks.com/',
            timestamp: new Date(),
            description: 'Analyst ratings and price targets'
          },
          {
            name: 'MarketBeat',
            url: 'https://www.marketbeat.com/',
            timestamp: new Date(),
            description: 'Analyst consensus data'
          }
        ]}
        compact={true}
      />
    </div>
  );
}
