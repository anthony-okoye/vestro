'use client';

interface ScreeningFiltersProps {
  filters: {
    marketCap?: 'large' | 'mid' | 'small';
    dividendYieldMin?: number;
    peRatioMax?: number;
    sector?: string;
  };
  onChange: (filters: any) => void;
  onApply: () => void;
}

export default function ScreeningFilters({
  filters,
  onChange,
  onApply
}: ScreeningFiltersProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white border-2 border-gray-800 p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Screening Filters
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Market Cap */}
        <div>
          <label className="form-label">Market Capitalization</label>
          <select
            className="form-input"
            value={filters.marketCap || ''}
            onChange={(e) => handleChange('marketCap', e.target.value || undefined)}
          >
            <option value="">All Sizes</option>
            <option value="large">Large Cap (&gt; $10B)</option>
            <option value="mid">Mid Cap ($2B - $10B)</option>
            <option value="small">Small Cap (&lt; $2B)</option>
          </select>
        </div>

        {/* Sector */}
        <div>
          <label className="form-label">Sector</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., Technology, Healthcare"
            value={filters.sector || ''}
            onChange={(e) => handleChange('sector', e.target.value || undefined)}
          />
        </div>

        {/* Dividend Yield Min */}
        <div>
          <label className="form-label">Minimum Dividend Yield (%)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g., 2.0"
            min="0"
            step="0.1"
            value={filters.dividendYieldMin || ''}
            onChange={(e) =>
              handleChange('dividendYieldMin', e.target.value ? parseFloat(e.target.value) : undefined)
            }
          />
        </div>

        {/* PE Ratio Max */}
        <div>
          <label className="form-label">Maximum P/E Ratio</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g., 25"
            min="0"
            step="0.1"
            value={filters.peRatioMax || ''}
            onChange={(e) =>
              handleChange('peRatioMax', e.target.value ? parseFloat(e.target.value) : undefined)
            }
          />
        </div>
      </div>

      <button
        onClick={onApply}
        className="btn-primary w-full"
      >
        Apply Filters
      </button>
    </div>
  );
}
