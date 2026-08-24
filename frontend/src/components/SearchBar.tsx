import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package as PackageIcon, ArrowRight } from 'lucide-react';
import { api } from '../api/client.js';
import { PackageNode } from '../types/index.js';

interface SearchBarProps {
  onSelectPackage: (packageName: string) => void;
  selectedPackage?: string | null;
  onError: (msg: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectPackage,
  selectedPackage,
  onError,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PackageNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query when selectedPackage changes externally
  useEffect(() => {
    if (selectedPackage) {
      setQuery(selectedPackage);
    }
  }, [selectedPackage]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchPackages(query);
        setResults(data);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (err: any) {
        onError(err.message || 'Failed to search packages');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, onError]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex].name);
      } else if (results.length > 0) {
        handleSelect(results[0].name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    setIsOpen(false);
    onSelectPackage(name);
  };

  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M/wk`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K/wk`;
    return `${num}/wk`;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-30">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search npm packages (e.g. next, react, express, vite, jest)..."
          className="w-full pl-12 pr-10 py-3 bg-slate-900/90 text-white placeholder-slate-400 rounded-xl border border-slate-700/80 shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base backdrop-blur-md transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md px-2 py-1 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#111728] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              No packages found matching &quot;{query}&quot;
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {results.map((pkg, idx) => {
                const isSelected = idx === highlightedIndex;
                return (
                  <li
                    key={pkg.id || pkg.name}
                    onClick={() => handleSelect(pkg.name)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-indigo-950/60 text-white' : 'hover:bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                        <PackageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm tracking-wide text-white">{pkg.name}</span>
                          <span className="text-xs text-slate-400 font-mono">v{pkg.version}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-md mt-0.5">
                          {pkg.description || 'No description available'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div className="hidden sm:block">
                        <span className="text-xs font-mono text-indigo-300 font-medium">
                          {formatDownloads(pkg.weeklyDownloads)}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase">{pkg.license}</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-400 translate-x-1' : 'text-slate-600'}`} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
