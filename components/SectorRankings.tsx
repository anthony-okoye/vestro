'use client';

import { useState } from 'react';
import SectorCard from './SectorCard';
import DataSourceAttribution from './DataSourceAttribution';

interface SectorRanking {
  sectorName: string;
  score: number;
  rationale: string;
  dataPoints: {
    growthRate?: number;
    marketCap?: number;
    momentum?: number;
  };
}

interface SectorRankingsProps {
  sectors: SectorRanking[];
}

type SortField = 'rank' | 'score' | 'name';
type SortDirection = 'asc' | 'desc';

export default function SectorRankings({ sectors }: SectorRankingsProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSectors = [...sectors].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'score':
        comparison = a.score - b.score;
        break;
      case 'name':
        comparison = a.sectorName.localeCompare(b.sectorName);
        break;
      case 'rank':
      default:
        comparison = b.score - a.score; // Default rank by score descending
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 border-2 border-gray-800 font-bold text-sm transition-colors ${
              viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 border-2 border-gray-800 font-bold text-sm transition-colors ${
              viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Table
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600 font-bold">Sort by:</span>
          <button
            onClick={() => handleSort('rank')}
            className="px-3 py-1 border-2 border-gray-800 bg-white text-gray-900 font-bold text-sm hover:bg-gray-100"
          >
            Rank {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('score')}
            className="px-3 py-1 border-2 border-gray-800 bg-white text-gray-900 font-bold text-sm hover:bg-gray-100"
          >
            Score {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('name')}
            className="px-3 py-1 border-2 border-gray-800 bg-white text-gray-900 font-bold text-sm hover:bg-gray-100"
          >
            Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSectors.map((sector, index) => (
            <SectorCard
              key={sector.sectorName}
              sectorName={sector.sectorName}
              score={sector.score}
              rationale={sector.rationale}
              rank={index + 1}
              dataPoints={sector.dataPoints}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Sector</th>
                <th>Score</th>
                <th>Rationale</th>
                <th>Growth</th>
              </tr>
            </thead>
            <tbody>
              {sortedSectors.map((sector, index) => (
                <tr key={sector.sectorName}>
                  <td className="font-bold">#{index + 1}</td>
                  <td className="font-bold">{sector.sectorName}</td>
                  <td>
                    <span className="font-mono font-bold">
                      {sector.score.toFixed(0)}
                    </span>
                  </td>
                  <td className="text-sm">{sector.rationale}</td>
                  <td className="font-mono">
                    {sector.dataPoints.growthRate !== undefined
                      ? `${sector.dataPoints.growthRate.toFixed(1)}%`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Data Source Attribution */}
      <DataSourceAttribution
        sources={[
          {
            name: 'Yahoo Finance Sectors',
            url: 'https://finance.yahoo.com/sectors',
            timestamp: new Date(),
            description: 'Sector performance and market data'
          },
          {
            name: 'McKinsey Industry Reports',
            url: 'https://www.mckinsey.com/industries',
            description: 'Industry analysis and growth trends'
          },
          {
            name: 'PwC Global Industries',
            url: 'https://www.pwc.com/gx/en/industries.html',
            description: 'Global industry insights'
          }
        ]}
        compact={true}
      />
    </div>
  );
}
