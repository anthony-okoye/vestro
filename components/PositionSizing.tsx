interface BuyRecommendation {
  ticker: string;
  sharesToBuy: number;
  entryPrice: number;
  orderType: 'market' | 'limit';
  totalInvestment: number;
  portfolioPercentage: number;
}

interface PositionSizingProps {
  recommendations: BuyRecommendation[];
  portfolioSize: number;
  riskModel: 'conservative' | 'balanced' | 'aggressive';
}

export default function PositionSizing({
  recommendations,
  portfolioSize,
  riskModel
}: PositionSizingProps) {
  const totalInvestment = recommendations.reduce((sum, rec) => sum + rec.totalInvestment, 0);
  const cashRemaining = portfolioSize - totalInvestment;

  const getRiskModelConfig = (model: string) => {
    const configs = {
      conservative: {
        label: 'Conservative',
        color: 'blue',
        description: 'Lower risk, diversified positions'
      },
      balanced: {
        label: 'Balanced',
        color: 'green',
        description: 'Moderate risk, balanced allocation'
      },
      aggressive: {
        label: 'Aggressive',
        color: 'orange',
        description: 'Higher risk, concentrated positions'
      }
    };
    return configs[model as keyof typeof configs] || configs.balanced;
  };

  const riskConfig = getRiskModelConfig(riskModel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Position Sizing Recommendations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Calculated allocations based on your risk profile
          </p>
        </div>
        <div className={`px-4 py-2 border-2 ${
          riskConfig.color === 'blue' ? 'bg-blue-50 border-blue-600' :
          riskConfig.color === 'green' ? 'bg-green-50 border-green-600' :
          'bg-orange-50 border-orange-600'
        }`}>
          <div className="text-xs text-gray-600 uppercase">Risk Model</div>
          <div className={`text-lg font-bold ${
            riskConfig.color === 'blue' ? 'text-blue-900' :
            riskConfig.color === 'green' ? 'text-green-900' :
            'text-orange-900'
          }`}>
            {riskConfig.label}
          </div>
          <div className="text-xs text-gray-600">{riskConfig.description}</div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Portfolio Size</div>
          <div className="metric-value">
            ${portfolioSize.toLocaleString()}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Investment</div>
          <div className="metric-value text-blue-900">
            ${totalInvestment.toLocaleString()}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Cash Remaining</div>
          <div className="metric-value text-green-900">
            ${cashRemaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="bg-white border-2 border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 text-left border-b-2 border-gray-900">Ticker</th>
              <th className="p-3 text-right border-b-2 border-gray-900">Shares</th>
              <th className="p-3 text-right border-b-2 border-gray-900">Entry Price</th>
              <th className="p-3 text-center border-b-2 border-gray-900">Order Type</th>
              <th className="p-3 text-right border-b-2 border-gray-900">Investment</th>
              <th className="p-3 text-right border-b-2 border-gray-900">% of Portfolio</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec) => (
              <tr key={rec.ticker} className="border-b border-gray-300 bg-white hover:bg-gray-50">
                <td className="p-3 font-bold font-mono text-blue-600">
                  {rec.ticker}
                </td>
                <td className="p-3 text-right font-mono text-gray-900">
                  {rec.sharesToBuy.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono text-gray-900">
                  ${rec.entryPrice.toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 text-xs font-bold border ${
                    rec.orderType === 'market'
                      ? 'bg-blue-50 border-blue-600 text-blue-900'
                      : 'bg-green-50 border-green-600 text-green-900'
                  }`}>
                    {rec.orderType.toUpperCase()}
                  </span>
                </td>
                <td className="p-3 text-right font-mono font-bold text-gray-900">
                  ${rec.totalInvestment.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono font-bold text-gray-900">
                  {rec.portfolioPercentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td className="p-3" colSpan={4}>TOTAL</td>
              <td className="p-3 text-right font-mono">
                ${totalInvestment.toLocaleString()}
              </td>
              <td className="p-3 text-right font-mono">
                {((totalInvestment / portfolioSize) * 100).toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Order Type Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border-2 border-blue-600 p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2">
            📊 Market Order
          </h4>
          <p className="text-xs text-blue-800">
            Executes immediately at the current market price. Best for liquid stocks when 
            you want to ensure execution.
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-600 p-4">
          <h4 className="text-sm font-bold text-green-900 mb-2">
            🎯 Limit Order
          </h4>
          <p className="text-xs text-green-800">
            Executes only at your specified price or better. Provides price control but 
            may not fill if the price doesn't reach your limit.
          </p>
        </div>
      </div>

      {/* Risk Disclaimer */}
      <div className="bg-yellow-50 border-2 border-yellow-600 p-4">
        <h4 className="text-sm font-bold text-yellow-900 mb-2">
          ⚠️ Position Sizing Considerations
        </h4>
        <div className="space-y-1 text-xs text-yellow-800">
          <p>
            • These recommendations are based on your stated risk tolerance and portfolio size
          </p>
          <p>
            • Consider diversification across sectors and asset classes
          </p>
          <p>
            • Maintain adequate cash reserves for emergencies and opportunities
          </p>
          <p>
            • Review and rebalance your portfolio periodically
          </p>
        </div>
      </div>
    </div>
  );
}
