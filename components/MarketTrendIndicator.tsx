interface MarketTrendIndicatorProps {
  trend: 'bullish' | 'bearish' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export default function MarketTrendIndicator({ 
  trend, 
  size = 'md' 
}: MarketTrendIndicatorProps) {
  const trendConfig = {
    bullish: {
      color: 'bg-green-600',
      borderColor: 'border-green-800',
      textColor: 'text-green-900',
      bgColor: 'bg-green-50',
      icon: '↑',
      label: 'BULLISH'
    },
    bearish: {
      color: 'bg-red-600',
      borderColor: 'border-red-800',
      textColor: 'text-red-900',
      bgColor: 'bg-red-50',
      icon: '↓',
      label: 'BEARISH'
    },
    neutral: {
      color: 'bg-gray-600',
      borderColor: 'border-gray-800',
      textColor: 'text-gray-900',
      bgColor: 'bg-gray-50',
      icon: '→',
      label: 'NEUTRAL'
    }
  };

  const config = trendConfig[trend];

  const sizeClasses = {
    sm: 'text-sm p-2',
    md: 'text-base p-3',
    lg: 'text-lg p-4'
  };

  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} ${sizeClasses[size]} inline-flex items-center gap-2`}>
      <span className={`text-2xl ${config.textColor}`}>
        {config.icon}
      </span>
      <div>
        <div className={`font-bold ${config.textColor} font-mono`}>
          {config.label}
        </div>
        <div className="text-xs text-gray-600">
          Market Trend
        </div>
      </div>
    </div>
  );
}
