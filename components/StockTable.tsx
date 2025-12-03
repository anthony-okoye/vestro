'use client';

import { useState } from 'react';

interface StockCandidate {
  ticker: string;
  companyName: string;
  sector: string;
  dividendYield: number;
  peRatio: number;
  marketCap: 'large' | 'mid' | 'small';
}

interface StockTableProps {
  stocks: StockCandidate[];
  onSelectStock?: (ticker: string) => void;
}

type SortField = 'ticker' | 'companyName' | 'sector' | 'dividendYield' | 'peRatio';
type SortDirection = 'asc' | 'desc';

export default function StockTable({ stocks, onSelectStock }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'ticker':
        comparison = a.ticker.localeCompare(b.ticker);
        break;
      case 'companyName':
        comparison = a.companyName.localeCompare(b.companyName);
        break;
      case 'sector':
        comparison = a.sector.localeCompare(b.sector);
        break;
      case 'dividendYield':
        comparison = a.dividendYield - b.dividendYield;
        break;
      case 'peRatio':
        comparison = a.peRatio - b.peRatio;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleRowClick = (ticker: string) => {
    setSelectedTicker(ticker);
    if (onSelectStock) {
      onSelectStock(ticker);
    }
  };

  const getMarketCapLabel = (marketCap: string) => {
    switch (marketCap) {
      case 'large':
        return 'Large';
      case 'mid':
        return 'Mid';
      case 'small':
        return 'Small';
      default:
        return marketCap;
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-gray-300 transition-colors"
    >
      {label}
      {sortField === field && (
        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  if (stocks.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-800 p-8 text-center">
        <p className="text-gray-600">No stocks found matching your criteria.</p>
        <p className="text-sm text-gray-500 mt-2">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 text-left border-b-2 border-gray-900">
                <SortButton field="ticker" label="Ticker" />
              </th>
              <th className="p-3 text-left border-b-2 border-gray-900">
                <SortButton field="companyName" label="Company" />
              </th>
              <th className="p-3 text-left border-b-2 border-gray-900">
                <SortButton field="sector" label="Sector" />
              </th>
              <th className="p-3 text-left border-b-2 border-gray-900">
                Market Cap
              </th>
              <th className="p-3 text-right border-b-2 border-gray-900">
                <SortButton field="dividendYield" label="Div Yield" />
              </th>
              <th className="p-3 text-right border-b-2 border-gray-900">
                <SortButton field="peRatio" label="P/E Ratio" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock) => (
              <tr
                key={stock.ticker}
                onClick={() => handleRowClick(stock.ticker)}
                className={`
                  border-b border-gray-300 cursor-pointer transition-colors
                  ${selectedTicker === stock.ticker ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
                `}
              >
                <td className="p-3 font-bold font-mono text-blue-600">
                  {stock.ticker}
                </td>
                <td className="p-3 text-gray-900">
                  {stock.companyName}
                </td>
                <td className="p-3 text-gray-700 text-sm">
                  {stock.sector}
                </td>
                <td className="p-3 text-gray-700 text-sm">
                  {getMarketCapLabel(stock.marketCap)}
                </td>
                <td className="p-3 text-right font-mono text-gray-900">
                  {stock.dividendYield.toFixed(2)}%
                </td>
                <td className="p-3 text-right font-mono text-gray-900">
                  {stock.peRatio.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-gray-50 border-t-2 border-gray-300 text-sm text-gray-600">
        Showing {stocks.length} stock{stocks.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
