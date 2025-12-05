'use client';

import { useState } from 'react';

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
  onUpdatePosition?: (ticker: string, shares: number) => void;
}

export default function PositionSizing({
  recommendations,
  portfolioSize,
  riskModel,
  onUpdatePosition
}: PositionSizingProps) {
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  
  const totalInvestment = recommendations.reduce((sum, rec) => sum + rec.totalInvestment, 0);
  const cashRemaining = portfolioSize - totalInvestment;
  const investmentPercentage = (totalInvestment / portfolioSize) * 100;

  const getRiskModelConfig = (model: string) => {
    const configs = {
      conservative: {
        label: 'Conservative',
        icon: '🛡️',
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        description: 'Lower risk, diversified positions'
      },
      balanced: {
        label: 'Balanced',
        icon: '⚖️',
        gradient: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-400',
        description: 'Moderate risk, balanced allocation'
      },
      aggressive: {
        label: 'Aggressive',
        icon: '🔥',
        gradient: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        textColor: 'text-orange-400',
        description: 'Higher risk, concentrated positions'
      }
    };
    return configs[model as keyof typeof configs] || configs.balanced;
  };

  const riskConfig = getRiskModelConfig(riskModel);

  const handleEditStart = (ticker: string, currentShares: number) => {
    setEditingTicker(ticker);
    setEditValue(currentShares);
  };

  const handleEditSave = (ticker: string) => {
    if (onUpdatePosition) {
      onUpdatePosition(ticker, editValue);
    }
    setEditingTicker(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-green-500/20 flex items-center justify-center">
            <span className="text-3xl ghost-float">🧪</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-haunted">
              Position Brewing
            </h3>
            <p className="text-sm text-gray-500">
              Calculated allocations based on your risk spirit
            </p>
          </div>
        </div>
        
        {/* Risk Model Badge */}
        <div className={`px-4 py-3 rounded-xl ${riskConfig.bgColor} border ${riskConfig.borderColor} flex items-center gap-3`}>
          <span className="text-2xl">{riskConfig.icon}</span>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Risk Model</div>
            <div className={`text-lg font-bold ${riskConfig.textColor}`}>
              {riskConfig.label}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">💎 Portfolio Size</div>
          <div className="metric-value text-gray-200">
            ${portfolioSize.toLocaleString()}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">🧪 Total Investment</div>
          <div className="metric-value text-purple-400">
            ${totalInvestment.toLocaleString()}
          </div>
          <div className="mt-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-500"
                style={{ width: `${Math.min(investmentPercentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{investmentPercentage.toFixed(1)}% allocated</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">💰 Cash Remaining</div>
          <div className={`metric-value ${cashRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${cashRemaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/80">
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticker</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Shares</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Entry Price</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Order Type</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Investment</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">% Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec, index) => (
                <tr 
                  key={rec.ticker} 
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👻</span>
                      <span className="font-mono font-bold text-blue-400">{rec.ticker}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {editingTicker === rec.ticker ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-700 border border-purple-500 rounded text-right font-mono text-sm"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleEditSave(rec.ticker)}
                          className="text-green-400 hover:text-green-300"
                        >✓</button>
                        <button 
                          onClick={() => setEditingTicker(null)}
                          className="text-red-400 hover:text-red-300"
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(rec.ticker, rec.sharesToBuy)}
                        className="font-mono text-gray-200 hover:text-purple-400 transition-colors group"
                      >
                        {rec.sharesToBuy.toLocaleString()}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right font-mono text-gray-300 hidden sm:table-cell">
                    ${rec.entryPrice.toFixed(2)}
                  </td>
                  <td className="p-4 text-center hidden md:table-cell">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rec.orderType === 'market'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {rec.orderType === 'market' ? '⚡ Market' : '🎯 Limit'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-gray-200">
                    ${rec.totalInvestment.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-green-500"
                          style={{ width: `${Math.min(rec.portfolioPercentage * 4, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-purple-400">
                        {rec.portfolioPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-800/50 font-bold">
                <td className="p-4 text-gray-300" colSpan={4}>
                  <span className="flex items-center gap-2">
                    <span>🧪</span>
                    TOTAL BREW
                  </span>
                </td>
                <td className="p-4 text-right font-mono text-purple-400">
                  ${totalInvestment.toLocaleString()}
                </td>
                <td className="p-4 text-right font-mono text-purple-400">
                  {investmentPercentage.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Order Type Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
            <span>⚡</span>
            Market Order
          </h4>
          <p className="text-xs text-gray-400">
            Executes immediately at current market price. Best for liquid stocks when 
            you want guaranteed execution.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
            <span>🎯</span>
            Limit Order
          </h4>
          <p className="text-xs text-gray-400">
            Executes only at your specified price or better. Provides price control but 
            may not fill if price doesn&apos;t reach your limit.
          </p>
        </div>
      </div>

      {/* Risk Disclaimer */}
      <div className="alert-warning">
        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
          <span>⚠️</span>
          Position Sizing Considerations
        </h4>
        <ul className="space-y-1 text-xs opacity-80">
          <li>• Recommendations based on your stated risk tolerance and portfolio size</li>
          <li>• Consider diversification across sectors and asset classes</li>
          <li>• Maintain adequate cash reserves for emergencies</li>
          <li>• Review and rebalance your portfolio periodically</li>
        </ul>
      </div>
    </div>
  );
}
