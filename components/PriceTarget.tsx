import DataSourceAttribution from './DataSourceAttribution';

interface PriceTargetProps {
  ticker: string;
  currentPrice: number;
  averageTarget: number;
  highTarget?: number;
  lowTarget?: number;
  timestamp?: Date | string;
}

export default function PriceTarget({
  ticker,
  currentPrice,
  averageTarget,
  highTarget,
  lowTarget,
  timestamp
}: PriceTargetProps) {
  const upside = ((averageTarget - currentPrice) / currentPrice) * 100;

  const minPrice = lowTarget || Math.min(currentPrice, averageTarget) * 0.8;
  const maxPrice = highTarget || Math.max(currentPrice, averageTarget) * 1.2;
  const range = maxPrice - minPrice;

  const getPosition = (price: number) => {
    return ((price - minPrice) / range) * 100;
  };

  const currentPosition = getPosition(currentPrice);
  const targetPosition = getPosition(averageTarget);
  const lowPosition = lowTarget ? getPosition(lowTarget) : null;
  const highPosition = highTarget ? getPosition(highTarget) : null;

  return (
    <div className="bg-white border-2 border-gray-800 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Price Target Analysis: {ticker}
      </h3>

      {/* Price Range Visualization */}
      <div className="mb-6">
        <div className="relative h-16 bg-gray-200 border-2 border-gray-800">
          {/* Target Range (if available) */}
          {lowPosition !== null && highPosition !== null && (
            <div
              className="absolute h-full bg-blue-200 opacity-50"
              style={{
                left: `${lowPosition}%`,
                width: `${highPosition - lowPosition}%`
              }}
            />
          )}

          {/* Current Price Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-gray-900"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="text-xs text-gray-600 font-bold">Current</div>
              <div className="text-sm font-mono font-bold text-gray-900">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Average Target Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-blue-600"
            style={{ left: `${targetPosition}%` }}
          >
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="text-xs text-blue-600 font-bold">Target</div>
              <div className="text-sm font-mono font-bold text-blue-900">
                ${averageTarget.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Low Target Marker */}
          {lowTarget && lowPosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-400"
              style={{ left: `${lowPosition}%` }}
            />
          )}

          {/* High Target Marker */}
          {highTarget && highPosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-green-400"
              style={{ left: `${highPosition}%` }}
            />
          )}
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-gray-600 mt-12">
          <span>${minPrice.toFixed(0)}</span>
          <span>${maxPrice.toFixed(0)}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {lowTarget && (
          <div className="text-center p-3 bg-red-50 border-2 border-red-300">
            <div className="text-xs text-gray-600 uppercase mb-1">Low Target</div>
            <div className="text-lg font-bold text-red-900 font-mono">
              ${lowTarget.toFixed(2)}
            </div>
          </div>
        )}

        <div className="text-center p-3 bg-blue-50 border-2 border-blue-600">
          <div className="text-xs text-gray-600 uppercase mb-1">Avg Target</div>
          <div className="text-lg font-bold text-blue-900 font-mono">
            ${averageTarget.toFixed(2)}
          </div>
        </div>

        {highTarget && (
          <div className="text-center p-3 bg-green-50 border-2 border-green-300">
            <div className="text-xs text-gray-600 uppercase mb-1">High Target</div>
            <div className="text-lg font-bold text-green-900 font-mono">
              ${highTarget.toFixed(2)}
            </div>
          </div>
        )}

        <div className={`text-center p-3 border-2 ${
          upside > 0 ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'
        }`}>
          <div className="text-xs text-gray-600 uppercase mb-1">Upside</div>
          <div className={`text-lg font-bold font-mono ${
            upside > 0 ? 'text-green-900' : 'text-red-900'
          }`}>
            {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="mt-4 p-3 bg-gray-50 border-2 border-gray-300">
        <p className="text-sm text-gray-800">
          {upside > 20 ? (
            <>
              <strong>Significant Upside:</strong> Analysts see substantial appreciation potential 
              of {upside.toFixed(1)}% to the average target price.
            </>
          ) : upside > 10 ? (
            <>
              <strong>Moderate Upside:</strong> Analysts project {upside.toFixed(1)}% upside 
              to the average target price.
            </>
          ) : upside > 0 ? (
            <>
              <strong>Limited Upside:</strong> Current price is near analyst targets with 
              {upside.toFixed(1)}% potential upside.
            </>
          ) : upside > -10 ? (
            <>
              <strong>At Target:</strong> Current price is at or slightly above analyst targets.
            </>
          ) : (
            <>
              <strong>Above Target:</strong> Current price exceeds analyst targets by 
              {Math.abs(upside).toFixed(1)}%.
            </>
          )}
        </p>
      </div>

      {/* Data Source Attribution */}
      {timestamp && (
        <div className="mt-4">
          <DataSourceAttribution
            sources={[
              {
                name: 'TipRanks',
                url: 'https://www.tipranks.com/',
                timestamp: timestamp,
                description: 'Analyst price targets and ratings'
              },
              {
                name: 'MarketBeat',
                url: 'https://www.marketbeat.com/',
                timestamp: timestamp,
                description: 'Analyst consensus data'
              }
            ]}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}
