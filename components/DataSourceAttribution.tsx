interface DataSource {
  name: string;
  url?: string;
  timestamp?: Date | string;
  description?: string;
}

interface DataSourceAttributionProps {
  sources: DataSource[];
  compact?: boolean;
}

export default function DataSourceAttribution({ sources, compact = false }: DataSourceAttributionProps) {
  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFreshnessColor = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / 3600000;

    if (diffHours < 1) return 'text-green-700 bg-green-50';
    if (diffHours < 24) return 'text-blue-700 bg-blue-50';
    if (diffHours < 168) return 'text-yellow-700 bg-yellow-50'; // 1 week
    return 'text-orange-700 bg-orange-50';
  };

  if (compact) {
    return (
      <div className="text-xs text-gray-600 border-t border-gray-300 pt-2 mt-2">
        <p className="font-bold mb-1">Data Sources:</p>
        <div className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <span key={index} className="inline-flex items-center gap-1">
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {source.name}
                </a>
              ) : (
                <span>{source.name}</span>
              )}
              {source.timestamp && (
                <span className={`px-1 py-0.5 rounded text-xs ${getFreshnessColor(source.timestamp)}`}>
                  {formatTimestamp(source.timestamp)}
                </span>
              )}
              {index < sources.length - 1 && <span className="text-gray-400">•</span>}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border-2 border-gray-300 p-4 mt-4">
      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span>📊</span>
        <span>Data Sources</span>
      </h4>
      <div className="space-y-3">
        {sources.map((source, index) => (
          <div key={index} className="bg-white border border-gray-300 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-bold text-gray-900 mb-1">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {source.name}
                      <span className="text-xs">↗</span>
                    </a>
                  ) : (
                    source.name
                  )}
                </div>
                {source.description && (
                  <p className="text-xs text-gray-600">{source.description}</p>
                )}
              </div>
              {source.timestamp && (
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded font-bold ${getFreshnessColor(source.timestamp)}`}>
                    {formatTimestamp(source.timestamp)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-3 italic">
        Always verify critical information from original sources before making investment decisions.
      </p>
    </div>
  );
}
