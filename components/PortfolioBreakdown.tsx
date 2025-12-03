'use client';

interface BuyRecommendation {
  ticker: string;
  sharesToBuy: number;
  entryPrice: number;
  orderType: 'market' | 'limit';
  totalInvestment: number;
  portfolioPercentage: number;
}

interface PortfolioBreakdownProps {
  recommendations: BuyRecommendation[];
  portfolioSize: number;
}

export default function PortfolioBreakdown({
  recommendations,
  portfolioSize
}: PortfolioBreakdownProps) {
  const totalInvestment = recommendations.reduce((sum, rec) => sum + rec.totalInvestment, 0);
  const cashPercentage = ((portfolioSize - totalInvestment) / portfolioSize) * 100;

  const colors = [
    'bg-blue-600',
    'bg-green-600',
    'bg-purple-600',
    'bg-orange-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-teal-600',
    'bg-red-600'
  ];

  return (
    <div className="bg-white border-2 border-gray-800 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Portfolio Allocation Breakdown
      </h3>

      {/* Visual Breakdown Bar */}
      <div className="mb-6">
        <div className="flex h-16 border-2 border-gray-800 overflow-hidden">
          {recommendations.map((rec, index) => (
            <div
              key={rec.ticker}
              className={`${colors[index % colors.length]} flex items-center justify-center text-white font-bold text-sm transition-all hover:opacity-80`}
              style={{ width: `${rec.portfolioPercentage}%` }}
              title={`${rec.ticker}: ${rec.portfolioPercentage.toFixed(1)}%`}
            >
              {rec.portfolioPercentage >= 5 && rec.ticker}
            </div>
          ))}
          {cashPercentage > 0 && (
            <div
              className="bg-gray-400 flex items-center justify-center text-white font-bold text-sm"
              style={{ width: `${cashPercentage}%` }}
              title={`Cash: ${cashPercentage.toFixed(1)}%`}
            >
              {cashPercentage >= 5 && 'CASH'}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {recommendations.map((rec, index) => (
          <div key={rec.ticker} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 ${colors[index % colors.length]} border-2 border-gray-800`} />
              <span className="font-bold font-mono text-gray-900">{rec.ticker}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                ${rec.totalInvestment.toLocaleString()}
              </span>
              <span className="font-bold text-gray-900 font-mono min-w-[60px] text-right">
                {rec.portfolioPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
        {cashPercentage > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-400 border-2 border-gray-800" />
              <span className="font-bold text-gray-900">Cash</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                ${(portfolioSize - totalInvestment).toLocaleString()}
              </span>
              <span className="font-bold text-gray-900 font-mono min-w-[60px] text-right">
                {cashPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t-2 border-gray-300 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-600 uppercase mb-1">Number of Positions</div>
          <div className="text-2xl font-bold text-gray-900 font-mono">
            {recommendations.length}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 uppercase mb-1">Invested Capital</div>
          <div className="text-2xl font-bold text-blue-900 font-mono">
            {((totalInvestment / portfolioSize) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Diversification Note */}
      <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-600">
        <p className="text-xs text-blue-800">
          <strong>Diversification:</strong> A well-diversified portfolio typically includes 
          15-30 positions across multiple sectors. Consider your overall asset allocation 
          including bonds, real estate, and other investments.
        </p>
      </div>
    </div>
  );
}
