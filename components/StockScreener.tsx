'use client';

import { useState } from 'react';
import ScreeningFilters from './ScreeningFilters';
import StockTable from './StockTable';
import DataSourceAttribution from './DataSourceAttribution';

interface StockCandidate {
  ticker: string;
  companyName: string;
  sector: string;
  dividendYield: number;
  peRatio: number;
  marketCap: 'large' | 'mid' | 'small';
}

interface StockScreenerProps {
  sessionId: string;
  initialStocks?: StockCandidate[];
}

export default function StockScreener({ sessionId, initialStocks = [] }: StockScreenerProps) {
  const [filters, setFilters] = useState<any>({});
  const [stocks, setStocks] = useState<StockCandidate[]>(initialStocks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyFilters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${sessionId}/steps/4`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error('Failed to screen stocks');
      }

      const result = await response.json();
      
      if (result.stocks) {
        setStocks(result.stocks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ScreeningFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
      />

      {isLoading && (
        <div className="bg-blue-50 border-2 border-blue-600 p-4 text-center">
          <p className="text-blue-900 font-bold">Screening stocks...</p>
          <p className="text-sm text-blue-800 mt-1">This may take a moment</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-600 p-4">
          <p className="text-red-900 font-bold">Error</p>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!isLoading && stocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Stock Shortlist
          </h3>
          <StockTable stocks={stocks} />
          
          <DataSourceAttribution
            sources={[
              {
                name: 'Finviz Stock Screener',
                url: 'https://finviz.com/screener.ashx',
                timestamp: new Date(),
                description: 'Stock screening and filtering data'
              }
            ]}
            compact={true}
          />
        </div>
      )}

      {!isLoading && stocks.length === 0 && !error && (
        <div className="bg-gray-50 border-2 border-gray-300 p-8 text-center">
          <p className="text-gray-600">
            Configure your filters and click &quot;Apply Filters&quot; to screen stocks.
          </p>
        </div>
      )}
    </div>
  );
}
