'use client';

import { useState } from 'react';

interface ScreeningFiltersProps {
  filters: {
    marketCap?: 'large' | 'mid' | 'small';
    dividendYieldMin?: number;
    peRatioMax?: number;
    sector?: string;
  };
  onChange: (filters: ScreeningFiltersProps['filters']) => void;
  onApply: () => void;
}

const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Energy',
  'Industrials',
  'Basic Materials',
  'Real Estate',
  'Utilities',
  'Communication Services'
];

export default function ScreeningFilters({
  filters,
  onChange,
  onApply
}: ScreeningFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number | undefined) => {
    onChange({ ...filters, [field]: value });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const clearFilters = () => {
    onChange({});
  };

  return (
    <div className="panel haunted-border animate-fade-in-up">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl ghost-float">🔮</span>
          <div>
            <h3 className="text-lg font-bold text-haunted">
              Stock Screening Ritual
            </h3>
            <p className="text-xs text-gray-500">
              Filter the spirits that match your criteria
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
              {activeFiltersCount} active
            </span>
          )}
          <button className="text-gray-400 hover:text-white transition-colors">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Filters Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden transition-all duration-500 ${
        isExpanded ? 'mt-6 max-h-[800px] opacity-100' : 'max-h-0 opacity-0 mt-0'
      }`}>
        {/* Market Cap */}
        <div className={`transition-all duration-300 ${focusedField === 'marketCap' ? 'scale-[1.02]' : ''}`}>
          <label className="form-label flex items-center gap-2">
            <span>📊</span>
            Market Capitalization
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'large', label: 'Large', icon: '🏛️', desc: '> $10B' },
              { value: 'mid', label: 'Mid', icon: '🏢', desc: '$2B-$10B' },
              { value: 'small', label: 'Small', icon: '🏠', desc: '< $2B' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('marketCap', filters.marketCap === option.value ? undefined : option.value)}
                className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                  filters.marketCap === option.value
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-purple-500/50 hover:bg-gray-800'
                }`}
              >
                <div className="text-xl mb-1">{option.icon}</div>
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="text-xs opacity-60">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sector */}
        <div className={`transition-all duration-300 ${focusedField === 'sector' ? 'scale-[1.02]' : ''}`}>
          <label className="form-label flex items-center gap-2">
            <span>🏭</span>
            Sector
          </label>
          <div className="relative">
            <select
              className="form-input appearance-none cursor-pointer pr-10"
              value={filters.sector || ''}
              onChange={(e) => handleChange('sector', e.target.value || undefined)}
              onFocus={() => setFocusedField('sector')}
              onBlur={() => setFocusedField(null)}
            >
              <option value="">All Sectors</option>
              {SECTORS.map((sector) => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        </div>

        {/* Dividend Yield Min */}
        <div className={`transition-all duration-300 ${focusedField === 'dividend' ? 'scale-[1.02]' : ''}`}>
          <label className="form-label flex items-center gap-2">
            <span>💰</span>
            Minimum Dividend Yield
          </label>
          <div className="relative">
            <input
              type="number"
              className="form-input pr-12"
              placeholder="e.g., 2.0"
              min="0"
              max="20"
              step="0.1"
              value={filters.dividendYieldMin ?? ''}
              onChange={(e) =>
                handleChange('dividendYieldMin', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              onFocus={() => setFocusedField('dividend')}
              onBlur={() => setFocusedField(null)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">%</span>
          </div>
          {filters.dividendYieldMin !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{ width: `${Math.min((filters.dividendYieldMin / 10) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-green-400 font-mono">{filters.dividendYieldMin}%+</span>
            </div>
          )}
        </div>

        {/* PE Ratio Max */}
        <div className={`transition-all duration-300 ${focusedField === 'pe' ? 'scale-[1.02]' : ''}`}>
          <label className="form-label flex items-center gap-2">
            <span>📈</span>
            Maximum P/E Ratio
          </label>
          <div className="relative">
            <input
              type="number"
              className="form-input pr-12"
              placeholder="e.g., 25"
              min="0"
              max="100"
              step="0.5"
              value={filters.peRatioMax ?? ''}
              onChange={(e) =>
                handleChange('peRatioMax', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              onFocus={() => setFocusedField('pe')}
              onBlur={() => setFocusedField(null)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">x</span>
          </div>
          {filters.peRatioMax !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min((filters.peRatioMax / 50) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-blue-400 font-mono">≤{filters.peRatioMax}x</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex flex-col sm:flex-row gap-3 overflow-hidden transition-all duration-500 ${
        isExpanded ? 'mt-6 max-h-[100px] opacity-100' : 'max-h-0 opacity-0 mt-0'
      }`}>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <span>🧹</span>
            Clear Filters
          </button>
        )}
        <button
          type="button"
          onClick={onApply}
          className="btn-primary flex-1 flex items-center justify-center gap-2 group"
        >
          <span className="transition-transform duration-300 group-hover:rotate-12">🔮</span>
          Summon Stocks
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </button>
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex flex-wrap gap-2">
            {filters.marketCap && (
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300 flex items-center gap-1">
                📊 {filters.marketCap} cap
                <button 
                  onClick={() => handleChange('marketCap', undefined)}
                  className="ml-1 hover:text-white"
                >×</button>
              </span>
            )}
            {filters.sector && (
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300 flex items-center gap-1">
                🏭 {filters.sector}
                <button 
                  onClick={() => handleChange('sector', undefined)}
                  className="ml-1 hover:text-white"
                >×</button>
              </span>
            )}
            {filters.dividendYieldMin !== undefined && (
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-300 flex items-center gap-1">
                💰 ≥{filters.dividendYieldMin}% yield
                <button 
                  onClick={() => handleChange('dividendYieldMin', undefined)}
                  className="ml-1 hover:text-white"
                >×</button>
              </span>
            )}
            {filters.peRatioMax !== undefined && (
              <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs text-orange-300 flex items-center gap-1">
                📈 ≤{filters.peRatioMax}x P/E
                <button 
                  onClick={() => handleChange('peRatioMax', undefined)}
                  className="ml-1 hover:text-white"
                >×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
