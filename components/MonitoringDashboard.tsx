interface MonitoringPlan {
  ticker: string;
  priceAlertsSet: boolean;
  earningsReviewPlanned: boolean;
  reviewFrequency: 'quarterly' | 'yearly';
  nextReviewDate: Date | string;
  alertThresholds?: {
    priceDropPercent?: number;
    priceGainPercent?: number;
  };
}

interface MonitoringDashboardProps {
  plans: MonitoringPlan[];
}

export default function MonitoringDashboard({ plans }: MonitoringDashboardProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNextReviewStatus = (date: Date | string) => {
    const reviewDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const daysUntil = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { label: 'Overdue', color: 'red' };
    if (daysUntil <= 7) return { label: 'Due Soon', color: 'yellow' };
    if (daysUntil <= 30) return { label: 'Upcoming', color: 'blue' };
    return { label: 'Scheduled', color: 'green' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Portfolio Monitoring Dashboard
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Track alerts and review schedules for your positions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-label">Total Positions</div>
          <div className="metric-value">{plans.length}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Alerts Active</div>
          <div className="metric-value text-blue-900">
            {plans.filter(p => p.priceAlertsSet).length}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Reviews Planned</div>
          <div className="metric-value text-green-900">
            {plans.filter(p => p.earningsReviewPlanned).length}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Next Review</div>
          <div className="metric-value text-sm">
            {plans.length > 0 ? formatDate(
              plans.reduce((earliest, plan) => {
                const planDate = typeof plan.nextReviewDate === 'string' 
                  ? new Date(plan.nextReviewDate) 
                  : plan.nextReviewDate;
                return planDate < earliest ? planDate : earliest;
              }, new Date(plans[0].nextReviewDate))
            ) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Monitoring Plans Table */}
      <div className="bg-white border-2 border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 text-left border-b-2 border-gray-900">Ticker</th>
              <th className="p-3 text-center border-b-2 border-gray-900">Price Alerts</th>
              <th className="p-3 text-center border-b-2 border-gray-900">Alert Thresholds</th>
              <th className="p-3 text-center border-b-2 border-gray-900">Review Frequency</th>
              <th className="p-3 text-left border-b-2 border-gray-900">Next Review</th>
              <th className="p-3 text-center border-b-2 border-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const reviewStatus = getNextReviewStatus(plan.nextReviewDate);
              return (
                <tr key={plan.ticker} className="border-b border-gray-300 bg-white hover:bg-gray-50">
                  <td className="p-3 font-bold font-mono text-blue-600">
                    {plan.ticker}
                  </td>
                  <td className="p-3 text-center">
                    {plan.priceAlertsSet ? (
                      <span className="px-2 py-1 bg-green-50 border border-green-600 text-green-900 text-xs font-bold">
                        ✓ ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-50 border border-gray-300 text-gray-600 text-xs">
                        Not Set
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center text-sm">
                    {plan.alertThresholds ? (
                      <div className="space-y-1">
                        {plan.alertThresholds.priceDropPercent && (
                          <div className="text-red-700">
                            🔻 {plan.alertThresholds.priceDropPercent}%
                          </div>
                        )}
                        {plan.alertThresholds.priceGainPercent && (
                          <div className="text-green-700">
                            🔺 {plan.alertThresholds.priceGainPercent}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 bg-blue-50 border border-blue-600 text-blue-900 text-xs font-bold uppercase">
                      {plan.reviewFrequency}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-900">
                    {formatDate(plan.nextReviewDate)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 border text-xs font-bold ${
                      reviewStatus.color === 'red' ? 'bg-red-50 border-red-600 text-red-900' :
                      reviewStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-600 text-yellow-900' :
                      reviewStatus.color === 'blue' ? 'bg-blue-50 border-blue-600 text-blue-900' :
                      'bg-green-50 border-green-600 text-green-900'
                    }`}>
                      {reviewStatus.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review Checklist */}
      <div className="bg-white border-2 border-gray-800 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Portfolio Review Checklist
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-300">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-bold text-gray-900">Review Financial Performance</div>
              <div className="text-sm text-gray-600">
                Check latest earnings reports and financial metrics
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-300">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-bold text-gray-900">Assess Competitive Position</div>
              <div className="text-sm text-gray-600">
                Evaluate changes in market share and competitive landscape
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-300">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-bold text-gray-900">Update Valuation Analysis</div>
              <div className="text-sm text-gray-600">
                Recalculate valuation metrics with current data
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-300">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-bold text-gray-900">Review Investment Thesis</div>
              <div className="text-sm text-gray-600">
                Confirm original reasons for investment still hold true
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-300">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-bold text-gray-900">Rebalance if Needed</div>
              <div className="text-sm text-gray-600">
                Adjust position sizes to maintain target allocation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 border-2 border-blue-600 p-6">
        <h4 className="text-lg font-bold text-blue-900 mb-3">
          Monitoring Best Practices
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Stay Disciplined:</strong> Stick to your review schedule and avoid emotional reactions to short-term price movements
          </p>
          <p>
            <strong>Document Changes:</strong> Keep notes on why you make any portfolio adjustments
          </p>
          <p>
            <strong>Focus on Fundamentals:</strong> Price alerts are useful, but fundamental changes matter more
          </p>
          <p>
            <strong>Long-term Perspective:</strong> Remember your investment horizon and don't overreact to volatility
          </p>
        </div>
      </div>

      {/* Educational Note */}
      <div className="bg-yellow-50 border-2 border-yellow-600 p-4">
        <h4 className="text-sm font-bold text-yellow-900 mb-2">
          📚 Educational Tool
        </h4>
        <p className="text-xs text-yellow-800">
          This monitoring dashboard is for educational purposes. In practice, you would integrate 
          with your broker's alert system or use dedicated portfolio tracking software for real-time 
          monitoring and notifications.
        </p>
      </div>
    </div>
  );
}
