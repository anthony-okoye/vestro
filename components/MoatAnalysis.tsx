import DataSourceAttribution from './DataSourceAttribution';

interface MoatAnalysis {
  ticker: string;
  patents: string;
  brandStrength: string;
  customerBase: string;
  costLeadership: string;
  overallMoatScore?: number;
}

interface MoatAnalysisProps {
  data: MoatAnalysis;
}

export default function MoatAnalysis({ data }: MoatAnalysisProps) {
  const moatCategories = [
    {
      title: 'Patents & Intellectual Property',
      icon: '⚖️',
      content: data.patents,
      color: 'blue'
    },
    {
      title: 'Brand Strength',
      icon: '🏆',
      content: data.brandStrength,
      color: 'purple'
    },
    {
      title: 'Customer Base',
      icon: '👥',
      content: data.customerBase,
      color: 'green'
    },
    {
      title: 'Cost Leadership',
      icon: '💰',
      content: data.costLeadership,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-900' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-600', text: 'text-purple-900' },
      green: { bg: 'bg-green-50', border: 'border-green-600', text: 'text-green-900' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-600', text: 'text-orange-900' }
    };
    return colors[color] || colors.blue;
  };

  const getMoatRating = (score?: number) => {
    if (!score) return { label: 'Not Rated', color: 'gray' };
    if (score >= 80) return { label: 'Wide Moat', color: 'green' };
    if (score >= 60) return { label: 'Narrow Moat', color: 'blue' };
    if (score >= 40) return { label: 'Limited Moat', color: 'yellow' };
    return { label: 'No Moat', color: 'red' };
  };

  const moatRating = getMoatRating(data.overallMoatScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Competitive Position: {data.ticker}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Analysis of sustainable competitive advantages
          </p>
        </div>
        {data.overallMoatScore !== undefined && (
          <div className={`px-4 py-2 border-2 ${
            moatRating.color === 'green' ? 'bg-green-50 border-green-600' :
            moatRating.color === 'blue' ? 'bg-blue-50 border-blue-600' :
            moatRating.color === 'yellow' ? 'bg-yellow-50 border-yellow-600' :
            'bg-red-50 border-red-600'
          }`}>
            <div className="text-xs text-gray-600 uppercase">Overall Rating</div>
            <div className={`text-lg font-bold ${
              moatRating.color === 'green' ? 'text-green-900' :
              moatRating.color === 'blue' ? 'text-blue-900' :
              moatRating.color === 'yellow' ? 'text-yellow-900' :
              'text-red-900'
            }`}>
              {moatRating.label}
            </div>
            <div className="text-xs text-gray-600 font-mono">
              Score: {data.overallMoatScore}/100
            </div>
          </div>
        )}
      </div>

      {/* Moat Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moatCategories.map((category) => {
          const colors = getColorClasses(category.color);
          return (
            <div
              key={category.title}
              className={`${colors.bg} border-2 ${colors.border} p-4`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{category.icon}</span>
                <div className="flex-1">
                  <h4 className={`text-lg font-bold ${colors.text}`}>
                    {category.title}
                  </h4>
                </div>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {category.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Panel */}
      <div className="bg-white border-2 border-gray-800 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-3">
          Competitive Advantage Summary
        </h4>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Key Strengths:</strong> The analysis above identifies the primary sources of 
            competitive advantage that may protect this company from competitors and enable 
            sustainable profitability over time.
          </p>
          <p>
            <strong>Investment Implication:</strong> Companies with wide economic moats tend to 
            maintain pricing power, defend market share, and generate superior returns on invested 
            capital over extended periods.
          </p>
          <p className="text-xs text-gray-600 italic">
            Note: Moat analysis is qualitative and should be considered alongside quantitative 
            financial metrics when making investment decisions.
          </p>
        </div>
      </div>

      {/* Data Source Attribution */}
      <DataSourceAttribution
        sources={[
          {
            name: 'Reuters Company Profiles',
            url: 'https://www.reuters.com/companies',
            timestamp: new Date(),
            description: 'Company profiles and competitive analysis'
          },
          {
            name: 'Yahoo Finance',
            url: 'https://finance.yahoo.com/',
            timestamp: new Date(),
            description: 'Company information and business overview'
          }
        ]}
        compact={true}
      />
    </div>
  );
}
