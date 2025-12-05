'use client';

import { useState } from 'react';

interface TradeConfirmation {
  ticker: string;
  quantity: number;
  price: number;
  confirmationId: string;
  executedAt: Date | string;
  isMock: boolean;
}

interface TradeConfirmationProps {
  trades: TradeConfirmation[];
  brokerPlatform?: string;
}

export default function TradeConfirmation({ trades, brokerPlatform }: TradeConfirmationProps) {
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalValue = trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  const totalShares = trades.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-3xl ghost-float">📜</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-haunted">
            Trade Confirmations
          </h3>
          <p className="text-sm text-gray-500">
            {brokerPlatform ? `Platform: ${brokerPlatform}` : 'Mock trade execution summary'}
          </p>
        </div>
      </div>

      {/* MOCK TRADE WARNING */}
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <span className="text-4xl ghost-float">⚠️</span>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-red-400 mb-3">
              MOCK TRADES ONLY - NO REAL EXECUTION
            </h4>
            <div className="space-y-2 text-sm text-red-300/80">
              <p className="font-semibold">
                These are simulated trades for educational purposes only.
              </p>
              <ul className="space-y-1 ml-4">
                <li>• No actual securities have been purchased</li>
                <li>• No money has been transferred or invested</li>
                <li>• These confirmations are for learning and practice only</li>
              </ul>
              <p className="mt-3 pt-3 border-t border-red-500/20 font-semibold">
                To execute real trades, use your actual brokerage account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <div className="metric-card">
          <div className="metric-label">📊 Total Trades</div>
          <div className="metric-value text-purple-400">{trades.length}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">📈 Total Shares</div>
          <div className="metric-value text-blue-400">
            {totalShares.toLocaleString()}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">💎 Total Value</div>
          <div className="metric-value text-green-400">
            ${totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Individual Trade Confirmations */}
      <div className="space-y-4">
        {trades.map((trade, index) => (
          <div 
            key={trade.confirmationId} 
            className="panel p-0 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Trade Header */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => setExpandedTrade(expandedTrade === trade.confirmationId ? null : trade.confirmationId)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <span className="text-xl">👻</span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold font-mono text-blue-400">
                      {trade.ticker}
                    </span>
                    {trade.isMock && (
                      <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-xs font-semibold text-red-400">
                        MOCK
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    ID: {trade.confirmationId}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-lg font-bold text-green-400 font-mono">
                    ${(trade.quantity * trade.price).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trade.quantity} shares @ ${trade.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-400 transition-transform duration-200" style={{
                    transform: expandedTrade === trade.confirmationId ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <div className={`overflow-hidden transition-all duration-300 ${
              expandedTrade === trade.confirmationId ? 'max-h-96' : 'max-h-0'
            }`}>
              <div className="p-4 pt-0 border-t border-gray-800/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Quantity</div>
                    <div className="text-lg font-bold text-gray-200 font-mono">
                      {trade.quantity.toLocaleString()} shares
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Price</div>
                    <div className="text-lg font-bold text-gray-200 font-mono">
                      ${trade.price.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Total Value</div>
                    <div className="text-lg font-bold text-green-400 font-mono">
                      ${(trade.quantity * trade.price).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="text-lg font-bold text-green-400">Executed</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800/50 text-xs text-gray-500 flex items-center gap-2">
                  <span>🕐</span>
                  Executed: {formatDate(trade.executedAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
          <span>🗺️</span>
          Next Steps
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '👁️', title: 'Review Positions', desc: 'Verify all trade details are correct' },
            { icon: '🔔', title: 'Set Up Monitoring', desc: 'Configure price alerts and schedules' },
            { icon: '📝', title: 'Document Thesis', desc: 'Record why you made these investments' },
            { icon: '📅', title: 'Plan Reviews', desc: 'Schedule regular portfolio reviews' }
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5">
              <span className="text-xl">{step.icon}</span>
              <div>
                <div className="font-semibold text-blue-300">{step.title}</div>
                <div className="text-xs text-gray-500">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="alert-warning">
        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
          <span>📚</span>
          Educational Purpose
        </h4>
        <p className="text-xs opacity-80">
          This workflow is designed to teach investment research methodology. Before making 
          real investments, consult with a qualified financial advisor and thoroughly understand 
          the risks involved. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
