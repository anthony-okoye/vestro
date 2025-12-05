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
  multiSelect?: boolean;
}

type SortField = 'ticker' | 'companyName' | 'sector' | 'dividendYield' | 'peRatio';
type SortDirection = 'asc' | 'desc';

export default function StockTable({ stocks, onSelectStock, multiSelect = false }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);

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
    if (multiSelect) {
      const newSelected = new Set(selectedTickers);
      if (newSelected.has(ticker)) {
        newSelected.delete(ticker);
      } else {
        newSelected.add(ticker);
      }
      setSelectedTickers(newSelected);
    } else {
      setSelectedTickers(new Set([ticker]));
    }
    
    if (onSelectStock) {
      onSelectStock(ticker);
    }
  };

  const getMarketCapBadge = (marketCap: string) => {
    const configs = {
      large: { label: 'Large', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🏛️' },
      mid: { label: 'Mid', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '🏢' },
      small: { label: 'Small', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '🏠' }
    };
    const config = configs[marketCap as keyof typeof configs] || configs.mid;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-purple-400 transition-colors group"
    >
      {label}
      <span className={`transition-all duration-200 ${
        sortField === field 
          ? 'text-purple-400' 
          : 'text-gray-600 group-hover:text-gray-400'
      }`}>
        {sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );

  if (stocks.length === 0) {
    return (
      <div className="panel text-center py-12 animate-fade-in-up">
        <div className="text-6xl mb-4 ghost-float">👻</div>
        <p className="text-gray-400 text-lg mb-2">No spirits found</p>
        <p className="text-sm text-gray-500">Try adjusting your summoning filters</p>
      </div>
    );
  }

  return (
    <div className="panel p-0 overflow-hidden animate-fade-in-up">
      {/* Selection Summary */}
      {selectedTickers.size > 0 && (
        <div className="px-4 py-3 bg-purple-500/10 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">✨</span>
            <span className="text-sm text-purple-300">
              {selectedTickers.size} stock{selectedTickers.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button 
            onClick={() => setSelectedTickers(new Set())}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800/80">
              {multiSelect && (
                <th className="p-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedTickers.size === stocks.length}
                    onChange={() => {
                      if (selectedTickers.size === stocks.length) {
                        setSelectedTickers(new Set());
                      } else {
                        setSelectedTickers(new Set(stocks.map(s => s.ticker)));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                  />
                </th>
              )}
              <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <SortButton field="ticker" label="Ticker" />
              </th>
              <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <SortButton field="companyName" label="Company" />
              </th>
              <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                <SortButton field="sector" label="Sector" />
              </th>
              <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Market Cap
              </th>
              <th className="p-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <SortButton field="dividendYield" label="Yield" />
              </th>
              <th className="p-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <SortButton field="peRatio" label="P/E" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock, index) => {
              const isSelected = selectedTickers.has(stock.ticker);
              const isHovered = hoveredTicker === stock.ticker;
              
              return (
                <tr
                  key={stock.ticker}
                  onClick={() => handleRowClick(stock.ticker)}
                  onMouseEnter={() => setHoveredTicker(stock.ticker)}
                  onMouseLeave={() => setHoveredTicker(null)}
                  className={`
                    cursor-pointer transition-all duration-200 border-b border-gray-800/50
                    ${isSelected 
                      ? 'bg-purple-500/10' 
                      : isHovered 
                        ? 'bg-gray-800/50' 
                        : 'bg-transparent'
                    }
                  `}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.3s ease-out forwards'
                  }}
                >
                  {multiSelect && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                      />
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="text-green-400 animate-pulse">✓</span>
                      )}
                      <span className={`font-mono font-bold transition-colors duration-200 ${
                        isSelected ? 'text-green-400' : isHovered ? 'text-purple-400' : 'text-blue-400'
                      }`}>
                        {stock.ticker}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-200">{stock.companyName}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-gray-400 text-sm">{stock.sector}</span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    {getMarketCapBadge(stock.marketCap)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-mono ${
                      stock.dividendYield >= 3 
                        ? 'text-green-400' 
                        : stock.dividendYield >= 1 
                          ? 'text-yellow-400' 
                          : 'text-gray-400'
                    }`}>
                      {stock.dividendYield.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-mono ${
                      stock.peRatio <= 15 
                        ? 'text-green-400' 
                        : stock.peRatio <= 25 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                    }`}>
                      {stock.peRatio.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-700/50 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          👻 {stocks.length} spirit{stocks.length !== 1 ? 's' : ''} summoned
        </span>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Good
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Fair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            High
          </span>
        </div>
      </div>
    </div>
  );
}
