'use client';

import DataSourceAttribution from './DataSourceAttribution';

interface PeerData {
  ticker: string;
  companyName: string;
  peRatio: number;
  pbRatio: number;
  isTarget?: boolean;
}

interface PeerComparisonProps {
  targetTicker: string;
  peers: PeerData[];
  timestamp?: Date | string;
}

export default function PeerComparison({ targetTicker, peers, timestamp }: PeerComparisonProps) {
  const maxPE = Math.max(...peers.map(p => p.peRatio), 50);
  const maxPB = Math.max(...peers.map(p => p.pbRatio), 10);

  const getBarWidth = (value: number, max: number) => {
    return (value / max) * 100;
  };

  const sortedByPE = [...peers].sort((a, b) => a.peRatio - b.peRatio);
  const sortedByPB = [...peers].sort((a, b) => a.pbRatio - b.pbRatio);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Peer Comparison: {targetTicker}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Valuation metrics compared to industry peers
        </p>
      </div>

      {/* P/E Ratio Comparison */}
      <div className="bg-white border-2 border-gray-800 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Price-to-Earnings (P/E) Ratio Comparison
        </h4>
        <div className="space-y-3">
          {sortedByPE.map((peer) => (
            <div key={peer.ticker}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono ${
                    peer.isTarget ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {peer.ticker}
                  </span>
                  {peer.isTarget && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold">
                      TARGET
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    {peer.companyName}
                  </span>
                </div>
                <span className="font-mono font-bold text-gray-900">
                  {peer.peRatio.toFixed(2)}x
                </span>
              </div>
              <div className="relative h-6 bg-gray-200 border-2 border-gray-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    peer.isTarget ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  style={{ width: `${getBarWidth(peer.peRatio, maxPE)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* P/B Ratio Comparison */}
      <div className="bg-white border-2 border-gray-800 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Price-to-Book (P/B) Ratio Comparison
        </h4>
        <div className="space-y-3">
          {sortedByPB.map((peer) => (
            <div key={peer.ticker}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono ${
                    peer.isTarget ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {peer.ticker}
                  </span>
                  {peer.isTarget && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold">
                      TARGET
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    {peer.companyName}
                  </span>
                </div>
                <span className="font-mono font-bold text-gray-900">
                  {peer.pbRatio.toFixed(2)}x
                </span>
              </div>
              <div className="relative h-6 bg-gray-200 border-2 border-gray-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    peer.isTarget ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  style={{ width: `${getBarWidth(peer.pbRatio, maxPB)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-gray-800 p-4">
          <h5 className="text-sm font-bold text-gray-900 mb-3">P/E Statistics</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-mono font-bold">
                {(peers.reduce((sum, p) => sum + p.peRatio, 0) / peers.length).toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Median:</span>
              <span className="font-mono font-bold">
                {sortedByPE[Math.floor(sortedByPE.length / 2)].peRatio.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Range:</span>
              <span className="font-mono font-bold">
                {sortedByPE[0].peRatio.toFixed(2)}x - {sortedByPE[sortedByPE.length - 1].peRatio.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-800 p-4">
          <h5 className="text-sm font-bold text-gray-900 mb-3">P/B Statistics</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-mono font-bold">
                {(peers.reduce((sum, p) => sum + p.pbRatio, 0) / peers.length).toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Median:</span>
              <span className="font-mono font-bold">
                {sortedByPB[Math.floor(sortedByPB.length / 2)].pbRatio.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Range:</span>
              <span className="font-mono font-bold">
                {sortedByPB[0].pbRatio.toFixed(2)}x - {sortedByPB[sortedByPB.length - 1].pbRatio.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-blue-50 border-2 border-blue-600 p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">
          Relative Valuation Analysis
        </h4>
        <p className="text-sm text-blue-800">
          Compare {targetTicker}&apos;s valuation multiples to its peers to identify whether it&apos;s 
          trading at a premium or discount relative to similar companies in the industry.
        </p>
      </div>

      {/* Data Source Attribution */}
      {timestamp && (
        <DataSourceAttribution
          sources={[
            {
              name: 'Simply Wall St',
              url: 'https://simplywall.st/',
              timestamp: timestamp,
              description: 'Peer valuation data and comparisons'
            }
          ]}
          compact={true}
        />
      )}
    </div>
  );
}
