interface SectorCardProps {
  sectorName: string;
  score: number;
  rationale: string;
  rank: number;
  dataPoints?: {
    growthRate?: number;
    marketCap?: number;
    momentum?: number;
  };
}

export default function SectorCard({
  sectorName,
  score,
  rationale,
  rank,
  dataPoints
}: SectorCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-600 border-green-800 text-white';
    if (score >= 60) return 'bg-blue-600 border-blue-800 text-white';
    if (score >= 40) return 'bg-yellow-600 border-yellow-800 text-white';
    return 'bg-gray-600 border-gray-800 text-white';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="bg-white border-2 border-gray-800 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getRankBadge(rank)}</span>
            <h4 className="text-lg font-bold text-gray-900">
              {sectorName}
            </h4>
          </div>
        </div>
        <div className={`px-3 py-1 border-2 font-bold text-sm ${getScoreColor(score)}`}>
          {score.toFixed(0)}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
        {rationale}
      </p>

      {dataPoints && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-300">
          {dataPoints.growthRate !== undefined && (
            <div>
              <div className="text-xs text-gray-600">Growth</div>
              <div className="text-sm font-bold text-gray-900 font-mono">
                {dataPoints.growthRate.toFixed(1)}%
              </div>
            </div>
          )}
          {dataPoints.marketCap !== undefined && (
            <div>
              <div className="text-xs text-gray-600">Market Cap</div>
              <div className="text-sm font-bold text-gray-900 font-mono">
                ${(dataPoints.marketCap / 1e9).toFixed(1)}B
              </div>
            </div>
          )}
          {dataPoints.momentum !== undefined && (
            <div>
              <div className="text-xs text-gray-600">Momentum</div>
              <div className="text-sm font-bold text-gray-900 font-mono">
                {dataPoints.momentum.toFixed(1)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
