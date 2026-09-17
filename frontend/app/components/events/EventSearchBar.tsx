'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type EventFilterStatus = 'all' | 'available' | 'upcoming' | 'past' | 'my-events';

export interface EventSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: EventFilterStatus;
  onFilterChange: (filter: EventFilterStatus) => void;
  totalResults?: number;
}

export const EventSearchBar: React.FC<EventSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalResults,
}) => {
  const { isAuthenticated } = useAuth();
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Sync internal state if prop changes externally
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Handle local change and trigger search
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    onSearchChange(val);
  };

  const handleClear = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const filterOptions: { id: EventFilterStatus; label: string; authOnly?: boolean }[] = [
    { id: 'all', label: 'All Events' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'available', label: 'Seats Available' },
    { id: 'past', label: 'Past Events' },
    { id: 'my-events', label: 'Hosted by Me', authOnly: true },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Bar Input Container */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5 text-indigo-400" />
        </div>

        <input
          type="text"
          value={localSearch}
          onChange={handleChange}
          placeholder="Search events by title, keyword, or venue location..."
          className="w-full pl-11 pr-11 py-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner text-sm transition-all"
        />

        {localSearch && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Clear search input"
          >
            <X className="w-4 h-4 p-0.5 rounded-full hover:bg-slate-800" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1 hidden sm:flex shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {filterOptions.map((opt) => {
            if (opt.authOnly && !isAuthenticated) return null;
            const isActive = activeFilter === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => onFilterChange(opt.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        {totalResults !== undefined && (
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 ml-auto">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {totalResults} {totalResults === 1 ? 'event' : 'events'} found
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
