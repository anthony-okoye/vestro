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
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const totalValue = trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Trade Confirmations
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {brokerPlatform ? `Platform: ${brokerPlatform}` : 'Mock trade execution summary'}
        </p>
      </div>

      {/* MOCK TRADE WARNING */}
      <div className="bg-red-50 border-4 border-red-600 p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">⚠️</span>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-red-900 mb-2">
              MOCK TRADES ONLY - NO REAL EXECUTION
            </h4>
            <div className="space-y-1 text-sm text-red-800">
              <p className="font-bold">
                These are simulated trades for educational purposes only.
              </p>
              <p>
                • No actual securities have been purchased
              </p>
              <p>
                • No money has been transferred or invested
              </p>
              <p>
                • These confirmations are for learning and practice only
              </p>
              <p className="mt-2 font-bold">
                To execute real trades, use your actual brokerage account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Total Trades</div>
          <div className="metric-value">{trades.length}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Shares</div>
          <div className="metric-value">
            {trades.reduce((sum, t) => sum + t.quantity, 0).toLocaleString()}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Value</div>
          <div className="metric-value text-blue-900">
            ${totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Individual Trade Confirmations */}
      <div className="space-y-4">
        {trades.map((trade) => (
          <div key={trade.confirmationId} className="bg-white border-2 border-gray-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900 font-mono">
                  {trade.ticker}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Confirmation ID: <span className="font-mono">{trade.confirmationId}</span>
                </p>
              </div>
              {trade.isMock && (
                <div className="px-3 py-1 bg-red-600 border-2 border-red-800 text-white font-bold">
                  MOCK TRADE
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-600 uppercase mb-1">Quantity</div>
                <div className="text-lg font-bold text-gray-900 font-mono">
                  {trade.quantity.toLocaleString()} shares
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 uppercase mb-1">Price</div>
                <div className="text-lg font-bold text-gray-900 font-mono">
                  ${trade.price.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 uppercase mb-1">Total Value</div>
                <div className="text-lg font-bold text-blue-900 font-mono">
                  ${(trade.quantity * trade.price).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 uppercase mb-1">Status</div>
                <div className="text-lg font-bold text-green-900">
                  ✓ Executed
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-300 text-xs text-gray-600">
              <p>Executed: {formatDate(trade.executedAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border-2 border-blue-600 p-6">
        <h4 className="text-lg font-bold text-blue-900 mb-3">
          Next Steps
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>1. Review Your Positions:</strong> Verify all trade details are correct
          </p>
          <p>
            <strong>2. Set Up Monitoring:</strong> Configure price alerts and review schedules
          </p>
          <p>
            <strong>3. Document Your Thesis:</strong> Record why you made these investments
          </p>
          <p>
            <strong>4. Plan Your Review:</strong> Schedule regular portfolio reviews
          </p>
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-yellow-50 border-2 border-yellow-600 p-4">
        <h4 className="text-sm font-bold text-yellow-900 mb-2">
          📚 Educational Purpose
        </h4>
        <p className="text-xs text-yellow-800">
          This workflow is designed to teach investment research methodology. Before making 
          real investments, consult with a qualified financial advisor and thoroughly understand 
          the risks involved. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
